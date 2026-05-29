"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function registrarVentaAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
) {
  const cartData = formData.get("cart_items") as string;
  const metodoPago = (formData.get("metodo_pago") as string) || "EFECTIVO";

  // Capturamos los datos de la promoción enviados desde el carrito
  const promocionId = formData.get("promocion_id") as string | null;
  const descuentoMonto = Number(formData.get("descuento_monto") || 0);

  if (!cartData) {
    return { error: "El carrito de ventas está vacío.", success: false };
  }

  const items = JSON.parse(cartData) as any[];

  if (items.length === 0) {
    return { error: "Agrega al menos un producto a la lista.", success: false };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
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

  // --- 🚨 BLOQUEO ESTRICTO DE CAJA 🚨 ---
  const { data: turnoAbierto } = await supabase
    .from("turnos_caja")
    .select("id")
    .eq("estado", "ABIERTO")
    .limit(1)
    .single();

  if (!turnoAbierto) {
    // Retornamos un código de error específico para que la UI lo entienda
    return { error: "CAJA_CERRADA", success: false };
  }
  // --------------------------------------

  // 1. Validar Stock y recuperar costos
  const itemsProcesados = [];
  let totalVenta = 0;
  let costoTotalVenta = 0;

  for (const item of items) {
    const productoIdReal = item.productoId ?? item.id;

    const { data: stockActual, error: stockError } = await supabase
      .from("productos_stock")
      .select("cantidad, id, producto:productos(precio_costo)")
      .eq("producto_id", productoIdReal)
      .eq("variante", item.variante)
      .single();

    if (stockError || !stockActual) {
      return { error: `Error de stock para ${item.variante}.`, success: false };
    }

    const precioCostoReal = Number(
      (stockActual.producto as any)?.precio_costo || 0,
    );

    const precioFinal = Number(item.precioUnitario ?? item.precio ?? 0);
    const cantidadFinal = Number(item.cantidad ?? 1);

    totalVenta += precioFinal * cantidadFinal;
    costoTotalVenta += precioCostoReal * cantidadFinal;

    itemsProcesados.push({
      productoId: productoIdReal,
      variante: item.variante,
      cantidad: cantidadFinal,
      stockId: stockActual.id,
      stockOriginal: stockActual.cantidad,
      precioCosto: precioCostoReal,
      precioUnitario: precioFinal,
    });
  }

  const totalSeguro = isNaN(totalVenta) ? 0 : totalVenta;
  const costoSeguro = isNaN(costoTotalVenta) ? 0 : costoTotalVenta;

  // Calculamos el Total Final descontando la promoción (El mínimo es 0)
  const totalConDescuento = Math.max(
    0,
    totalSeguro - (isNaN(descuentoMonto) ? 0 : descuentoMonto),
  );

  // 2. CREAR LA CABECERA (El Ticket único)
  const { data: nuevaVenta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      vendedor_id: user.id,
      metodo_pago: metodoPago,
      total: totalConDescuento, // Guardamos el total con el descuento aplicado
      precio_costo: costoSeguro,
      cantidad: items.length,
    })
    .select("id")
    .single();

  if (ventaError || !nuevaVenta) {
    console.error("Error creando cabecera:", ventaError);
    return { error: "No se pudo crear el ticket de venta.", success: false };
  }

  // --- NUEVO: REGISTRAR EL DESCUENTO SI EXISTE ---
  if (promocionId && descuentoMonto > 0) {
    // Buscamos los datos de la promoción para dejar el registro inmutable
    const { data: promoData } = await supabase
      .from("promociones")
      .select("nombre, tipo_descuento, usos_actuales")
      .eq("id", promocionId)
      .single();

    if (promoData) {
      // Guardamos la trazabilidad
      await supabase.from("ventas_descuentos").insert({
        venta_id: nuevaVenta.id,
        promocion_id: promocionId,
        promocion_nombre: promoData.nombre,
        tipo_descuento: promoData.tipo_descuento,
        monto_descontado: descuentoMonto,
      });

      // Actualizamos el contador de usos de la promoción
      await supabase
        .from("promociones")
        .update({
          usos_actuales: (promoData.usos_actuales || 0) + 1,
        })
        .eq("id", promocionId);
    }
  }
  // -----------------------------------------------

  // 3. CREAR LOS DETALLES (ventas_items)
  const insertItems = itemsProcesados.map((item) => ({
    venta_id: nuevaVenta.id,
    producto_id: item.productoId,
    variante: item.variante,
    cantidad: item.cantidad,
    precio_unitario: item.precioUnitario,
    precio_costo: item.precioCosto,
  }));

  const { error: itemsError } = await supabase
    .from("ventas_items")
    .insert(insertItems);

  if (itemsError) {
    console.error("Error insertando detalles:", itemsError);
    return {
      error: "Error al guardar los productos en el ticket.",
      success: false,
    };
  }

  // 4. DESCONTAR STOCK
  for (const item of itemsProcesados) {
    await supabase
      .from("productos_stock")
      .update({ cantidad: item.stockOriginal - item.cantidad })
      .eq("id", item.stockId);
  }

  // Refrescamos las rutas para que la tabla de ventas y caja se actualicen
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
