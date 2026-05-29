"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function registrarEgresoAction(
  prevState: any,
  formData: FormData,
) {
  const concepto = formData.get("concepto") as string;
  const monto = Number(formData.get("monto"));

  if (!concepto || !monto || monto <= 0) {
    return { error: "Ingresa un concepto y un monto válido.", success: false };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado.", success: false };
  }

  const { error } = await supabase.from("egresos").insert({
    concepto,
    monto,
    creado_por: user.id,
  });

  if (error) {
    console.error("Error al registrar egreso:", error);
    return { error: "Ocurrió un error al guardar el gasto.", success: false };
  }

  revalidatePath("/");
  revalidatePath("/caja");

  return { error: null, success: true };
}
