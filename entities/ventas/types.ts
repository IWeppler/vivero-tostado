export interface Venta {
  id: string;
  producto_id: string | null;
  variante: string;
  cantidad: number;
  precio_unitario: number;
  precio_costo: number;
  total: number;
  fecha_venta: string;

  producto?: {
    nombre: string;
    cuidados?: string;
    imagen_url: string | null;
    tipo?: string;
  } | null;
}
