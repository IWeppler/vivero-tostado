"use client";

import { useState, useMemo, useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Banknote,
  CreditCard,
  Lock,
  Unlock,
  Loader2,
  Info,
  Clock,
} from "lucide-react";
import { EgresoModal } from "./egreso-modal";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { abrirTurnoAction, cerrarTurnoAction } from "../actions/open-caja";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  TurnoCajaHistorial,
  VentaCaja,
  EgresoCaja,
  CajaActionState,
  Movimiento,
} from "@/entities/caja/types";
import { CajaHistoryTable } from "./caja-history-table";
import { formatearMoneda } from "@/shared/utils/formatters";

export interface CajaDashboardProps {
  turno: TurnoCajaHistorial | null;
  ventas: VentaCaja[];
  egresos: EgresoCaja[];
  historial: TurnoCajaHistorial[];
}

export function CajaDashboard({
  turno,
  ventas,
  egresos,
  historial,
}: Readonly<CajaDashboardProps>) {
  const [isCerrarOpen, setIsCerrarOpen] = useState(false);

  // States para los actions
  const [, abrirAction, isAbrirPending] = useActionState(
    async (prevState: CajaActionState, formData: FormData) => {
      const res = await abrirTurnoAction(prevState, formData);
      if (res.success) toast.success("Caja abierta correctamente.");
      else toast.error(res.error);
      return res;
    },
    { error: null, success: false },
  );

  const [, cerrarAction, isCerrarPending] = useActionState(
    async (prevState: CajaActionState, formData: FormData) => {
      const res = await cerrarTurnoAction(prevState, formData);
      if (res.success) {
        toast.success("Turno cerrado. Arqueo guardado.");
        setIsCerrarOpen(false);
      } else {
        toast.error(res.error);
      }
      return res;
    },
    { error: null, success: false },
  );

  // --- LÓGICA DE CÁLCULO DEL TURNO ABIERTO ---
  const { movimientos, totales } = useMemo(() => {
    if (!turno)
      return {
        movimientos: [],
        totales: {
          fondoInicial: 0,
          ingresosEfectivo: 0,
          ingresosDigitales: 0,
          totalEgresos: 0,
          efectivoEsperado: 0,
          totalFacturado: 0,
        },
      };

    const ventasMapeadas: Movimiento[] = ventas.map((v) => {
      const monto = Number(v.total);
      return {
        id: v.id,
        tipo: "INGRESO",
        concepto: `Venta: ${v.producto?.nombre || "Varios"}`,
        metodo: v.metodo_pago || "EFECTIVO",
        monto: monto,
        fecha: v.fecha_venta,
        usuario: v.perfiles?.nombre || "Vendedor",
      };
    });

    const egresosMapeados: Movimiento[] = egresos.map((e) => {
      const monto = Number(e.monto);
      return {
        id: e.id,
        tipo: "EGRESO",
        concepto: `Gasto: ${e.concepto}`,
        metodo: "EFECTIVO", // Todo gasto sale del cajón
        monto: monto,
        fecha: e.fecha,
        usuario: e.perfiles?.nombre || "Usuario",
      };
    });

    const todos = [...ventasMapeadas, ...egresosMapeados].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    const ingresosEfectivo = ventasMapeadas
      .filter((movimiento) => movimiento.metodo === "EFECTIVO")
      .reduce((total, movimiento) => total + movimiento.monto, 0);

    const ingresosDigitales = ventasMapeadas
      .filter((movimiento) => movimiento.metodo !== "EFECTIVO")
      .reduce((total, movimiento) => total + movimiento.monto, 0);

    const totalEgresos = egresosMapeados.reduce(
      (total, movimiento) => total + movimiento.monto,
      0,
    );

    const fondoInicial = Number(turno.monto_inicial);

    // Solución: El dinero físico no puede ser negativo. Si el gasto supera lo que hay en caja,
    // lo mínimo a esperar físicamente en el cajón son $0.
    const efectivoEsperado = Math.max(
      0,
      fondoInicial + ingresosEfectivo - totalEgresos,
    );

    return {
      movimientos: todos,
      totales: {
        fondoInicial,
        ingresosEfectivo,
        ingresosDigitales,
        totalEgresos,
        efectivoEsperado,
        totalFacturado: ingresosEfectivo + ingresosDigitales,
      },
    };
  }, [ventas, egresos, turno]);

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* SECCIÓN 1: ESTADO ACTUAL (ABIERTA O CERRADA) */}
      {!turno ? (
        <Card className="border-border bg-background shadow-none overflow-hidden rounded-2xl">
          <div className="flex flex-col md:flex-row">
            <div className="p-6 md:p-10 md:w-1/2 flex flex-col justify-center">
              <div className="w-12 h-12 bg-primary/5 text-primary border border-primary/30 rounded-xl flex items-center justify-center mb-5">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                La caja está cerrada
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Antes de comenzar a registrar ventas o movimientos de dinero,
                debes iniciar un nuevo turno de caja declarando el efectivo
                inicial.
              </p>
            </div>
            <div className="p-6 md:p-10 md:w-1/2 border-t md:border-t-0 md:border-l border-border bg-card flex flex-col justify-center">
              <form action={abrirAction} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="monto_inicial"
                    className="text-sm font-semibold text-foreground uppercase tracking-widest"
                  >
                    Fondo Inicial
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      $
                    </span>
                    <Input
                      id="monto_inicial"
                      name="monto_inicial"
                      type="number"
                      min="0"
                      required
                      className="pl-9 text-lg font-bold h-12 shadow-none rounded-xl border-border/60 hover:border-foreground/40 focus-visible:border-foreground transition-colors bg-[#f5f4f4] focus-visible:bg-background"
                      placeholder="Ej: 5000"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monto de cambio (billetes/monedas) en el cajón.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isAbrirPending}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-none cursor-pointer transition-colors"
                >
                  {isAbrirPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Unlock className="w-5 h-5 mr-2" />
                  )}
                  Abrir Turno
                </Button>
              </form>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-none">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full items-center justify-center border border-emerald-100">
                <Unlock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 "></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                    Turno Abierto
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Apertura:{" "}
                  {new Date(turno.fecha_apertura).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <EgresoModal />

              <Dialog open={isCerrarOpen} onOpenChange={setIsCerrarOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto shadow-none cursor-pointer">
                    <Lock className="w-4 h-4 mr-2" /> Cierre Z (Arqueo)
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-105 p-0 overflow-hidden border-border shadow-2xl">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold">
                      Cierre de Caja
                    </DialogTitle>
                  </DialogHeader>

                  <div className="px-6 py-4">
                    <div className="bg-[#f5f4f4] p-5 rounded-xl border border-border/50 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">
                          Fondo Inicial
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatearMoneda(totales.fondoInicial)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">
                          Ventas (Efectivo)
                        </span>
                        <span className="font-semibold text-emerald-600">
                          +{formatearMoneda(totales.ingresosEfectivo)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">
                          Gastos (Efectivo)
                        </span>
                        <span className="font-semibold text-rose-600">
                          -{formatearMoneda(totales.totalEgresos)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-3 border-t border-border mt-1">
                        <span className="text-foreground">
                          Efectivo Esperado
                        </span>
                        <span className="text-emerald-700">
                          {formatearMoneda(totales.efectivoEsperado)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form action={cerrarAction} className="px-6 pb-6 space-y-5">
                    <input type="hidden" name="turno_id" value={turno.id} />
                    <input
                      type="hidden"
                      name="efectivo_esperado"
                      value={totales.efectivoEsperado}
                    />
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        Efectivo real en cajón
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                          $
                        </span>
                        <Input
                          name="monto_final"
                          type="number"
                          min="0"
                          required
                          className="pl-9 font-bold h-12 text-lg shadow-none rounded-xl border-border/60 hover:border-foreground/40 focus-visible:border-foreground bg-background"
                          placeholder={totales.efectivoEsperado.toString()}
                        />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mt-1 font-semibold">
                        <Info className="w-3 h-3" /> El sistema calculará
                        diferencias
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={isCerrarPending}
                      className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-background font-bold rounded-xl shadow-none cursor-pointer"
                    >
                      {isCerrarPending
                        ? "Cerrando turno..."
                        : "Confirmar Cierre"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tarjetas de Métricas de Flujo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-emerald-50 dark:bg-emerald-100/10 border border-emerald-200 dark:border-emerald-200/20 shadow-none rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-500">
                  Efectivo Esperado
                </CardTitle>
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-emerald-700 tracking-tight dark:text-emerald-300">
                  {formatearMoneda(totales.efectivoEsperado)}
                </div>
                <p className="text-xs mt-1 text-emerald-600/80 font-medium dark:text-emerald-500">
                  Dinero físico en cajón
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-none rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Fondo Inicial
                </CardTitle>
                <Wallet className="w-4 h-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatearMoneda(totales.fondoInicial)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-none rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Digital (Tarj/Transf)
                </CardTitle>
                <CreditCard className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatearMoneda(totales.ingresosDigitales)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-rose-50/50 dark:bg-destructive/10 border-rose-100 dark:border-destructive shadow-none rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-800 dark:text-destructive">
                  Egresos Físicos
                </CardTitle>
                <ArrowDownRight className="w-4 h-4 text-rose-500 dark:text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-700 dark:text-destructive">
                  {formatearMoneda(totales.totalEgresos)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Movimientos del Turno Abierto */}
          <Card className="border-border shadow-none overflow-hidden bg-card rounded-2xl">
            <CardHeader className="bg-transparent border-b border-border py-4 px-5">
              <CardTitle className="text-base flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  Movimientos de Hoy
                </div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Total Facturado:{" "}
                  <Badge
                    variant="secondary"
                    className="bg-muted text-foreground font-bold text-sm shadow-none rounded-md px-2 py-0.5"
                  >
                    {formatearMoneda(totales.totalFacturado)}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground text-xs uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-5 py-3 border-b border-border">Hora</th>
                    <th className="px-5 py-3 border-b border-border">
                      Concepto
                    </th>
                    <th className="px-5 py-3 border-b border-border">Método</th>
                    <th className="px-5 py-3 text-right border-b border-border">
                      Monto
                    </th>
                    <th className="px-5 py-3 hidden sm:table-cell border-b border-border">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {movimientos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-muted-foreground bg-transparent"
                      >
                        Aún no hay movimientos registrados en este turno.
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((mov) => (
                      <tr
                        key={`${mov.tipo}-${mov.id}`}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5 text-muted-foreground backgroundspace-nowrap text-xs font-medium">
                          {new Date(mov.fecha).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1 rounded-md ${mov.tipo === "INGRESO" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                            >
                              {mov.tipo === "INGRESO" ? (
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                              )}
                            </div>
                            <span className="truncate max-w-50 sm:max-w-75">
                              {mov.concepto}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold uppercase shadow-none bg-muted/50"
                          >
                            {mov.metodo}
                          </Badge>
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-bold tracking-tight ${mov.tipo === "INGRESO" ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {mov.tipo === "INGRESO" ? "+" : "-"}
                          {formatearMoneda(mov.monto)}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell text-xs">
                          {mov.usuario}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SECCIÓN 2: HISTORIAL DE TURNOS (SIEMPRE VISIBLE) */}
      <CajaHistoryTable historial={historial} />
    </div>
  );
}
