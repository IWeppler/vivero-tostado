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

  // --- BLOQUEO ESTRICTO DE CAJA ---
  const { data: turnoAbierto } = await supabase
    .from("turnos_caja")
    .select("id")
    .eq("estado", "ABIERTO")
    .limit(1)
    .single();

  if (!turnoAbierto) {
    return { error: "CAJA_CERRADA", success: false };
  }

  // --- PRE-CARGA DE PROMOCIÓN (Para distribuir el descuento correctamente) ---
  let promoData = null;
  let categoriasPromo: string[] = [];

  if (promocionId && descuentoMonto > 0) {
    const { data: promo } = await supabase
      .from("promociones")
      .select(
        "nombre, tipo_descuento, valor_descuento, tipo_regla, usos_actuales",
      )
      .eq("id", promocionId)
      .single();

    if (promo) {
      promoData = promo;
      if (promo.tipo_regla === "CATEGORIA") {
        const { data: cats } = await supabase
          .from("promociones_categorias")
          .select("categoria_nombre")
          .eq("promocion_id", promocionId);
        if (cats)
          categoriasPromo = cats.map((c) => c.categoria_nombre.toLowerCase());
      }
    }
  }

  // Identificamos cuánto suman los productos elegibles para prorratear el descuento
  let totalElegible = 0;
  items.forEach((item) => {
    let elegible = false;
    if (!promoData || promoData.tipo_regla !== "CATEGORIA") {
      elegible = true;
    } else {
      elegible = categoriasPromo.includes((item.tipo || "").toLowerCase());
    }
    if (elegible) {
      totalElegible +=
        Number(item.precioUnitario ?? item.precio ?? 0) *
        Number(item.cantidad ?? 1);
    }
  });

  // --- 1. Validar Stock, Costos y Prorratear Descuentos ---
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
    const precioUnitario = Number(item.precioUnitario ?? item.precio ?? 0);
    const cantidadFinal = Number(item.cantidad ?? 1);

    // Lógica de Descuento por Línea (Prorrateo Matemático)
    let elegible = false;
    if (!promoData || promoData.tipo_regla !== "CATEGORIA") elegible = true;
    else elegible = categoriasPromo.includes((item.tipo || "").toLowerCase());

    let itemDescuentoMonto = 0;
    let itemPrecioFinal = precioUnitario;

    if (promoData && elegible && totalElegible > 0) {
      const pesoItem = (precioUnitario * cantidadFinal) / totalElegible;
      const descuentoTotalLinea = descuentoMonto * pesoItem;
      itemDescuentoMonto = descuentoTotalLinea / cantidadFinal;
      itemPrecioFinal = precioUnitario - itemDescuentoMonto;
    }

    totalVenta += precioUnitario * cantidadFinal;
    costoTotalVenta += precioCostoReal * cantidadFinal;

    itemsProcesados.push({
      productoId: productoIdReal,
      variante: item.variante,
      cantidad: cantidadFinal,
      stockId: stockActual.id,
      stockOriginal: stockActual.cantidad,
      precioCosto: precioCostoReal,
      precioUnitario: precioUnitario,
      descuentoMonto: itemDescuentoMonto,
      precioFinal: itemPrecioFinal,
    });
  }

  const totalSeguro = isNaN(totalVenta) ? 0 : totalVenta;
  const costoSeguro = isNaN(costoTotalVenta) ? 0 : costoTotalVenta;
  const totalConDescuento = Math.max(
    0,
    totalSeguro - (isNaN(descuentoMonto) ? 0 : descuentoMonto),
  );

  // --- 2. CREAR LA CABECERA (ventas) ---
  const { data: nuevaVenta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      vendedor_id: user.id,
      metodo_pago: metodoPago,
      total: totalConDescuento,
      precio_costo: costoSeguro,
      cantidad: items.length,
    })
    .select("id")
    .single();

  if (ventaError || !nuevaVenta) {
    return { error: "No se pudo crear el ticket de venta.", success: false };
  }

  // --- 3. REGISTRAR TRAZABILIDAD DEL DESCUENTO ---
  if (promocionId && descuentoMonto > 0 && promoData) {
    const { error: descError } = await supabase
      .from("ventas_descuentos")
      .insert({
        venta_id: nuevaVenta.id,
        promocion_id: promocionId,
        promocion_nombre: promoData.nombre,
        tipo_descuento: promoData.tipo_descuento,
        monto_descontado: descuentoMonto,
      });

    if (descError) console.error("Fallo insertando trazabilidad:", descError);

    const { error: updatePromoError } = await supabase
      .from("promociones")
      .update({
        usos_actuales: (promoData.usos_actuales || 0) + 1,
      })
      .eq("id", promocionId);

    if (updatePromoError)
      console.error("Fallo sumando uso de promo:", updatePromoError);
  }

  // --- 4. CREAR LOS DETALLES (ventas_items) ---
  const insertItems = itemsProcesados.map((item) => ({
    venta_id: nuevaVenta.id,
    producto_id: item.productoId,
    variante: item.variante,
    cantidad: item.cantidad,
    precio_unitario: item.precioUnitario,
    precio_costo: item.precioCosto,
    descuento_monto: item.descuentoMonto,
    precio_final: item.precioFinal,
    promocion_id: promoData && item.descuentoMonto > 0 ? promocionId : null,
    promocion_nombre:
      promoData && item.descuentoMonto > 0 ? promoData.nombre : null,
  }));

  const { error: itemsError } = await supabase
    .from("ventas_items")
    .insert(insertItems);

  if (itemsError) {
    return {
      error: "Error al guardar los productos en el ticket.",
      success: false,
    };
  }

  // --- 5. DESCONTAR STOCK ---
  for (const item of itemsProcesados) {
    await supabase
      .from("productos_stock")
      .update({ cantidad: item.stockOriginal - item.cantidad })
      .eq("id", item.stockId);
  }

  revalidatePath("/", "layout");
  return { error: null, success: true };
}
