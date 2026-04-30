"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { TODAS_LAS_VARIANTES } from "@/entities/productos/constants";
import { slugify } from "@/shared/utils/slugify";

type UpdateProductoData = {
  nombre: string;
  categoria: string;
  cuidados: string;
  precio: number;
  precio_costo: number;
  slug: string;
  imagen_url?: string;
};

export async function editarProductoAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
) {
  const id = formData.get("id") as string;
  const nombre = formData.get("nombre") as string;
  const categoria = formData.get("categoria") as string;
  const cuidados = formData.get("cuidados") as string;
  const precio = Number.parseFloat(formData.get("precio") as string);
  const precio_costo = Number.parseFloat(
    formData.get("precio_costo") as string,
  );

  const archivos = formData.getAll("imagenes") as File[];

  if (
    !id ||
    !nombre ||
    !categoria ||
    !cuidados ||
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

  let imagen_url: string | undefined = undefined;

  // Las imágenes ya vienen livianas (optimizadas a WebP) desde el cliente
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

    if (urls.length > 0) {
      imagen_url = JSON.stringify(urls);
    }
  }

  // 1. Generamos el nuevo Slug
  let slug = slugify(`${nombre}-${categoria}-${cuidados}`);
  const sufijo = Math.random().toString(36).substring(2, 6);
  slug = `${slug}-${sufijo}`;

  // 2. Preparamos los datos a actualizar
  const updateData: UpdateProductoData = {
    nombre,
    categoria,
    cuidados,
    precio,
    precio_costo,
    slug,
  };

  if (imagen_url !== undefined) {
    updateData.imagen_url = imagen_url;
  }

  // 3. Actualizamos el producto base
  const { error: errorProducto } = await supabase
    .from("productos")
    .update(updateData)
    .eq("id", id);

  if (errorProducto) {
    console.error(errorProducto);
    return {
      error: "Hubo un error al actualizar el producto.",
      success: false,
    };
  }

  // 4. Actualizamos el stock (Usando el array seguro anti-crasheos)
  const stockParaUpsert: {
    producto_id: string;
    variante: string;
    cantidad: number;
  }[] = [];

  TODAS_LAS_VARIANTES.forEach((varianteValor) => {
    const cantidadStr = formData.get(`stock_${varianteValor}`) as string;

    if (cantidadStr) {
      const cantidad = Number.parseInt(cantidadStr, 10);
      if (!Number.isNaN(cantidad)) {
        stockParaUpsert.push({
          producto_id: id,
          variante: varianteValor,
          cantidad,
        });
      }
    }
  });

  if (stockParaUpsert.length > 0) {
    const { error: errorStock } = await supabase
      .from("productos_stock")
      .upsert(stockParaUpsert, { onConflict: "producto_id, variante" });

    if (errorStock) {
      console.error(errorStock);
      return {
        error: "Producto actualizado, pero hubo un error con el stock.",
        success: false,
      };
    }
  }

  revalidatePath("/stock");
  revalidatePath("/store");

  return { error: null, success: true };
}
