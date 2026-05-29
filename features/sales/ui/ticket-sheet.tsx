"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import {
  Share2,
  Printer,
  ShoppingBasket,
  Calendar,
  CreditCard,
  User,
  Hash,
  Package,
  CheckCircle2,
} from "lucide-react";
import { TicketData } from "@/entities/ventas/types";


interface TicketSheetProps {
  ticket: TicketData | null;
  onClose: () => void;
}

export function TicketSheet({ ticket, onClose }: Readonly<TicketSheetProps>) {
  const compartirRecibo = () => {
    if (!ticket) return;

    let mensaje = `*🌿 COMPROBANTE DE COMPRA 🌿*\n\n`;
    mensaje += `*Transacción:* #${ticket.nroRecibo}\n`;
    mensaje += `*Fecha:* ${
      ticket.fecha ||
      new Date().toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    }\n`;
    mensaje += `--------------------------------\n`;

    let subtotalItems = 0;

    ticket.items.forEach((item) => {
      const precioUnitario = item.precioUnitario || item.precio || 0;
      subtotalItems += precioUnitario * item.cantidad;
      mensaje += `${item.cantidad}x ${item.nombre} (${item.variante})\n`;
      mensaje += `   $${(precioUnitario * item.cantidad).toLocaleString("es-AR")}\n`;
    });

    // Añadimos el desglose de descuentos al mensaje de WhatsApp
    if (ticket.descuentoMonto && ticket.descuentoMonto > 0) {
      mensaje += `--------------------------------\n`;
      mensaje += `Subtotal: $${subtotalItems.toLocaleString("es-AR")}\n`;
      mensaje += `Descuento (${ticket.promocionNombre}): -$${ticket.descuentoMonto.toLocaleString("es-AR")}\n`;
    }

    mensaje += `--------------------------------\n`;
    mensaje += `*TOTAL PAGADO: $${ticket.total.toLocaleString("es-AR")}*\n`;
    mensaje += `Medio de pago: ${ticket.metodoPago}\n\n`;
    mensaje += `¡Muchas gracias por tu compra! 💚\n`;
    mensaje += `Síguenos en Instagram para ver novedades.`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const subtotalCarrito = (ticket?.total || 0) + (ticket?.descuentoMonto || 0);

  return (
    <Sheet
      open={ticket !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[440px] p-0 flex flex-col h-dvh overflow-hidden bg-background border-l border-border"
      >
        {/* ── HEADER ─────────────────────────────────────────── */}
        <SheetHeader className="flex-row items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0 mt-4 sm:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBasket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold text-foreground leading-tight">
                Detalle de venta
              </SheetTitle>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                #{ticket?.nroRecibo}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* ── SCROLLABLE BODY ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 py-5 space-y-4">
            {/* TOTAL CARD */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="h-1 w-full bg-primary" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total cobrado
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-none text-[10px] font-semibold px-2 py-0.5 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Pagada
                  </Badge>
                </div>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  ${ticket?.total?.toLocaleString("es-AR")}
                </p>
              </div>
            </div>

            {/* TRANSACTION DETAILS */}
            <div className="rounded-xl border border-border bg-card divide-y divide-border shadow-sm">
              <DetailRow
                icon={<Hash className="w-3.5 h-3.5" />}
                label="Nro. recibo"
                value={`#${ticket?.nroRecibo}`}
              />
              <DetailRow
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Fecha y hora"
                value={
                  ticket?.fecha ||
                  new Date().toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                }
              />
              <DetailRow
                icon={<CreditCard className="w-3.5 h-3.5" />}
                label="Método de pago"
                value={ticket?.metodoPago ?? "—"}
              />
              <DetailRow
                icon={<User className="w-3.5 h-3.5" />}
                label="Vendedor"
                value={ticket?.vendedor || "Administrador"}
              />
            </div>

            {/* ITEMS */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Productos ({ticket?.items.length ?? 0})
                </h3>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-sm">
                {ticket?.items.map((item, idx) => {
                  const precioUnidad = item.precioUnitario || item.precio || 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      {/* Qty badge */}
                      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {item.cantidad}
                        </span>
                      </div>
                      {/* Name + variant */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate leading-tight">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Talle: {item.variante}
                          {item.cantidad > 1 && (
                            <span className="ml-2 text-muted-foreground/70">
                              · ${precioUnidad.toLocaleString("es-AR")} c/u
                            </span>
                          )}
                        </p>
                      </div>
                      {/* Subtotal Item */}
                      <p className="text-sm font-semibold text-foreground shrink-0">
                        $
                        {(precioUnidad * item.cantidad).toLocaleString("es-AR")}
                      </p>
                    </div>
                  );
                })}

                {/* Totals footer */}
                <div className="px-4 py-3 bg-muted/40 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotalCarrito.toLocaleString("es-AR")}</span>
                  </div>

                  {/* Fila Dinámica de Descuentos */}
                  {(ticket?.descuentoMonto ?? 0) > 0 ? (
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Descuento ({ticket?.promocionNombre})</span>
                      <span>
                        -${ticket?.descuentoMonto?.toLocaleString("es-AR")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Descuentos</span>
                      <span>$0</span>
                    </div>
                  )}

                  <Separator className="my-1" />
                  <div className="flex justify-between text-sm font-bold text-foreground">
                    <span>Total</span>
                    <span>${ticket?.total?.toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-muted-foreground pb-2">
              ¡Gracias por tu compra! 💚
            </p>
          </div>
        </div>

        {/* ── ACTIONS FOOTER ──────────────────────────────────── */}
        <div className="shrink-0 border-t border-border bg-card px-5 py-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-11 text-sm font-semibold shadow-sm"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button
            className="flex-1 gap-2 h-11 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0 shadow-sm"
            onClick={compartirRecibo}
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── HELPER ───────────────────────────────────────────────────── */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <span className="text-muted-foreground/60">{icon}</span>
        {label}
      </span>
      <span className="text-xs font-medium text-foreground text-right truncate max-w-[55%]">
        {value}
      </span>
    </div>
  );
}