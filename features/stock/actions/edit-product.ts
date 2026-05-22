"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { slugify } from "@/shared/utils/slugify";

export async function editarProductoAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
) {
  const id = formData.get("id") as string;
  const nombre = formData.get("nombre") as string;

  const categoriaForm = formData.get("categoria") as string;

  const precio = Number.parseFloat(formData.get("precio") as string);
  const precio_costo = Number.parseFloat(
    formData.get("precio_costo") as string,
  );
  const descripcion = formData.get("descripcion") as string;

  const archivos = formData.getAll("imagenes") as File[];

  if (
    !id ||
    !nombre ||
    !categoriaForm ||
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

  let slug = slugify(`${nombre}-${categoriaForm}`);
  const sufijo = Math.random().toString(36).substring(2, 6);
  slug = `${slug}-${sufijo}`;

  const updateData: any = {
    nombre,
    tipo: categoriaForm,
    precio,
    precio_costo,
    slug,
  };

  if (descripcion) updateData.descripcion = descripcion;
  if (imagen_url !== undefined) updateData.imagen_url = imagen_url;

  const { error: errorProducto } = await supabase
    .from("productos")
    .update(updateData)
    .eq("id", id);

  if (errorProducto) {
    console.error("Error BD:", errorProducto);
    return {
      error: "Hubo un error al actualizar el producto en la base de datos.",
      success: false,
    };
  }

  const stockParaUpsert: any[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("stock_")) {
      const variante = key.replace("stock_", "");
      const cantidad = Number.parseInt(value as string, 10);

      stockParaUpsert.push({
        producto_id: id,
        variante: variante,
        cantidad: Number.isNaN(cantidad) ? 0 : cantidad,
      });
    }
  }

  if (stockParaUpsert.length > 0) {
    const { error: errorStock } = await supabase
      .from("productos_stock")
      .upsert(stockParaUpsert, { onConflict: "producto_id, variante" });

    if (errorStock) {
      console.error("Error Stock BD:", errorStock);
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
