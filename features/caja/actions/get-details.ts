"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";

export async function getDetallesTurnoAction(
  fechaInicio: string,
  fechaFin: string | null,
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const endDate = fechaFin || new Date().toISOString();

    const [ventasRes, egresosRes] = await Promise.all([
      supabase
        .from("ventas")
        .select(
          `
          id, 
          total, 
          metodo_pago, 
          fecha_venta, 
          perfiles(nombre),
          ventas_items(producto:productos(nombre)),
          venta_pagos(metodo_nombre, metodo_tipo, monto_bruto, comision_porcentaje, comision_monto, monto_neto, acreditacion_dias)
        `,
        )
        .gte("fecha_venta", fechaInicio)
        .lte("fecha_venta", endDate)
        .order("fecha_venta", { ascending: false }),
      supabase
        .from("egresos")
        .select("id, concepto, monto, fecha, perfiles(nombre)")
        .gte("fecha", fechaInicio)
        .lte("fecha", endDate)
        .order("fecha", { ascending: false }),
    ]);

    if (ventasRes.error || egresosRes.error) {
      console.error(
        "Error fetching detalles:",
        ventasRes.error || egresosRes.error,
      );
      return { data: null, error: "No se pudieron cargar los movimientos." };
    }

    return {
      data: {
        ventas: ventasRes.data || [],
        egresos: egresosRes.data || [],
      },
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { data: null, error: "Error inesperado en auditoría." };
  }
}
