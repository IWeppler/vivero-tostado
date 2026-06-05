"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Loader2,
  Printer,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
} from "lucide-react";
import { getDetallesTurnoAction } from "../actions/get-details";
import { TurnoCajaHistorial } from "@/entities/caja/types";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { formatearMoneda } from "@/shared/utils/formatters";

interface CajaDetailSheetProps {
  turno: TurnoCajaHistorial | null;
  onClose: () => void;
}

export function CajaDetailSheet({
  turno,
  onClose,
}: Readonly<CajaDetailSheetProps>) {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!turno) return;

    const fetchDetalles = async () => {
      setIsLoading(true);
      const res = await getDetallesTurnoAction(
        turno.fecha_apertura,
        turno.fecha_cierre,
      );

      if (res.data) {
        const ventasMapeadas = res.data.ventas.map((v: any) => ({
          id: v.id,
          tipo: "INGRESO",
          concepto: `Venta: ${v.producto?.nombre || "Varios"}`,
          metodo: v.metodo_pago || "EFECTIVO",
          monto: Number(v.total),
          fecha: v.fecha_venta,
          usuario: v.perfiles?.nombre || "Vendedor",
        }));

        const egresosMapeados = res.data.egresos.map((e: any) => ({
          id: e.id,
          tipo: "EGRESO",
          concepto: `Gasto: ${e.concepto}`,
          metodo: "EFECTIVO",
          monto: Number(e.monto),
          fecha: e.fecha,
          usuario: e.perfiles?.nombre || "Usuario",
        }));

        const todos = [...ventasMapeadas, ...egresosMapeados].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        );

        setMovimientos(todos);
      }
      setIsLoading(false);
    };

    fetchDetalles();
  }, [turno]);

  if (!turno) return null;

  const isAbierto = turno.estado === "ABIERTO";
  const idCorto = turno.id.split("-")[0].toUpperCase();

  const final = Number(turno.monto_final || 0);
  const esperado = Math.max(0, Number(turno.efectivo_esperado));
  const diferencia = final - esperado;

  return (
    <Sheet
      open={turno !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-6 border-b border-border bg-background z-10 shrink-0">
          <SheetTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
            <div className="p-2 bg-muted rounded-full">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            Auditoría de Turno
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Ticket Z #{idCorto}
            </p>
          </div>

          {/* Tarjeta de Resumen Financiero */}
          <div className="bg-background p-5 rounded-2xl border border-border mb-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Resultado del Arqueo
              </span>
              {isAbierto ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  En Curso
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-neutral-100 text-neutral-600 border-neutral-200"
                >
                  Finalizado
                </Badge>
              )}
            </div>

            {!isAbierto && (
              <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    Diferencia
                  </p>
                  {diferencia === 0 ? (
                    <span className="text-xl font-black text-emerald-600">
                      Caja Cuadrada
                    </span>
                  ) : diferencia < 0 ? (
                    <span className="text-xl font-black text-rose-600">
                      Faltante: {formatearMoneda(diferencia)}
                    </span>
                  ) : (
                    <span className="text-xl font-black text-blue-600">
                      Sobrante: +{formatearMoneda(diferencia)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Fondo Inicial declarado:</span>
                <span className="font-medium text-foreground">
                  {formatearMoneda(Number(turno.monto_inicial))}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Efectivo Esperado (Sistema):</span>
                <span className="font-medium text-foreground">
                  {isAbierto ? "-" : formatearMoneda(esperado)}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Efectivo Contado (Físico):</span>
                <span className="font-bold text-foreground">
                  {isAbierto ? "-" : formatearMoneda(final)}
                </span>
              </div>
            </div>
          </div>

          {/* Listado de Movimientos */}
          <div className="space-y-3 pb-8">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Línea de
              Tiempo
            </h3>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : movimientos.length === 0 ? (
              <div className="bg-background border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                No hubo movimientos de dinero en este turno.
              </div>
            ) : (
              <div className="bg-background border border-border rounded-xl p-2 divide-y divide-border/60">
                {movimientos.map((mov) => (
                  <div
                    key={`${mov.tipo}-${mov.id}`}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${mov.tipo === "INGRESO" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
                      >
                        {mov.tipo === "INGRESO" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground max-w-[140px] truncate">
                          {mov.concepto}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {new Date(mov.fecha).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • {mov.metodo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold text-sm ${mov.tipo === "INGRESO" ? "text-emerald-600" : "text-destructive"}`}
                      >
                        {mov.tipo === "INGRESO" ? "+" : "-"}
                        {formatearMoneda(mov.monto)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        {mov.usuario}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Botonera Flotante (Imprimir) */}
        {!isAbierto && (
          <div className="p-4 bg-background border-t border-border flex justify-center z-10 shrink-0">
            <Button
              variant="ghost"
              className="w-full flex h-12 gap-2 text-foreground font-bold hover:bg-muted border border-border"
              onClick={() => window.print()}
            >
              <Printer className="w-5 h-5 mr-1" /> Imprimir Cierre Z
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
