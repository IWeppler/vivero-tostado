import { getVentasAction } from "@/features/sales/actions/get-sales";
import { getStockAction } from "@/features/stock/actions/get-product";
import { RegistrarVentaModal } from "@/features/sales/ui/create-sale-modal";
import { CrearProductoModal } from "@/features/stock/ui/create-modal";
import {
  getDashboardMetrics,
  PeriodoDashboard,
} from "@/features/dashboard/lib/get-dashboard-metrics";
import { PeriodSelector } from "@/features/dashboard/ui/period-selector";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Flame,
  Trophy,
  Percent,
  Tags,
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
  // 1. Capturamos los parámetros de búsqueda de la URL
  const params = await searchParams;
  const periodoParam = (params.periodo as PeriodoDashboard) || "mes";

  // 2. Obtenemos toda la data directamente de la base de datos
  const [ventasResponse, productosResponse] = await Promise.all([
    getVentasAction(),
    getStockAction(),
  ]);

  const ventas = ventasResponse.data || [];
  const productos = productosResponse.data || [];

  // 3. Extraemos la lógica compleja pasándole el período dinámico
  const metrics = getDashboardMetrics(ventas, productos, periodoParam);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-500 mt-1">
            Resumen de inteligencia de negocio {periodoLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Aquí inyectamos el nuevo componente selector */}
          <PeriodSelector defaultPeriod={periodoParam} />

          <div className="hidden sm:block w-px h-8 bg-border/60 mx-1"></div>

          <CrearProductoModal />
          <RegistrarVentaModal productos={productos} />
        </div>
      </div>

      {/* 💰 FILA 1: KPIs CORE (Salud Financiera) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" /> Rendimiento
          Financiero
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ingresos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-500">
                Ingresos Totales
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {formatearMoneda(metrics.ingresos)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Facturación bruta del período
              </div>
            </div>
          </div>

          {/* KPI 2: Margen */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-500">
                Margen Bruto (%)
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics.margenPorcentaje.toFixed(1)}%
              </div>
              <div className="text-sm text-emerald-600 font-medium mt-1">
                Ganancia neta: {formatearMoneda(metrics.ganancia)}
              </div>
            </div>
          </div>

          {/* KPI 3: Volumen de Ventas */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-500">
                Unidades Vendidas
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Tags className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics.unidadesVendidas}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                En {metrics.ordenes} órdenes concretadas
              </div>
            </div>
          </div>

          {/* KPI 4: Ticket Promedio */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-500">
                Ticket Promedio
              </div>
              <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {formatearMoneda(metrics.ticketPromedio)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Gasto promedio por cliente
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📦 FILA 2: INTELIGENCIA OPERATIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA 1: Inventario */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" /> Capital en
            Inventario
          </h2>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-1">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">
                Stock Valorizado (Costo)
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatearMoneda(metrics.stockValorizadoCosto)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dinero inmovilizado en mercadería actual.
              </p>
            </div>

            <div className="border-t border-gray-100 mt-6 pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">
                Stock Físico Total
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {metrics.stockTotalUnidades}{" "}
                <span className="text-sm font-normal text-gray-500">
                  unidades
                </span>
              </div>
            </div>

            {metrics.productosCriticos > 0 && (
              <div className="border-t border-red-100 mt-6 pt-6">
                <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
                  <AlertTriangle className="w-5 h-5" /> Alerta de Quiebre
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  Tienes <strong>{metrics.productosCriticos} talles</strong> con
                  nivel de stock crítico (3 o menos unidades).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 2: Top Rotación */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" /> Mayor Rotación
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            {metrics.topProductos.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {metrics.topProductos.map((producto, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <p
                          className="font-semibold text-sm text-gray-900 truncate"
                          title={producto.nombre}
                        >
                          {producto.nombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="font-bold text-gray-900">
                        {producto.unidades}{" "}
                        <span className="text-xs font-normal text-gray-500">
                          u.
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500 h-full flex items-center justify-center">
                Aún no hay datos de ventas en este período.
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: Top Rentabilidad */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-500" /> Mayor Rentabilidad
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
            {metrics.topProductosRentables.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {metrics.topProductosRentables.map((producto, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <p
                          className="font-semibold text-sm text-gray-900 truncate"
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
              <div className="p-8 text-center text-sm text-gray-500 h-full flex items-center justify-center">
                Aún no hay datos de rentabilidad en este período.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
