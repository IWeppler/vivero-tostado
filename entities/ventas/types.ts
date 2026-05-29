export type SupabaseRelation<T> = T | T[] | null;

export const getSupabaseRelation = <T>(
  relation: SupabaseRelation<T> | undefined,
): T | null => {
  if (!relation) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
};

export interface VentaProducto {
  nombre: string;
  imagen_url: string | null;
}

export interface VentaPerfil {
  nombre: string;
}

export interface VentaItem {
  cantidad: number;
  precio_unitario: number;
  variante: string;
  descuento_monto?: number;
  precio_final?: number;
  promocion_nombre?: string | null;
  producto?: SupabaseRelation<VentaProducto>;
}

export interface VentaDescuento {
  monto_descontado: number;
  promocion_nombre: string;
}

export interface Venta {
  id: string;
  total: number;
  precio_costo: number;
  cantidad: number;
  fecha_venta: string;
  metodo_pago?: string | null;
  perfiles?: SupabaseRelation<VentaPerfil>;
  ventas_items?: VentaItem[];
  ventas_descuentos?: VentaDescuento[];
}

export interface TicketItemData {
  nombre: string;
  variante: string;
  cantidad: number;
  precio?: number;
  precioUnitario?: number;
}

export interface TicketData {
  items: TicketItemData[];
  total: number;
  metodoPago: string;
  nroRecibo: string;
  fecha?: string;
  vendedor?: string;
  descuentoMonto?: number;
  promocionNombre?: string;
}
