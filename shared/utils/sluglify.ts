export function slugify(texto: string): string {
  return String(texto)
    .normalize("NFKD") // Separa los acentos de las letras (ej: á -> a + ´)
    .replaceAll(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9 -]/g, " ") // Cambia caracteres no alfanuméricos por espacios
    .replaceAll(/\s+/g, "-") // Reemplaza uno o más espacios por un solo guion
    .replaceAll(/-+/g, "-"); // Evita guiones duplicados (ej: --)
}
