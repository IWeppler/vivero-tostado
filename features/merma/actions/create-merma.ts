"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createMermaAction(prevState: any, formData: FormData) {
  const producto_id = formData.get("producto_id") as string;
  const variante = formData.get("variante") as string;
  const cantidad = Number(formData.get("cantidad"));
  const motivo = formData.get("motivo") as string;

  if (!producto_id || !variante || !cantidad || !motivo) {
    return { error: "Todos los campos son obligatorios.", success: false };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado.", success: false };
  }

  const { error } = await supabase.from("mermas").insert({
    producto_id,
    variante,
    cantidad,
    motivo,
    creado_por: user.id,
    estado: "PENDIENTE",
  });

  if (error) {
    console.error("Error creando merma:", error);
    return { error: "Ocurrió un error al registrar la baja.", success: false };
  }

  revalidatePath("/stock");
  return { error: null, success: true };
}
