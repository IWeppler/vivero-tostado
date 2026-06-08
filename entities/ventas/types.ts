export type SupabaseRelation<T> = T | T[] | null;

export const getSupabaseRelation = <T>(
  relation: SupabaseRelation<T> | undefined,
): T | null => {
  if (!relation) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
};

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id?: string | null;
  variante: string;
  cantidad: number;
  precio_unitario: number;
  precio_costo?: number;
  descuento_monto?: number;
  precio_final?: number;
  promocion_nombre?: string | null;
  producto?: VentaProducto | null;
}

export interface VentaProducto {
  nombre?: string;
  tipo?: string;
  precio_costo?: number;
}

export interface VentaDescuento {
  monto_descontado: number;
  promocion_nombre: string;
}

export interface VentaPago {
  id?: string;
  venta_id?: string;
  metodo_pago_id?: string | null;
  metodo_nombre: string;
  metodo_tipo: string;
  monto_bruto: number;
  comision_porcentaje: number;
  comision_monto: number;
  monto_neto: number;
  acreditacion_dias: number;
  creado_en?: string;
}

export interface CreateSalePaymentInput {
  metodoPagoId: string;
  montoAsignado: number;
}

export interface Venta {
  id: string;
  total: number;
  precio_costo: number;
  cantidad: number;
  fecha_venta: string;
  metodo_pago?: string | null;
  perfiles?: {
    nombre: string;
  } | null;
  ventas_items?: VentaItem[];
  ventas_descuentos?: VentaDescuento[];
  venta_pagos?: VentaPago[];

  total_bruto?: number;
  comision_total?: number;
  total_neto?: number;
  es_pago_mixto?: boolean;
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
  comisionMonto?: number;
  montoNeto?: number;
  acreditacionDias?: number;
  pagosDesglosados?: {
    nombre: string;
    monto: number;
  }[];
}
