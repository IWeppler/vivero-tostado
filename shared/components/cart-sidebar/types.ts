import { MetodoPago } from "@/entities/payments/types";

export interface PromocionDB {
  id: string;
  nombre: string;
  tipo_regla: string;
  tipo_descuento: string;
  valor_descuento: number;
  monto_minimo: number;
  promociones_metodos_pago?: { metodo_pago: string }[];
  promociones_categorias?: { categoria_nombre: string }[];
}

export interface DescuentoDetalle {
  monto: number;
  nombre: string;
}

export type MetodoPagoPOS = MetodoPago;

