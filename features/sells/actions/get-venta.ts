"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { Venta } from "@/entities/ventas/types";

export async function getVentasAction(): Promise<{
  data: Venta[] | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("ventas")
      .select(
        `
        *,
        producto:productos(nombre, temporada, imagen_url)
      `,
      )
      .order("fecha_venta", { ascending: false });

    if (error) {
      console.error("Error fetching ventas:", error);
      return { data: null, error: "No se pudo cargar el historial de ventas." };
    }

    return { data: data as Venta[], error: null };
  } catch (err) {
    console.error("Unexpected error in getVentasAction:", err);
    return {
      data: null,
      error: "Ocurrió un error inesperado al obtener las ventas.",
    };
  }
}
