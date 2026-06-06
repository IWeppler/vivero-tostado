"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function registrarVentaAction(
  prevState: { error: string | null; success: boolean },
  formData: FormData,
) {
  const cartData = formData.get("cart_items") as string;
  const metodoPagoId = formData.get("metodo_pago_id") as string;

  const promocionId = formData.get("promocion_id") as string | null;
  const descuentoMonto = Number(formData.get("descuento_monto") || 0);

  console.log("\n=========================================");
  console.log("🛠️ INICIANDO REGISTRO DE VENTA");
  console.log("=========================================");
  console.log("Payload items:", cartData);
  console.log("Metodo Pago ID:", metodoPagoId);
  console.log("Promocion ID:", promocionId, "| Descuento:", descuentoMonto);

  if (!cartData) {
    return { error: "El carrito de ventas está vacío.", success: false };
  }

  if (!metodoPagoId) {
    return { error: "Debes seleccionar un método de pago.", success: false };
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
    console.error("❌ Auth Error:", authError);
    return {
      error: "Debes iniciar sesión para realizar una venta.",
      success: false,
    };
  }

  console.log("✅ Usuario autenticado:", user.id);

  // --- BLOQUEO ESTRICTO DE CAJA ---
  const { data: turnoAbierto, error: turnoError } = await supabase
    .from("turnos_caja")
    .select("id")
    .eq("estado", "ABIERTO")
    .limit(1)
    .single();

  if (turnoError || !turnoAbierto) {
    console.error("❌ Error verificando caja:", turnoError);
    return { error: "CAJA_CERRADA", success: false };
  }

  console.log("✅ Caja abierta confirmada:", turnoAbierto.id);

  // --- FETCH DEL MÉTODO DE PAGO ---
  const { data: metodoData, error: metodoError } = await supabase
    .from("metodos_pago")
    .select("*")
    .eq("id", metodoPagoId)
    .single();

  if (metodoError || !metodoData) {
    console.error("❌ Error buscando método de pago:", metodoError);
    return {
      error: "El método de pago seleccionado no existe en la base de datos.",
      success: false,
    };
  }

  console.log(
    "✅ Método de pago encontrado:",
    metodoData.nombre,
    "| Comisión:",
    metodoData.comision,
  );

  // --- PRE-CARGA DE PROMOCIÓN ---
  let promoData = null;
  let categoriasPromo: string[] = [];

  if (promocionId && promocionId !== "ninguna" && descuentoMonto > 0) {
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
      console.log("✅ Promoción aplicada:", promo.nombre);
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

  // --- 1. Validar Stock y Prorratear ---
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
      console.error(
        `❌ Error de stock para ${item.nombre} (${item.variante}):`,
        stockError,
      );
      return { error: `Error de stock para ${item.variante}.`, success: false };
    }

    const precioCostoReal = Number(
      (stockActual.producto as any)?.precio_costo || 0,
    );
    const precioUnitario = Number(item.precioUnitario ?? item.precio ?? 0);
    const cantidadFinal = Number(item.cantidad ?? 1);

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

  // --- 2. CÁLCULO FINANCIERO DEL PAGO ---
  const montoBruto = totalConDescuento;
  const comisionPorcentaje = Number(metodoData.comision || 0);
  const comisionMonto = (montoBruto * comisionPorcentaje) / 100;
  const montoNeto = montoBruto - comisionMonto;

  // 💡 Mapeo seguro para la columna antigua
  let metodoPagoSafe = "EFECTIVO";
  if (metodoData.tipo === "TRANSFERENCIA") metodoPagoSafe = "TRANSFERENCIA";
  if (metodoData.tipo === "TARJETA" || metodoData.tipo === "BILLETERA_VIRTUAL")
    metodoPagoSafe = "TARJETA";

  const payloadVentas = {
    vendedor_id: user.id,
    metodo_pago: metodoPagoSafe,
    total: montoBruto,
    precio_costo: costoSeguro,
    cantidad: items.length,
  };

  console.log("🚀 Payload a insertar en 'ventas':", payloadVentas);

  // --- 3. CREAR LA CABECERA (ventas) ---
  const { data: nuevaVenta, error: ventaError } = await supabase
    .from("ventas")
    .insert(payloadVentas)
    .select("id")
    .single();

  if (ventaError || !nuevaVenta) {
    console.error("❌ ERROR BD 'ventas':", ventaError);
    // Devolvemos el mensaje exacto de Postgres
    return {
      error: `Fallo en BD (Ventas): ${ventaError?.message || JSON.stringify(ventaError)}`,
      success: false,
    };
  }

  console.log("✅ Venta cabecera creada con ID:", nuevaVenta.id);

  // --- 4. REGISTRAR LA TRAZABILIDAD DEL PAGO (venta_pagos) ---
  const payloadPagos = {
    venta_id: nuevaVenta.id,
    metodo_pago_id: metodoData.id,
    metodo_nombre: metodoData.nombre,
    metodo_tipo: metodoData.tipo,
    monto_bruto: montoBruto,
    comision_porcentaje: comisionPorcentaje,
    comision_monto: comisionMonto,
    monto_neto: montoNeto,
    acreditacion_dias: metodoData.acreditacion_dias || 0,
  };

  console.log("🚀 Payload a insertar en 'venta_pagos':", payloadPagos);

  const { error: pagoError } = await supabase
    .from("venta_pagos")
    .insert(payloadPagos);

  if (pagoError) {
    console.error("❌ ERROR BD 'venta_pagos':", pagoError);
    return {
      error: `Fallo en BD (Venta Pagos): ${pagoError.message}`,
      success: false,
    };
  }

  // --- 5. REGISTRAR TRAZABILIDAD DEL DESCUENTO ---
  if (
    promocionId &&
    promocionId !== "ninguna" &&
    descuentoMonto > 0 &&
    promoData
  ) {
    const { error: descError } = await supabase
      .from("ventas_descuentos")
      .insert({
        venta_id: nuevaVenta.id,
        promocion_id: promocionId,
        promocion_nombre: promoData.nombre,
        tipo_descuento: promoData.tipo_descuento,
        monto_descontado: descuentoMonto,
      });

    if (descError)
      console.error("⚠️ Fallo insertando trazabilidad:", descError);

    await supabase
      .from("promociones")
      .update({
        usos_actuales: (promoData.usos_actuales || 0) + 1,
      })
      .eq("id", promocionId);
  }

  // --- 6. CREAR LOS DETALLES (ventas_items) ---
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

  console.log(
    "🚀 Insertando items en 'ventas_items':",
    insertItems.length,
    "items.",
  );

  const { error: itemsError } = await supabase
    .from("ventas_items")
    .insert(insertItems);

  if (itemsError) {
    console.error("❌ ERROR BD 'ventas_items':", itemsError);
    return {
      error: `Fallo en BD (Ventas Items): ${itemsError.message}`,
      success: false,
    };
  }

  // --- 7. DESCONTAR STOCK ---
  for (const item of itemsProcesados) {
    await supabase
      .from("productos_stock")
      .update({ cantidad: item.stockOriginal - item.cantidad })
      .eq("id", item.stockId);
  }

  console.log("🎉 VENTA COMPLETADA EXITOSAMENTE");
  console.log("=========================================\n");

  revalidatePath("/", "layout");
  return { error: null, success: true };
}