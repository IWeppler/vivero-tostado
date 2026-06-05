import { SelectOption } from "@/shared/types/select";

// 1. Categorías principales del vivero
export const TIPO_OPTIONS: SelectOption[] = [
  { value: "FloresEstacion", label: "Flores de estación" },
  { value: "Ornamentales", label: "Plantas ornamentales" },
  { value: "AromaticasHuerta", label: "Aromáticas y huerta" },
  { value: "Interior", label: "Plantas de interior" },
  { value: "Suculentas", label: "Suculentas y cactus" },
  { value: "MacetasDecoracion", label: "Macetas y decoración" },
  { value: "SustratosInsumos", label: "Sustratos e insumos" },
];

// 2. Variantes dinámicas según la categoría
export const VARIANTE_OPTIONS: Record<string, SelectOption[]> = {
  FloresEstacion: [
    { value: "M8", label: "Maceta M8" },
    { value: "N10", label: "Maceta N°10" },
    { value: "N12", label: "Maceta N°12" },
    { value: "Bandeja", label: "Bandeja" },
    { value: "Unico", label: "Tamaño único" },
  ],

  Ornamentales: [
    { value: "N12", label: "Maceta N°12" },
    { value: "N14", label: "Maceta N°14" },
    { value: "N18", label: "Maceta N°18" },
    { value: "N20", label: "Maceta N°20" },
    { value: "3L", label: "Envase 3 litros" },
    { value: "5L", label: "Envase 5 litros" },
    { value: "10L", label: "Envase 10 litros" },
    { value: "Unico", label: "Tamaño único" },
  ],

  AromaticasHuerta: [
    { value: "Plantin", label: "Plantín" },
    { value: "M8", label: "Maceta M8" },
    { value: "N10", label: "Maceta N°10" },
    { value: "N12", label: "Maceta N°12" },
    { value: "N14", label: "Maceta N°14" },
    { value: "Atado", label: "Atado" },
    { value: "Unico", label: "Tamaño único" },
  ],

  Interior: [
    { value: "N9", label: "Maceta N°9" },
    { value: "N12", label: "Maceta N°12" },
    { value: "N14", label: "Maceta N°14" },
    { value: "N18", label: "Maceta N°18" },
    { value: "N20", label: "Maceta N°20" },
    { value: "Colgante", label: "Colgante" },
    { value: "Unico", label: "Tamaño único" },
  ],

  Suculentas: [
    { value: "N5", label: "Maceta N°5" },
    { value: "N7", label: "Maceta N°7" },
    { value: "N9", label: "Maceta N°9" },
    { value: "N12", label: "Maceta N°12" },
    { value: "Bowl", label: "Bowl / Terrario" },
    { value: "Unico", label: "Tamaño único" },
  ],

  MacetasDecoracion: [
    { value: "Chica", label: "Pequeña" },
    { value: "Mediana", label: "Mediana" },
    { value: "Grande", label: "Grande" },
    { value: "ExtraGrande", label: "Extra grande" },
    { value: "Unico", label: "Tamaño único" },
  ],

  SustratosInsumos: [
    { value: "1L", label: "1 litro" },
    { value: "5L", label: "5 litros" },
    { value: "10L", label: "10 litros" },
    { value: "20L", label: "20 litros" },
    { value: "50L", label: "50 litros" },
    { value: "1Kg", label: "1 kilo" },
    { value: "5Kg", label: "5 kilos" },
    { value: "10Kg", label: "10 kilos" },
    { value: "25Kg", label: "25 kilos" },
    { value: "Unidad", label: "Unidad" },
  ],
};

export const TODAS_LAS_VARIANTES = Array.from(
  new Set(
    Object.values(VARIANTE_OPTIONS)
      .flat()
      .map((v) => v.value),
  ),
);

export const getCategoriaPrincipal = () => "FloresEstacion";
