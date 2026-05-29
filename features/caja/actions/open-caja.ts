"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function abrirTurnoAction(prevState: any, formData: FormData) {
  const montoInicial = Number(formData.get("monto_inicial"));

  if (isNaN(montoInicial) || montoInicial < 0) {
    return { error: "Ingresa un monto inicial válido.", success: false };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado.", success: false };

  // Verificamos que no haya un turno abierto ya
  const { data: turnoAbierto } = await supabase
    .from("turnos_caja")
    .select("id")
    .eq("estado", "ABIERTO")
    .single();

  if (turnoAbierto) {
    return { error: "Ya existe una caja abierta.", success: false };
  }

  const { error } = await supabase.from("turnos_caja").insert({
    vendedor_id: user.id,
    monto_inicial: montoInicial,
    estado: "ABIERTO",
  });

  if (error) {
    console.error("Error abriendo caja:", error);
    return { error: "Ocurrió un error al abrir la caja.", success: false };
  }

  revalidatePath("/caja");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function cerrarTurnoAction(prevState: any, formData: FormData) {
  const turnoId = formData.get("turno_id") as string;
  const montoFinal = Number(formData.get("monto_final"));
  const efectivoEsperado = Number(formData.get("efectivo_esperado"));

  if (!turnoId || isNaN(montoFinal)) {
    return { error: "Faltan datos para cerrar la caja.", success: false };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("turnos_caja")
    .update({
      monto_final: montoFinal,
      efectivo_esperado: efectivoEsperado,
      fecha_cierre: new Date().toISOString(),
      estado: "CERRADO",
    })
    .eq("id", turnoId);

  if (error) {
    console.error("Error cerrando caja:", error);
    return { error: "Ocurrió un error al cerrar la caja.", success: false };
  }

  revalidatePath("/caja");
  revalidatePath("/");
  return { error: null, success: true };
}
