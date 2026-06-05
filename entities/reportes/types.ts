import { getDashboardMetrics } from "@/features/dashboard/lib/get-dashboard-metrics";

export type ReportesMetrics = ReturnType<typeof getDashboardMetrics>;

export type BajaAprobadaReporte = {
  id: string;
  producto_id: string | null;
  variante: string | null;
  cantidad: number | string;
  motivo: string | null;
  creado_en: string;
  estado: string | null;
  perfiles?: { nombre?: string | null } | null;
};

