"use server";

import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function createCategoriaAction(
  prevState: any,
  formData: FormData,
) {
  try {
    const nombre = formData.get("nombre") as string;
    const descripcion = formData.get("descripcion") as string;

    if (!nombre) {
      return { error: "El nombre es obligatorio.", success: false };
    }

    const slug = generateSlug(nombre);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.from("categorias").insert({
      nombre,
      slug,
      descripcion,
      activa: true,
    });

    if (error) {
      console.error("Error creando categoría:", error);
      if (error.code === "23505")
        return {
          error: "Ya existe una categoría con este nombre.",
          success: false,
        };
      return { error: "No se pudo guardar la categoría.", success: false };
    }

    revalidatePath("/configuracion");
    return { error: null, success: true };
  } catch (err) {
    console.error("Error inesperado en categorías:", err);
    return { error: "Error interno del servidor.", success: false };
  }
}

export async function editCategoriaAction(prevState: any, formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const nombre = formData.get("nombre") as string;
    const descripcion = formData.get("descripcion") as string;

    if (!id || !nombre) {
      return { error: "Faltan datos obligatorios.", success: false };
    }

    const slug = generateSlug(nombre);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from("categorias")
      .update({
        nombre,
        slug,
        descripcion,
      })
      .eq("id", id);

    if (error) {
      console.error("Error editando categoría:", error);
      if (error.code === "23505")
        return {
          error: "Ya existe otra categoría con este nombre.",
          success: false,
        };
      return { error: "No se pudo actualizar la categoría.", success: false };
    }

    revalidatePath("/configuracion");
    return { error: null, success: true };
  } catch (err) {
    console.error("Error al editar categoría:", err);
    return { error: "Error interno del servidor.", success: false };
  }
}

export async function toggleCategoriaAction(id: string, currentState: boolean) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("categorias")
    .update({ activa: !currentState })
    .eq("id", id);

  if (error)
    return { success: false, error: "No se pudo actualizar el estado." };

  revalidatePath("/configuracion");
  return { success: true, error: null };
}

export async function deleteCategoriaAction(id: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("categorias").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error:
          "No puedes eliminar una categoría que tiene productos asociados.",
      };
    }
    return { success: false, error: "No se pudo eliminar la categoría." };
  }

  revalidatePath("/configuracion");
  return { success: true, error: null };
}
