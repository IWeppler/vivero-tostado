"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type RawOrderItem = {
  raw_nombre: string;
  raw_variante: string;
  cantidad: number;
  precio_costo: number;
};

export async function procesarPedidoAction(
  proveedor: string,
  items: RawOrderItem[],
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!proveedor || items.length === 0) {
      return { success: false, error: "Faltan datos para procesar el pedido." };
    }

    // 1. Calculamos el total de la orden
    const total_presupuestado = items.reduce(
      (acc, item) => acc + item.cantidad * item.precio_costo,
      0,
    );

    // 2. Creamos la "Cabecera" de la orden
    const { data: orden, error: errorOrden } = await supabase
      .from("ordenes_compra")
      .insert({
        proveedor,
        fecha_remito: new Date().toISOString(),
        total_presupuestado,
        estado: "PENDIENTE", // Queda en staging
      })
      .select("id")
      .single();

    if (errorOrden || !orden) {
      console.error(errorOrden);
      return {
        success: false,
        error: "Error al crear la cabecera de la orden.",
      };
    }

    // 3. Cargamos la "Inteligencia": Productos actuales y Diccionario de Alias
    const [{ data: productos }, { data: diccionario }] = await Promise.all([
      supabase.from("productos").select("id, nombre, precio_costo"),
      supabase
        .from("diccionario_alias")
        .select("raw_nombre, producto_id")
        .eq("proveedor", proveedor),
    ]);

    const itemsProcesados = items.map((item) => {
      let estado_match = "DESCONOCIDO";
      let producto_id = null;

      // Limpiamos los nombres para compararlos mejor (todo minúscula y sin espacios extra)
      const nombreLimpioExcel = item.raw_nombre.trim().toLowerCase();

      // A) Búsqueda en el DICCIONARIO DE ALIAS (El cerebro)
      const aliasMatch = diccionario?.find(
        (a) => a.raw_nombre.trim().toLowerCase() === nombreLimpioExcel,
      );

      if (aliasMatch) {
        producto_id = aliasMatch.producto_id;
      } else {
        // B) Búsqueda exacta en la tabla de PRODUCTOS
        const exactMatch = productos?.find(
          (p) => p.nombre.trim().toLowerCase() === nombreLimpioExcel,
        );
        if (exactMatch) {
          producto_id = exactMatch.id;
        }
      }

      // C) Determinamos el ESTADO si encontramos el producto
      if (producto_id) {
        const productoReal = productos?.find((p) => p.id === producto_id);

        if (productoReal) {
          // Chequeamos si el precio de costo del proveedor subió respecto a lo que tenemos
          if (item.precio_costo > Number(productoReal.precio_costo)) {
            estado_match = "INFLACION";
          } else {
            estado_match = "PERFECTO";
          }
        }
      }

      return {
        orden_id: orden.id,
        raw_nombre: item.raw_nombre.trim() || "Desconocido",
        raw_variante: item.raw_variante.trim() || "Unico",
        cantidad: item.cantidad,
        precio_costo: item.precio_costo,
        estado_match,
        producto_id,
        variante_match: producto_id ? item.raw_variante.trim() : null, // Por ahora asumimos que la variante es la misma
      };
    });

    // 4. Insertamos todos los items en la tabla de Staging (ordenes_items)
    const { error: errorItems } = await supabase
      .from("ordenes_items")
      .insert(itemsProcesados);

    if (errorItems) {
      console.error(errorItems);
      // Si fallan los items, borramos la cabecera por seguridad (rollback manual simplificado)
      await supabase.from("ordenes_compra").delete().eq("id", orden.id);
      return {
        success: false,
        error: "Error al guardar las filas del pedido.",
      };
    }

    // Refrescamos las rutas que pudieran mostrar las notificaciones de compras
    revalidatePath("/stock");

    // Retornamos el ID de la orden para que el frontend pueda redirigir a la pantalla de Merge
    return { success: true, error: null, ordenId: orden.id };
  } catch (error) {
    console.error("Error catastrófico en procesarPedido:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado en el servidor.",
    };
  }
}
