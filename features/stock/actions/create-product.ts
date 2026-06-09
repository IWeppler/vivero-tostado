"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { slugify } from "@/shared/utils/slugify";

export async function crearProductoAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
) {
  const nombre = formData.get("nombre") as string;
  const categoria_id = formData.get("categoria_id") as string;
  const descripcion = formData.get("descripcion") as string;
  const precio = Number.parseFloat(formData.get("precio") as string);
  const precio_costo = Number.parseFloat(
    formData.get("precio_costo") as string,
  );

  const tieneVariantes = formData.get("tieneVariantes") === "true";
  const stockBase = Number.parseInt(
    (formData.get("stockBase") as string) || "0",
  );

  const archivos = formData.getAll("imagenes") as File[];

  if (!nombre || Number.isNaN(precio) || Number.isNaN(precio_costo)) {
    return {
      error: "Por favor completa los campos básicos obligatorios.",
      success: false,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fallback temporal para la columna "tipo" vieja
  let tipo = "Interior";
  if (categoria_id) {
    const { data: cat } = await supabase
      .from("categorias")
      .select("nombre")
      .eq("id", categoria_id)
      .single();
    if (cat) tipo = cat.nombre;
  }

  // 1. Subir imágenes
  let imagen_url = null;
  const validFiles = archivos.filter((f) => f.size > 0);
  if (validFiles.length > 0) {
    const urls = [];
    for (const file of validFiles) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("productos")
        .upload(fileName, file);
      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("productos").getPublicUrl(fileName);
        urls.push(publicUrl);
      }
    }
    if (urls.length > 0) imagen_url = JSON.stringify(urls);
  }

  let slug = slugify(`${nombre}-${tipo}`);
  const sufijo = Math.random().toString(36).substring(2, 6);
  slug = `${slug}-${sufijo}`;

  // 2. Insertar Cabecera de Producto
  const { data: nuevoProducto, error: errorProducto } = await supabase
    .from("productos")
    .insert({
      nombre,
      tipo, // Fallback legacy
      categoria_id: categoria_id || null, // Nueva FK
      descripcion,
      precio,
      precio_costo,
      imagen_url,
      slug,
      publicado: true,
    })
    .select("id")
    .single();

  if (errorProducto || !nuevoProducto) {
    console.error(errorProducto);
    return {
      error: "Hubo un error al crear el producto base.",
      success: false,
    };
  }

  // 3. Procesar Opciones y Variantes
  if (!tieneVariantes) {
    // Si es un producto simple, creamos una variante "Única" invisible
    await supabase.from("producto_variantes").insert({
      producto_id: nuevoProducto.id,
      nombre_display: "Único",
      precio: null, // Hereda del padre
      costo: null, // Hereda del padre
      stock: stockBase,
    });

    // Mantenemos legacy stock table para no romper la app vieja
    await supabase.from("productos_stock").insert({
      producto_id: nuevoProducto.id,
      variante: "Único",
      cantidad: stockBase,
    });
  } else {
    // Producto con opciones dinámicas
    const opcionesStr = formData.get("opciones") as string;
    const variantesStr = formData.get("variantes") as string;

    if (opcionesStr && variantesStr) {
      const opciones = JSON.parse(opcionesStr) as {
        nombre: string;
        valores: string[];
      }[];
      const variantes = JSON.parse(variantesStr) as any[];

      const attrMap: Record<string, string> = {};
      const valMap: Record<string, Record<string, string>> = {};

      // A. Crear o reciclar Opciones (Atributos) y sus Valores en la DB Global
      for (const op of opciones) {
        const slugAttr = slugify(op.nombre);

        let { data: attr } = await supabase
          .from("atributos")
          .select("id")
          .eq("slug", slugAttr)
          .single();
        if (!attr) {
          const { data: newAttr } = await supabase
            .from("atributos")
            .insert({
              nombre: op.nombre,
              slug: slugAttr,
              tipo: "TEXT",
              activo: true,
            })
            .select("id")
            .single();
          attr = newAttr;
        }

        if (attr) {
          attrMap[op.nombre] = attr.id;
          valMap[op.nombre] = {};

          for (const v of op.valores) {
            const slugVal = slugify(v);
            let { data: valData } = await supabase
              .from("atributo_valores")
              .select("id")
              .eq("atributo_id", attr.id)
              .eq("slug", slugVal)
              .single();
            if (!valData) {
              const { data: newVal } = await supabase
                .from("atributo_valores")
                .insert({
                  atributo_id: attr.id,
                  valor: v,
                  slug: slugVal,
                  activo: true,
                })
                .select("id")
                .single();
              valData = newVal;
            }
            if (valData) valMap[op.nombre][v] = valData.id;
          }
        }
      }

      // B. Guardar las Variantes concretas que armó el usuario
      for (const v of variantes) {
        // Ordenamos el nombre para que quede lindo (Ej: "Rojo / S") basándonos en el orden de las opciones
        const nombreDisplay = opciones
          .map((op) => v.valores[op.nombre])
          .filter(Boolean)
          .join(" / ");

        const vPrecio = v.precio ? Number.parseFloat(v.precio) : null;
        const vCosto = v.precio_costo
          ? Number.parseFloat(v.precio_costo)
          : null;
        const vStock = Number.parseInt(v.stock || "0");

        const { data: varData } = await supabase
          .from("producto_variantes")
          .insert({
            producto_id: nuevoProducto.id,
            nombre_display: nombreDisplay,
            precio: vPrecio,
            costo: vCosto,
            stock: vStock,
            sku: v.sku || null,
          })
          .select("id")
          .single();

        if (varData) {
          // Relacionar la variante creada con los valores específicos
          const varValores = [];
          for (const [opNombre, opValor] of Object.entries(v.valores)) {
            const aId = attrMap[opNombre];
            const avId = valMap[opNombre]?.[opValor as string];
            if (aId && avId) {
              varValores.push({
                variante_id: varData.id,
                atributo_id: aId,
                atributo_valor_id: avId,
              });
            }
          }
          if (varValores.length > 0) {
            await supabase.from("producto_variante_valores").insert(varValores);
          }
        }

        // Mantenemos legacy stock table para no romper la app vieja
        await supabase.from("productos_stock").insert({
          producto_id: nuevoProducto.id,
          variante: nombreDisplay,
          cantidad: vStock,
        });
      }
    }
  }

  revalidatePath("/stock");
  revalidatePath("/store");

  return { error: null, success: true };
}