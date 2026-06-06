export type TipoMetodo =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "BILLETERA_VIRTUAL"
  | "TARJETA";

export interface MetodoPago {
  id: string;
  nombre: string;
  tipo: TipoMetodo;
  comision: number;
  acreditacion_dias: number;
  activo: boolean;
}