import { SelectOption } from "@/shared/types/select";

// 1. Categorías del Vivero (Reemplaza a "Temporadas" o "Tipos")
export const TIPO_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Todas las categorías" },
  { value: "interior", label: "Plantas de Interior" },
  { value: "exterior", label: "Plantas de Exterior" },
  { value: "suculentas", label: "Suculentas y Cactus" },
  { value: "aromaticas", label: "Aromáticas y Huerta" },
  { value: "macetas", label: "Macetas y Decoración" },
  { value: "sustratos", label: "Sustratos y Fertilizantes" },
];


// 2. Tamaños / Variantes (Reemplaza a "Talles")
// En los viveros se suele usar el número de la maceta (N12 = 12cm de diámetro) o Litros.
export const VARIANTE_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Todos los tamaños" },
  { value: "N9", label: "Maceta N°9" },
  { value: "N12", label: "Maceta N°12" },
  { value: "N14", label: "Maceta N°14" },
  { value: "N20", label: "Maceta N°20" },
  { value: "3L", label: "Envase 3 Litros" },
  { value: "10L", label: "Envase 10 Litros" },
  { value: "Unico", label: "Tamaño Único" },
];


// 3. Nivel de Cuidados (Filtro extra genial para un Vivero)
export const CUIDADOS_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Cualquier cuidado" },
  { value: "facil", label: "Fácil cuidado (Ideal principiantes)" },
  { value: "poca_luz", label: "Tolera poca luz" },
  { value: "sol_directo", label: "Sol directo pleno" },
  { value: "pet_friendly", label: "Pet Friendly (No tóxica)" },
];

// Función helper (Opcional)
export const getCategoriaPrincipal = () => "interior";

