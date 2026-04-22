"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { Producto } from "@/entities/productos/types";

export async function getStockAction(): Promise<{
  data: Producto[] | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("productos")
      .select(
        `
        *,
        stock:productos_stock(id, variante, cantidad)
        `,
      )
      .order("creado_en", { ascending: false });

    if (error) return { data: null, error: "Error al cargar." };

    return { data: data as Producto[], error: null };
  } catch (err) {
    console.error(err);
    return { data: null, error: "Ocurrió un error inesperado." };
  }
}
