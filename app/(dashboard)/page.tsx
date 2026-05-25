import { getVentasAction } from "@/features/sales/actions/get-sales";
import { getStockAction } from "@/features/stock/actions/get-product";
import { RegistrarVentaModal } from "@/features/sales/ui/create-sale-modal";
import { CrearProductoModal } from "@/features/stock/ui/create-modal";
import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import {
  getDashboardMetrics,
  PeriodoDashboard,
} from "@/features/dashboard/lib/get-dashboard-metrics";
import { PeriodSelector } from "@/features/dashboard/ui/period-selector";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Flame,
  Trophy,
  ShoppingCart,
  Tags,
  DropletOff,
} from "lucide-react";

export const dynamic = "force-dynamic";

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
};

interface PageProps {
  searchParams: Promise<{ periodo?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: Readonly<PageProps>) {
  const params = await searchParams;
  const periodoParam = (params.periodo as PeriodoDashboard) || "mes";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Obtenemos absolutamente todo para un cálculo BI perfecto
  const [ventasResponse, productosResponse, egresosResponse, mermasResponse] =
    await Promise.all([
      getVentasAction(),
      getStockAction(),
      supabase.from("egresos").select("id, concepto, monto, fecha"),
      supabase
        .from("mermas")
        .select("id, producto_id, cantidad, creado_en")
        .eq("estado", "APROBADA"), // Solo mermas firmes
    ]);

  const ventas = ventasResponse.data || [];
  const productos = productosResponse.data || [];
  const egresos = egresosResponse.data || [];
  const mermas = mermasResponse.data || [];

  // 2. Extraemos la lógica compleja
  const metrics = getDashboardMetrics(
    ventas,
    productos,
    egresos,
    mermas,
    periodoParam,
  );

  const periodoLabel =
    {
      mes: "del mes actual",
      trimestre: "de los últimos 3 meses",
      semestre: "de los últimos 6 meses",
      anio: "del último año",
      historico: "del histórico total",
    }[periodoParam] || "del mes actual";

  return (
    <div className="space-y-8 pb-8">
      {/* HEADER & ACCIONES RÁPIDAS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Panel de Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumen de inteligencia de negocio {periodoLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
          <PeriodSelector defaultPeriod={periodoParam} />
          <div className="hidden sm:block w-px h-8 bg-border/60 mx-1"></div>
          <CrearProductoModal />
          <RegistrarVentaModal productos={productos} />
        </div>
      </div>

      {/* 💰 FILA 1: KPIs CORE (Salud Comercial) */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" /> Rendimiento Comercial
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ingresos Brutos */}
          <div className="bg-white p-6 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Ingresos Brutos
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {formatearMoneda(metrics.ingresos)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Facturación bruta del período
              </div>
            </div>
          </div>

          {/* KPI 2: Unidades Vendidas */}
          <div className="bg-white p-6 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Unidades Vendidas
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Tags className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {metrics.unidadesVendidas}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                En {metrics.ordenes} operaciones
              </div>
            </div>
          </div>

          {/* KPI 3: Ticket Promedio */}
          <div className="bg-white p-6 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Ticket Promedio
              </div>
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {formatearMoneda(metrics.ticketPromedio)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Gasto promedio por cliente
              </div>
            </div>
          </div>

          {/* KPI 4: Impacto de Mermas (Shrinkage) */}
          <div className="bg-white p-6 rounded-2xl border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                Pérdida por Mermas
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <DropletOff className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {formatearMoneda(metrics.costoPerdidoMermas)}
              </div>
              <div className="text-sm text-amber-600 font-medium mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Capital inyectado perdido ({metrics.unidadesMermadas} u.)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📦 FILA 2: INTELIGENCIA OPERATIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA 1: Inventario */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" /> Capital en
            Inventario
          </h2>

          <div className="bg-white p-6 rounded-2xl border border-border flex-1">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Stock Valorizado (Costo)
              </div>
              <div className="text-3xl font-bold text-foreground">
                {formatearMoneda(metrics.stockValorizadoCosto)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dinero inmovilizado en mercadería actual.
              </p>
            </div>

            <div className="border-t border-border mt-6 pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Stock Físico Total
              </div>
              <div className="text-2xl font-bold text-foreground">
                {metrics.stockTotalUnidades}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  unidades
                </span>
              </div>
            </div>

            {metrics.productosCriticos > 0 && (
              <div className="border-t border-red-100 mt-6 pt-6">
                <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
                  <AlertTriangle className="w-5 h-5" /> Alerta de Quiebre
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tienes <strong>{metrics.productosCriticos} talles</strong> con
                  nivel de stock crítico (3 o menos unidades).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 2: Top Rotación */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" /> Mayor Rotación
          </h2>

          <div className="bg-white rounded-2xl border border-border overflow-hidden flex-1">
            {metrics.topProductos.length > 0 ? (
              <div className="divide-y divide-border">
                {metrics.topProductos.map((producto, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <p
                          className="font-semibold text-sm text-foreground truncate"
                          title={producto.nombre}
                        >
                          {producto.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="font-bold text-foreground">
                        {producto.unidades}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          u.
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                Aún no hay datos de ventas en este período.
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: Top Rentabilidad */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-500" /> Mayor Rentabilidad
          </h2>

          <div className="bg-white rounded-2xl border border-border overflow-hidden flex-1">
            {metrics.topProductosRentables.length > 0 ? (
              <div className="divide-y divide-border">
                {metrics.topProductosRentables.map((producto, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <p
                          className="font-semibold text-sm text-foreground truncate"
                          title={producto.nombre}
                        >
                          {producto.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="font-bold text-emerald-600">
                        +{formatearMoneda(producto.ganancia)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                Aún no hay datos de rentabilidad en este período.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
