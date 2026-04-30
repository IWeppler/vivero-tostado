import { SelectOption } from "@/shared/types/select";

// 1. Categorías del Vivero
export const TIPO_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Todas las categorías" },
  { value: "interior", label: "Plantas de Interior" },
  { value: "exterior", label: "Plantas de Exterior" },
  { value: "suculentas", label: "Suculentas y Cactus" },
  { value: "aromaticas", label: "Aromáticas y Huerta" },
  { value: "macetas", label: "Macetas y Decoración" },
  { value: "sustratos", label: "Sustratos y Fertilizantes" },
];

// 2. Diccionario de Variantes Dinámicas según la Categoría
export const VARIANTE_OPTIONS: Record<string, SelectOption[]> = {
  interior: [
    { value: "N9", label: "Maceta N°9" },
    { value: "N12", label: "Maceta N°12" },
    { value: "N14", label: "Maceta N°14" },
    { value: "N20", label: "Maceta N°20" },
    { value: "Unico", label: "Tamaño Único" },
  ],
  exterior: [
    { value: "N12", label: "Maceta N°12" },
    { value: "N14", label: "Maceta N°14" },
    { value: "3L", label: "Envase 3 Litros" },
    { value: "10L", label: "Envase 10 Litros" },
    { value: "Unico", label: "Tamaño Único" },
  ],
  suculentas: [
    { value: "N5", label: "Maceta N°5" },
    { value: "N9", label: "Maceta N°9" },
    { value: "Bowl", label: "Bowl/Terrario" },
    { value: "Unico", label: "Tamaño Único" },
  ],
  aromaticas: [
    { value: "N12", label: "Maceta N°12" },
    { value: "N14", label: "Maceta N°14" },
    { value: "Plantin", label: "Plantín" },
  ],
  macetas: [
    { value: "Chica", label: "Pequeña" },
    { value: "Mediana", label: "Mediana" },
    { value: "Grande", label: "Grande" },
    { value: "Unico", label: "Tamaño Único" },
  ],
  sustratos: [
    { value: "1L", label: "1 Litro" },
    { value: "5L", label: "5 Litros" },
    { value: "10L", label: "10 Litros" },
    { value: "20L", label: "20 Litros" },
    { value: "50L", label: "50 Litros" },
    { value: "1Kg", label: "1 Kilo" },
  ],
};

// Generamos un array plano con TODAS las variantes para las validaciones del servidor
export const TODAS_LAS_VARIANTES = Array.from(
  new Set(
    Object.values(VARIANTE_OPTIONS)
      .flat()
      .map((v) => v.value),
  ),
);

// 3. Nivel de Cuidados
export const CUIDADOS_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Cualquier cuidado" },
  { value: "facil", label: "Fácil cuidado (Ideal principiantes)" },
  { value: "poca_luz", label: "Tolera poca luz" },
  { value: "sol_directo", label: "Sol directo pleno" },
  { value: "pet_friendly", label: "Pet Friendly (No tóxica)" },
];

export const getCategoriaPrincipal = () => "interior";
