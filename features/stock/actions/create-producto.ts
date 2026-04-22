"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { TALLE_OPTIONS } from "@/entities/productos/constants";
import { slugify } from "@/shared/utils/sluglify";

export async function crearProductoAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
) {
  const nombre = formData.get("nombre") as string;
  const temporada = formData.get("temporada") as string;
  const tipo = formData.get("tipo") as string;
  const precio = Number.parseFloat(formData.get("precio") as string);
  const precio_costo = Number.parseFloat(
    formData.get("precio_costo") as string,
  );

  const archivos = formData.getAll("imagenes") as File[];

  if (
    !nombre ||
    !temporada ||
    !tipo ||
    Number.isNaN(precio) ||
    Number.isNaN(precio_costo)
  ) {
    return {
      error: "Por favor completa todos los campos obligatorios.",
      success: false,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let imagen_url = null;

  // 1. Subimos las imágenes a Supabase Storage
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
      } else {
        console.error("Error subiendo archivo:", uploadError);
      }
    }

    if (urls.length > 0) {
      imagen_url = JSON.stringify(urls);
    }
  }

  // 2. Generamos el Slug amigable para la URL de la tienda
  let slug = slugify(`${nombre}-${tipo}-${temporada}`);
  const sufijo = Math.random().toString(36).substring(2, 6);
  slug = `${slug}-${sufijo}`;

  // 3. Insertamos el producto en la tabla principal
  const { data: nuevoProducto, error: errorProducto } = await supabase
    .from("productos")
    .insert({
      nombre,
      temporada,
      tipo,
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

  // 4. Preparamos el stock por talle
  const stockParaInsertar = TALLE_OPTIONS.filter((opt) => opt.value !== "todos")
    .map((opt) => {
      const cantidadStr = formData.get(`stock_${opt.value}`) as string;
      const cantidad = Number.parseInt(cantidadStr, 10);
      return {
        producto_id: nuevoProducto.id,
        variante: opt.value,
        cantidad: Number.isNaN(cantidad) ? 0 : cantidad,
      };
    })
    .filter((stock) => stock.cantidad > 0);

  if (stockParaInsertar.length > 0) {
    const { error: errorStock } = await supabase
      .from("productos_stock")
      .insert(stockParaInsertar);

    if (errorStock) {
      console.error(errorStock);
      return {
        error:
          "Producto creado, pero hubo un error al guardar las cantidades de stock.",
        success: false,
      };
    }
  }

  revalidatePath("/stock");
  revalidatePath("/store");

  return { error: null, success: true };
}
