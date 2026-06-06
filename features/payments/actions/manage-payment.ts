"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createPaymentAction(prevState: any, formData: FormData) {
  try {
    const nombre = formData.get("nombre") as string;
    const tipo = formData.get("tipo") as string;
    const comision = Number(formData.get("comision") || 0);
    const acreditacion_dias = Number(formData.get("acreditacion_dias") || 0);

    if (!nombre || !tipo || isNaN(comision) || isNaN(acreditacion_dias)) {
      return { error: "Faltan datos obligatorios.", success: false };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.from("metodos_pago").insert({
      nombre,
      tipo,
      comision,
      acreditacion_dias,
      activo: true,
    });

    if (error) {
      console.error("Error creando método de pago:", error);
      return { error: "No se pudo guardar el método de pago.", success: false };
    }

    revalidatePath("/configuracion");
    return { error: null, success: true };
  } catch (err) {
    console.error("Error inesperado en métodos de pago:", err);
    return { error: "Error interno del servidor.", success: false };
  }
}

export async function editPaymentAction(prevState: any, formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const nombre = formData.get("nombre") as string;
    const tipo = formData.get("tipo") as string;
    const comision = Number(formData.get("comision") || 0);
    const acreditacion_dias = Number(formData.get("acreditacion_dias") || 0);

    if (
      !id ||
      !nombre ||
      !tipo ||
      isNaN(comision) ||
      isNaN(acreditacion_dias)
    ) {
      return { error: "Faltan datos obligatorios.", success: false };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from("metodos_pago")
      .update({
        nombre,
        tipo,
        comision,
        acreditacion_dias,
      })
      .eq("id", id);

    if (error) {
      console.error("Error editando método de pago:", error);
      return {
        error: "No se pudo actualizar el método de pago.",
        success: false,
      };
    }

    revalidatePath("/configuracion");
    return { error: null, success: true };
  } catch (err) {
    console.error("Error al editar método de pago:", err);
    return { error: "Error interno del servidor.", success: false };
  }
}

export async function togglePaymentAction(id: string, currentState: boolean) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("metodos_pago")
    .update({ activo: !currentState })
    .eq("id", id);

  if (error)
    return { success: false, error: "No se pudo actualizar el estado." };

  revalidatePath("/configuracion");
  return { success: true, error: null };
}

export async function deletePaymentAction(id: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("metodos_pago").delete().eq("id", id);

  if (error) return { success: false, error: "No se pudo eliminar el método." };

  revalidatePath("/configuracion");
  return { success: true, error: null };
}
