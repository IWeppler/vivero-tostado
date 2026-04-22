export type CartItem = {
  productoId: string;
  nombre: string;
  temporada: string;
  variante: string;
  cantidad: number;
  precioUnitario: number;
};

export interface CartItemStore {
  productoId: string;
  nombre: string;
  temporada: string;
  tipo?: string;
  variante: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string | null;
  stockMaximo: number;
}