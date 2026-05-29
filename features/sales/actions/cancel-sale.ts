"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function anularVentaAction(
  ventaId: string,
  motivoDevolucion: "RESTAURAR_STOCK" | "BAJA",
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado", success: false };

    // 1. Obtener detalles de la venta antes de borrarla
    const { data: venta, error: fetchError } = await supabase
      .from("ventas")
      .select("producto_id, variante, cantidad, total")
      .eq("id", ventaId)
      .single();

    if (fetchError || !venta) {
      return { error: "No se encontró la venta solicitada.", success: false };
    }

    // 2. Eliminar el registro de la venta (o podríamos marcarla como ANULADA, pero por simplicidad del MVP la borramos)
    const { error: deleteError } = await supabase
      .from("ventas")
      .delete()
      .eq("id", ventaId);

    if (deleteError) {
      console.error(deleteError);
      return { error: "Error al intentar anular la venta.", success: false };
    }

    // 3. Registrar el egreso de dinero de la caja
    await supabase.from("egresos").insert({
      concepto: `Devolución Venta #${ventaId.split("-")[0].toUpperCase()}`,
      monto: venta.total,
      creado_por: user.id,
    });

    // 4. Manejo del Stock según la decisión del usuario
    if (venta.producto_id) {
      if (motivoDevolucion === "RESTAURAR_STOCK") {
        // La planta está sana, vuelve a la estantería
        const { data: stockActual } = await supabase
          .from("productos_stock")
          .select("id, cantidad")
          .eq("producto_id", venta.producto_id)
          .eq("variante", venta.variante)
          .single();

        if (stockActual) {
          await supabase
            .from("productos_stock")
            .update({ cantidad: stockActual.cantidad + venta.cantidad })
            .eq("id", stockActual.id);
        } else {
          await supabase.from("productos_stock").insert({
            producto_id: venta.producto_id,
            variante: venta.variante,
            cantidad: venta.cantidad,
          });
        }
      } else if (motivoDevolucion === "BAJA") {
        // La planta volvió rota o seca, registramos la pérdida operativa
        await supabase.from("bajas").insert({
          producto_id: venta.producto_id,
          variante: venta.variante,
          cantidad: venta.cantidad,
          motivo: "Devolución por producto fallado/roto",
          estado: "APROBADA",
          creado_por: user.id,
        });
      }
    }

    // 5. Refrescamos las vistas
    revalidatePath("/ventas");
    revalidatePath("/stock");
    revalidatePath("/caja");

    return { error: null, success: true };
  } catch (err) {
    console.error("Error in anularVentaAction:", err);
    return {
      error: "Ocurrió un error inesperado al intentar anular.",
      success: false,
    };
  }
}
