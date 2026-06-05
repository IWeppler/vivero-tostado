import { BarChart } from "@/features/reports/ui/bar-chart";
import { DonutChart } from "@/features/reports/ui/donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { TabsContent } from "@/shared/ui/tabs";
import {
  AlertTriangle,
  ArrowDownRight,
  Package,
  PieChart,
  Trophy,
} from "lucide-react";
import { formatearMoneda } from "@/shared/utils/formatters";
import { ReportesMetrics } from "@/entities/reportes/types";

interface RentabilidadTabProps {
  metrics: ReportesMetrics;
  costoMercaderiaVendida: number;
}

export function RentabilidadTab({
  metrics,
  costoMercaderiaVendida,
}: Readonly<RentabilidadTabProps>) {
  return (
    <TabsContent
      value="rentabilidad"
      className="space-y-6 outline-none animate-in fade-in-50 pt-2"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Mercaderia Vendida
            </CardTitle>
            <Package className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatearMoneda(costoMercaderiaVendida)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lo que te costo la mercaderia
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Egresos operativos registrados
            </CardTitle>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-rose-600 dark:text-rose-500">
              -{formatearMoneda(metrics.totalEgresos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gastos fisicos u operativos
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Resultado Operativo Est.
            </CardTitle>
            <Trophy className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {formatearMoneda(metrics.gananciaNeta)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Ganancia bruta menos egresos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border px-2 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">
                Rentabilidad por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <BarChart
                data={metrics.rentabilidadPorCategoria}
                color="#035dfd"
                valuePrefix="$"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-500" />
                  Mayor Rentabilidad
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
                          className="p-2 flex items-center justify-between hover:bg-muted/60 transition-colors"
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
                <CardTitle className="text-lg flex items-center gap-2 text-rose-800 dark:text-destructive">
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
                        className="p-2 flex items-center justify-between hover:bg-muted/60 transition-colors"
                      >
                        <span className="font-medium text-sm text-foreground">
                          {producto.nombre}
                        </span>
                        <span className="font-bold text-rose-600 dark:text-destructive">
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
        </div>

        <div className="lg:col-span-1 h-full">
          <Card className="border-border flex flex-col shadow-none h-full min-h-100 justify-between">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 pb-12">
                <PieChart className="w-5 h-5 text-indigo-500" />
                Composicion Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 items-start flex py-2">
              <DonutChart
                data={metrics.donutData}
                totalIngresos={metrics.ingresos}
                margen={metrics.margenPorcentaje}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}
