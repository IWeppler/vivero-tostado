"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ItemResuelto } from "@/entities/compras/types";

type SupabaseDb = ReturnType<typeof createClient>;

// 1. Obtener los datos para la pantalla de Merge
export async function getOrdenParaMergeAction(ordenId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [ordenRes, itemsRes, productosRes] = await Promise.all([
    supabase.from("ordenes_compra").select("*").eq("id", ordenId).single(),
    supabase.from("ordenes_items").select("*").eq("orden_id", ordenId),
    supabase
      .from("productos")
      .select("id, nombre, precio, precio_costo, tipo, cuidados")
      .eq("publicado", true),
  ]);

  if (ordenRes.error || !ordenRes.data) {
    return { error: "Orden no encontrada." };
  }

  return {
    orden: ordenRes.data,
    items: itemsRes.data || [],
    productos: productosRes.data || [],
  };
}

async function actualizarPrecios(item: ItemResuelto, supabase: SupabaseDb) {
  if (!item.precio_venta_actualizado && !item.precio_costo) return;

  const updateData: { precio_costo?: number; precio?: number } = {};

  if (item.precio_costo) updateData.precio_costo = item.precio_costo;
  if (item.precio_venta_actualizado)
    updateData.precio = item.precio_venta_actualizado;

  await supabase
    .from("productos")
    .update(updateData)
    .eq("id", item.producto_id);
}

async function actualizarStock(item: ItemResuelto, supabase: SupabaseDb) {
  const { data: stockExistente } = await supabase
    .from("productos_stock")
    .select("id, cantidad")
    .eq("producto_id", item.producto_id)
    .eq("variante", item.variante_match)
    .single();

  if (stockExistente) {
    await supabase
      .from("productos_stock")
      .update({ cantidad: stockExistente.cantidad + item.cantidad })
      .eq("id", stockExistente.id);
  } else {
    await supabase.from("productos_stock").insert({
      producto_id: item.producto_id,
      variante: item.variante_match,
      cantidad: item.cantidad,
    });
  }
}

async function registrarAliasDiccionario(
  item: ItemResuelto,
  proveedor: string,
  supabase: SupabaseDb,
) {
  if (
    item.estado_match === "DESCONOCIDO" ||
    item.estado_match === "NUEVO_ALIAS"
  ) {
    await supabase.from("diccionario_alias").upsert(
      {
        proveedor,
        raw_nombre: item.raw_nombre.trim().toLowerCase(),
        producto_id: item.producto_id,
      },
      { onConflict: "proveedor, raw_nombre" },
    );
  }
}

// --------------------------------------------------------------------------

// 2. Aprobar e Impactar la Orden en la BD (Completamente Tipado)
export async function aprobarOrdenAction(
  ordenId: string,
  proveedor: string,
  itemsResueltos: ItemResuelto[], // 💡 Eliminamos el `any[]`
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  try {
    for (const item of itemsResueltos) {
      if (!item.producto_id) continue;

      // Código súper limpio y fácil de leer
      await actualizarPrecios(item, supabase);
      await actualizarStock(item, supabase);
      await registrarAliasDiccionario(item, proveedor, supabase);
    }

    await supabase
      .from("ordenes_compra")
      .update({ estado: "APROBADA" })
      .eq("id", ordenId);

    revalidatePath("/stock");
    revalidatePath("/compras");

    return { success: true };
  } catch (error) {
    console.error("Error al aprobar orden:", error);
    return { error: "Hubo un error al impactar los datos en el sistema." };
  }
}
