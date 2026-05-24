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
      error: "Agrega al menos un producto a la lista para confirmar la venta.",
      success: false,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Obtenemos el usuario autenticado (ADMIN o VENDEDOR)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: "Debes iniciar sesión para realizar una venta.",
      success: false,
    };
  }

  const itemsProcesados = [];

  for (const item of items) {
    const { data: stockActual, error: stockError } = await supabase
      .from("productos_stock")
      .select("cantidad, id, producto:productos(precio_costo)")
      .eq("producto_id", item.productoId)
      .eq("variante", item.variante)
      .single();

    if (stockError || !stockActual) {
      return {
        error: `Error de stock para ${item.variante}: ${stockError?.message || "No encontrado"}`,
        success: false,
      };
    }

    if (stockActual.cantidad < item.cantidad) {
      return {
        error: `Stock insuficiente en variante ${item.variante}. Solo quedan ${stockActual.cantidad} unidades.`,
        success: false,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const { error: ventaError } = await supabase.from("ventas").insert({
      producto_id: item.productoId,
      variante: item.variante,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
      precio_costo: item.precioCosto,
      vendedor_id: user.id, // Asignamos el ID del vendedor a la venta
    });

    if (ventaError) {
      console.error("Error insertando venta:", ventaError);
      return {
        // Mostramos el mensaje exacto de Supabase para depurar si es RLS
        error: `Error al registrar venta: ${ventaError.message}`,
        success: false,
      };
    }

    const { error: updateError } = await supabase
      .from("productos_stock")
      .update({ cantidad: item.stockOriginal - item.cantidad })
      .eq("id", item.stockId);

    if (updateError) {
      console.error("Error actualizando stock:", updateError);
      return {
        error: `Error al actualizar stock: ${updateError.message}`,
        success: false,
      };
    }
  }

  revalidatePath("/", "layout");

  return { error: null, success: true };
}