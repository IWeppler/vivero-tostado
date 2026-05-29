import { cookies } from "next/headers";
import { getVentasAction } from "@/features/sales/actions/get-sales";
import { getStockAction } from "@/features/stock/actions/get-product";
import { createClient } from "@/shared/config/supabase/server";
import {
  getDashboardMetrics,
  PeriodoDashboard,
} from "@/features/dashboard/lib/get-dashboard-metrics";
import { SalesChart } from "@/features/dashboard/ui/sales-chart";
import { DonutChart } from "@/features/dashboard/ui/donut-chart";
import { BarChart } from "@/features/dashboard/ui/bar-chart";
import { getAdvisorInsights } from "@/features/dashboard/lib/get-advisor-insights";
import { AdvisorBanner } from "@/features/dashboard/ui/advisor-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  PieChart,
  DollarSign,
  Tags,
  DropletOff,
  Flame,
  Trophy,
  Percent,
  CreditCard,
  ShoppingCart,
  Activity,
  ArrowDownRight,
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

export default async function ReportesPage({
  searchParams,
}: Readonly<PageProps>) {
  const params = await searchParams;
  const periodoParam = (params.periodo as PeriodoDashboard) || "mes";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const [ventasResponse, productosResponse, egresosResponse, bajasResponse] =
    await Promise.all([
      getVentasAction(),
      getStockAction(),
      supabase.from("egresos").select("id, concepto, monto, fecha"),
      supabase
        .from("bajas")
        .select(
          "id, producto_id, variante, cantidad, motivo, creado_en, estado, perfiles(nombre)",
        )
        .eq("estado", "APROBADA"),
    ]);

  const ventas = ventasResponse.data || [];
  const productos = productosResponse.data || [];
  const egresos = egresosResponse.data || [];
  const bajasAprobadas = bajasResponse.data || [];

  const metrics = getDashboardMetrics(
    ventas,
    productos,
    egresos,
    bajasAprobadas,
    periodoParam,
  );

  const now = new Date();
  let startDate = new Date(0);
  if (periodoParam === "mes")
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  if (periodoParam === "trimestre")
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  if (periodoParam === "semestre")
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  if (periodoParam === "anio")
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  if (periodoParam === "hoy")
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const ventasDelPeriodo =
    periodoParam === "historico"
      ? ventas
      : ventas.filter((v) => new Date(v.fecha_venta) >= startDate);
  const bajasDelPeriodo =
    periodoParam === "historico"
      ? bajasAprobadas
      : bajasAprobadas.filter((m) => new Date(m.creado_en) >= startDate);

  const costoMercaderiaVendida = metrics.ingresos - metrics.gananciaBrutaVentas;
  const insights = getAdvisorInsights(metrics);

  return (
    <div>
      {/* HEADER ESTRATÉGICO */}
      {/* <div className="mb-4">
        <h1>Reportes e Inteligencia</h1>
        <p>Análisis comercial, financiero e inventario del negocio.</p>Configuración del Sistema

        <h3>Período</h3>
      </div> */}

      <AdvisorBanner insights={insights} />

      <Tabs defaultValue="resumen" className="w-full space-y-4 mt-2">
        <ScrollArea className="w-full pb-2">
          <TabsList className="bg-sidebar border border-border h-10! inline-flex w-max min-w-full sm:min-w-0">
            <TabsTrigger
              value="resumen"
              className="rounded-sm px-2 data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:text-foreground cursor-pointer transition-color shadow-none"
            >
              <Activity className="w-4 h-4 mr-2" /> Resumen
            </TabsTrigger>
            <TabsTrigger
              value="ventas"
              className="rounded-sm px-2 data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:text-foreground  cursor-pointer transition-colors"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Ventas
            </TabsTrigger>
            <TabsTrigger
              value="rentabilidad"
              className="rounded-sm px-2 data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:text-foreground  cursor-pointer transition-colors"
            >
              <DollarSign className="w-4 h-4 mr-2" /> Rentabilidad
            </TabsTrigger>
            <TabsTrigger
              value="inventario"
              className="rounded-sm px-2 data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:text-foreground  cursor-pointer transition-colors"
            >
              <Package className="w-4 h-4 mr-2" /> Inventario
            </TabsTrigger>
            <TabsTrigger
              value="bajas"
              className="rounded-sm px-2 data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:text-foreground  cursor-pointer transition-colors"
            >
              <DropletOff className="w-4 h-4 mr-2" /> Bajas
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* ========================================== */}
        {/* TAB 1: RESUMEN EJECUTIVO */}
        {/* ========================================== */}
        <TabsContent
          value="resumen"
          className="space-y-6 outline-none animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingresos Brutos
                </CardTitle>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatearMoneda(metrics.ingresos)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ganancia Bruta
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatearMoneda(metrics.gananciaBrutaVentas)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unidades / Ticket
                </CardTitle>
                <Tags className="w-4 h-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.unidadesVendidas}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    u.
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ticket medio: {formatearMoneda(metrics.ticketPromedio)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Margen Op. Estimado
                </CardTitle>
                <Percent className="w-4 h-4" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-semibold ${metrics.margenPorcentaje < 0 ? "text-rose-600" : "text-blue-700"}`}
                >
                  {metrics.margenPorcentaje.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">
                  Flujo de Ingresos Diarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalesChart ventas={ventasDelPeriodo} periodo={periodoParam} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-1 border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Días de Mayor Venta</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <BarChart
                  data={metrics.ventasPorDia}
                  color="#10b981"
                  valuePrefix="$"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 2: VENTAS Y COMPORTAMIENTO COMERCIAL */}
        {/* ========================================== */}
        <TabsContent
          value="ventas"
          className="space-y-6 outline-none animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingresos Brutos
                </CardTitle>
                <DollarSign className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatearMoneda(metrics.ingresos)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cantidad de Ventas
                </CardTitle>
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.ordenes}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    tickets
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unidades Vendidas
                </CardTitle>
                <Package className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.unidadesVendidas}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    u.
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Promedio
                </CardTitle>
                <Tags className="w-4 h-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatearMoneda(metrics.ticketPromedio)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Ventas por Categoría</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <BarChart
                  data={metrics.ventasPorCategoria}
                  color="#3b82f6"
                  valuePrefix="$"
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border-border flex flex-col shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-500" /> Métodos de
                  Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                {metrics.ventasPorMetodo.length > 0 ? (
                  <div className="space-y-4 w-full">
                    {metrics.ventasPorMetodo.map((metodo, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm uppercase text-muted-foreground">
                            {metodo.label}
                          </span>
                          <span className="font-bold text-foreground">
                            {formatearMoneda(metodo.value)}
                          </span>
                        </div>
                        {/* Barra de progreso visual */}
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{
                              width: `${(metodo.value / metrics.ingresos) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Sin datos registrados.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 3: RENTABILIDAD Y FINANZAS */}
        {/* ========================================== */}
        <TabsContent
          value="rentabilidad"
          className="space-y-6 outline-none animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Costo Mercadería Vendida
                </CardTitle>
                <Package className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatearMoneda(costoMercaderiaVendida)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lo que te costó la mercadería
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Egresos Cargados en Caja
                </CardTitle>
                <ArrowDownRight className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600">
                  -{formatearMoneda(metrics.totalEgresos)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gastos físicos u operativos
                </p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-emerald-800">
                  Resultado Operativo Est.
                </CardTitle>
                <Trophy className="w-4 h-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-emerald-700">
                  {formatearMoneda(metrics.gananciaNeta)}
                </div>
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  Ganancia bruta menos egresos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rentabilidad por Categoría */}
            <Card className="lg:col-span-2 border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">
                  Rentabilidad por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <BarChart
                  data={metrics.rentabilidadPorCategoria}
                  color="#10b981"
                  valuePrefix="$"
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-500" /> Composición
                  Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                <DonutChart
                  data={metrics.donutData}
                  totalIngresos={metrics.ingresos}
                  margen={metrics.margenPorcentaje}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-500" /> Mayor
                  Rentabilidad (Top)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {metrics.topProductosRentables.length > 0 ? (
                  <div className="divide-y divide-border">
                    {metrics.topProductosRentables
                      .slice(0, 5)
                      .map((producto, idx) => (
                        <div
                          key={idx}
                          className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <span className="font-medium text-sm">
                            {idx + 1}. {producto.nombre}
                          </span>
                          <span className="font-bold text-emerald-600">
                            +{formatearMoneda(producto.ganancia)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Sin datos.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-500" /> Menor
                  Margen de Ganancia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {metrics.peoresProductosRentables.length > 0 ? (
                  <div className="divide-y divide-border">
                    {metrics.peoresProductosRentables.map((producto, idx) => (
                      <div
                        key={idx}
                        className="p-4 flex items-center justify-between hover:bg-rose-50/50 transition-colors"
                      >
                        <span className="font-medium text-sm text-foreground">
                          {producto.nombre}
                        </span>
                        <span className="font-bold text-rose-600">
                          +{formatearMoneda(producto.ganancia)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Sin datos.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 4: ROTACIÓN E INVENTARIO */}
        {/* ========================================== */}
        <TabsContent
          value="inventario"
          className="space-y-6 outline-none animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Capital Inmovilizado
                </CardTitle>
                <Package className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatearMoneda(metrics.stockValorizadoCosto)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor al costo del stock actual
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Stock Físico
                </CardTitle>
                <Tags className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.stockTotalUnidades}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    unidades
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card
              className={`shadow-none ${metrics.productosCriticos > 0 ? "border-rose-200 bg-rose-50" : "border-border"}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle
                  className={`text-sm font-bold ${metrics.productosCriticos > 0 ? "text-rose-800" : "text-muted-foreground"}`}
                >
                  Alertas de Stock
                </CardTitle>
                <AlertTriangle
                  className={`w-4 h-4 ${metrics.productosCriticos > 0 ? "text-rose-600" : "text-muted-foreground"}`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${metrics.productosCriticos > 0 ? "text-rose-700" : "text-foreground"}`}
                >
                  {metrics.productosCriticos}
                </div>
                <p
                  className={`text-xs mt-1 ${metrics.productosCriticos > 0 ? "text-rose-600 font-medium" : "text-muted-foreground"}`}
                >
                  Productos en nivel crítico
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Rotación */}
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" /> Mayor Rotación
                  (Unidades)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {metrics.topProductos.length > 0 ? (
                  <div className="divide-y divide-border">
                    {metrics.topProductos.slice(0, 5).map((producto, idx) => (
                      <div
                        key={idx}
                        className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <span className="font-medium text-sm">
                          {idx + 1}. {producto.nombre}
                        </span>
                        <span className="font-bold">
                          {producto.unidades} u.
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Aún no hay datos de ventas.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Productos sin Movimiento */}
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-slate-500">
                  <Package className="w-5 h-5" /> Productos sin movimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {metrics.productosSinMovimiento.length > 0 ? (
                  <ScrollArea className="h-65">
                    <div className="divide-y divide-border">
                      {metrics.productosSinMovimiento.map((producto, idx) => (
                        <div
                          key={idx}
                          className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
                        >
                          <span className="font-medium text-sm text-foreground">
                            {producto.nombre}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] text-muted-foreground"
                          >
                            Estancado
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    ¡Excelente! Todo tu inventario tuvo movimiento.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Listado Detallado Stock Crítico */}
          <Card className="border-border shadow-none">
            <CardHeader className="bg-muted/20 border-b border-border py-4">
              <CardTitle className="text-base text-rose-800">
                Stock Crítico Detallado (≤ 3 unidades)
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-5 py-3">Producto</th>
                    <th className="px-5 py-3">Talle / Variante</th>
                    <th className="px-5 py-3 text-right">Cant. Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {metrics.stockCriticoDetallado.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-8 text-center text-muted-foreground"
                      >
                        Tu inventario está sano. No hay productos críticos.
                      </td>
                    </tr>
                  ) : (
                    metrics.stockCriticoDetallado.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-foreground">
                          {item.nombre}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {item.variante}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-rose-600">
                          {item.cantidad} u.
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================== */}
        {/* TAB 5: BAJAS Y PÉRDIDAS */}
        {/* ========================================== */}
        <TabsContent
          value="bajas"
          className="space-y-6 outline-none animate-in fade-in-50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Pérdida Total por Bajas
                </CardTitle>
                <DropletOff className="w-4 h-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {formatearMoneda(metrics.costoPerdidoBajas)}
                </div>
                <p className="text-xs mt-1 font-medium">
                  Dinero perdido en bajas aprobadas
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Volumen Afectado
                </CardTitle>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.unidadesBajas}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    unidades rotas/perdidas
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-border flex flex-col shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">Bajas por Motivo</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {metrics.bajasPorMotivo.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.bajasPorMotivo.map((motivo, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-muted-foreground">
                            {motivo.label}
                          </span>
                          <span className="font-bold text-amber-600">
                            {formatearMoneda(motivo.value)}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{
                              width: `${(motivo.value / metrics.costoPerdidoBajas) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Sin bajas registradas.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border overflow-hidden shadow-none">
              <CardHeader className="bg-muted/20 border-b border-border py-4">
                <CardTitle className="text-base">
                  Historial de Bajas Aprobadas
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-widest">
                    <tr>
                      <th className="px-5 py-3">Fecha</th>
                      <th className="px-5 py-3">Producto / Variante</th>
                      <th className="px-5 py-3">Motivo</th>
                      <th className="px-5 py-3">Cant.</th>
                      <th className="px-5 py-3 hidden sm:table-cell">
                        Registró
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {bajasDelPeriodo.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-muted-foreground"
                        >
                          No hay bajas aprobadas en este período. ¡Excelente!
                        </td>
                      </tr>
                    ) : (
                      bajasDelPeriodo.map((baja) => {
                        const prodAsociado = productos.find(
                          (p) => p.id === baja.producto_id,
                        );
                        return (
                          <tr
                            key={baja.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                              {new Date(baja.creado_en).toLocaleDateString(
                                "es-AR",
                              )}
                            </td>
                            <td className="px-5 py-3 font-medium text-foreground">
                              {prodAsociado?.nombre || "Producto eliminado"}{" "}
                              <span className="text-muted-foreground font-normal">
                                ({baja.variante})
                              </span>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {baja.motivo}
                            </td>
                            <td className="px-5 py-3 font-bold text-amber-600">
                              -{baja.cantidad}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                              {/* @ts-expect-error any no tiene nombre como prop*/}
                              {baja.perfiles?.nombre || "Usuario"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
