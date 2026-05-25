"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  DollarSign,
  Calendar,
} from "lucide-react";
import { EgresoModal } from "./egreso-modal";

interface VentaCaja {
  id: string;
  total: number;
  precio_costo: number | null;
  cantidad: number;
  fecha_venta: string;
  producto: {
    nombre: string | null;
  }[];
}

interface EgresoCaja {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
}

interface CajaDashboardProps {
  ventas: VentaCaja[];
  egresos: EgresoCaja[];
}

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
};

export function CajaDashboard({
  ventas,
  egresos,
}: Readonly<CajaDashboardProps>) {
  const [periodo, setPeriodo] = useState<"hoy" | "mes" | "año" | "todo">("mes");

  // Filtramos y calculamos basándonos en la fecha seleccionada
  const { filtrados, totales } = useMemo(() => {
    const ahora = new Date();

    // Función para saber si una fecha entra en el periodo elegido
    const entraEnPeriodo = (fechaString: string) => {
      if (periodo === "todo") return true;
      const fecha = new Date(fechaString);

      if (periodo === "hoy") {
        return fecha.toDateString() === ahora.toDateString();
      }
      if (periodo === "mes") {
        return (
          fecha.getMonth() === ahora.getMonth() &&
          fecha.getFullYear() === ahora.getFullYear()
        );
      }
      if (periodo === "año") {
        return fecha.getFullYear() === ahora.getFullYear();
      }
      return true;
    };

    // 1. Filtrar y unificar
    const ventasEnPeriodo = ventas.filter((v) => entraEnPeriodo(v.fecha_venta));
    const egresosEnPeriodo = egresos.filter((e) => entraEnPeriodo(e.fecha));

    const ventasFiltradas = ventasEnPeriodo.map((v) => {
      const costoTotal = (v.precio_costo || 0) * v.cantidad;

      return {
        id: v.id,
        tipo: "INGRESO",
        concepto: `Venta: ${v.producto[0]?.nombre || "Producto"} (x${v.cantidad})`,
        monto: v.total,
        ganancia: v.total - costoTotal,
        fecha: v.fecha_venta,
      };
    });

    const egresosFiltrados = egresosEnPeriodo.map((e) => ({
      id: e.id,
      tipo: "EGRESO",
      concepto: `Gasto: ${e.concepto}`,
      monto: e.monto,
      ganancia: -e.monto,
      fecha: e.fecha,
    }));

    const ingresosBrutos = ventasEnPeriodo.reduce(
      (total, venta) => total + venta.total,
      0,
    );
    const costoMercaderia = ventasEnPeriodo.reduce(
      (total, venta) => total + (venta.precio_costo || 0) * venta.cantidad,
      0,
    );
    const totalEgresos = egresosEnPeriodo.reduce(
      (total, egreso) => total + egreso.monto,
      0,
    );

    // 2. Unir y ordenar por fecha descendente
    const movimientos = [...ventasFiltradas, ...egresosFiltrados].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    const gananciaNeta = ingresosBrutos - costoMercaderia - totalEgresos;

    return {
      filtrados: movimientos,
      totales: {
        ingresosBrutos,
        costoMercaderia,
        totalEgresos,
        gananciaNeta,
      },
    };
  }, [ventas, egresos, periodo]);

  return (
    <div className="space-y-6">
      {/* Controles y Botones */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-3 rounded-xl border border-border shadow-sm">
        <div className="flex bg-muted p-1 rounded-lg overflow-x-auto">
          {(["hoy", "mes", "año", "todo"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                periodo === p
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "año" ? "Este Año" : p === "mes" ? "Este Mes" : p}
            </button>
          ))}
        </div>
        <EgresoModal />
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-100 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">
              Ingresos (Ventas)
            </CardTitle>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {formatearMoneda(totales.ingresosBrutos)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 border-rose-100 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">
              Gastos (Egresos)
            </CardTitle>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">
              {formatearMoneda(totales.totalEgresos)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Costo Mercadería
            </CardTitle>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {formatearMoneda(totales.costoMercaderia)}
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            totales.gananciaNeta >= 0
              ? "bg-hite text-foreground"
              : "bg-red-900 text-white"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 opacity-90">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <Wallet className="w-4 h-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">
              {formatearMoneda(totales.gananciaNeta)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial Combinado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimos Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {filtrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto opacity-20 mb-3" />
              No hay movimientos registrados en este periodo.
            </div>
          ) : (
            <div className="space-y-4">
              {filtrados.map((mov) => (
                <div
                  key={`${mov.tipo}-${mov.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${mov.tipo === "INGRESO" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}
                    >
                      {mov.tipo === "INGRESO" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {mov.concepto}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(mov.fecha).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${mov.tipo === "INGRESO" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {mov.tipo === "INGRESO" ? "+" : "-"}
                      {formatearMoneda(mov.monto)}
                    </p>
                    {mov.tipo === "INGRESO" && (
                      <p
                        className="text-[10px] text-muted-foreground font-medium mt-0.5"
                        title="Ganancia Neta de esta venta"
                      >
                        Neta: {formatearMoneda(mov.ganancia)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
