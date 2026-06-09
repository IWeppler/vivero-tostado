"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/shared/config/supabase/client";

export type ActiveCategory = {
  id: string;
  nombre: string;
};

export function useActiveCategories() {
  const [categorias, setCategorias] = useState<ActiveCategory[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("activa", true)
        .is("parent_id", null)
        .order("orden");

      setCategorias(data || []);
    };

    fetchCategorias();
  }, []);

  return categorias;
}
