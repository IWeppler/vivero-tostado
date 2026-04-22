"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function registrarVentaAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
) {
  const cartData = formData.get("cart_items") as string;

  if (!cartData) {
    return { error: "El carrito de ventas está vacío.", success: false };
  }

  const items = JSON.parse(cartData) as {
    productoId: string;
    variante: string;
    cantidad: number;
    precioUnitario: number;
  }[];

  if (items.length === 0) {
    return {
      error: "Agrega al menos una camiseta a la lista para confirmar la venta.",
      success: false,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Arreglo para guardar la información procesada (evita hacer dobles consultas a la BD)
  const itemsProcesados = [];

  // 1. Verificamos el stock de TODOS los items y obtenemos el costo real (para no registrar ventas a medias)
  for (const item of items) {
    // Usamos la relación para traer el stock Y el precio_costo actual de la camiseta en una sola consulta
    const { data: stockActual, error: stockError } = await supabase
      .from("productos_stock")
      .select("cantidad, id, producto:productos(precio_costo)")
      .eq("producto_id", item.productoId)
      .eq("variante", item.variante)
      .single();

    if (stockError || !stockActual) {
      return {
        error: `No se encontró stock registrado para el talle ${item.variante}.`,
        success: false,
      };
    }

    if (stockActual.cantidad < item.cantidad) {
      return {
        error: `Stock insuficiente en talle ${item.variante}. Solo quedan ${stockActual.cantidad} unidades.`,
        success: false,
      };
    }

    // Extraemos el costo de forma segura
    const precioCostoReal = (stockActual.producto as any)?.precio_costo || 0;

    itemsProcesados.push({
      ...item,
      stockId: stockActual.id,
      stockOriginal: stockActual.cantidad,
      precioCosto: precioCostoReal,
    });
  }

  // 2. Si el stock está OK, procesamos todas las ventas y descontamos el stock
  for (const item of itemsProcesados) {
    // A) Registramos la venta en el historial congelando AMBOS precios (venta y costo)
    const { error: ventaError } = await supabase.from("ventas").insert({
      producto_id: item.productoId,
      variante: item.variante,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
      precio_costo: item.precioCosto,
    });

    if (ventaError) {
      console.error(ventaError);
      return {
        error: "Hubo un error al registrar las ventas en la base de datos.",
        success: false,
      };
    }

    const { error: updateError } = await supabase
      .from("productos_stock")
      .update({ cantidad: item.stockOriginal - item.cantidad })
      .eq("id", item.stockId);

    if (updateError) {
      console.error(updateError);
      return {
        error: "Venta registrada, pero no se pudo actualizar el stock.",
        success: false,
      };
    }
  }

  revalidatePath("/ventas");
  revalidatePath("/stock");

  return { error: null, success: true };
}
