import { SelectOption } from "@/shared/types/select";

export const TIPO_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Todos los tipos" },
  { value: "local", label: "Local" },
  { value: "visitante", label: "Visitante" },
  { value: "alternativa", label: "Alternativa" },
  { value: "retro", label: "Retro" },
  { value: "seleccion", label: "Selección" },
  { value: "arquero", label: "Arquero" },
];

export const TALLE_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Todos los talles" },
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "xxl", label: "XXL" },
  { value: "xxxl", label: "XXXL" },
];

function generarTemporadas(desde: number, hasta: number): SelectOption[] {
  const temporadas: SelectOption[] = [];

  for (let year = hasta; year >= desde; year--) {
    temporadas.push({
      value: `${year}/${year + 1}`,
      label: `${year}/${year + 1}`,
    });
  }

  return temporadas;
}

const CURRENT_YEAR = new Date().getFullYear();

export const TEMPORADA_OPTIONS: SelectOption[] = [
  { value: "todos", label: "Todas las temporadas" },
  ...generarTemporadas(1990, CURRENT_YEAR),
];

export function getTemporadaActual(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 6) {
    return `${year}/${year + 1}`;
  }

  return `${year - 1}/${year}`;
}
