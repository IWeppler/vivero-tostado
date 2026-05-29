"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TicketData,
  TicketItemData,
  Venta,
  VentaItem,
  getSupabaseRelation,
} from "@/entities/ventas/types";
import { Producto } from "@/entities/productos/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Download, Eye, Receipt, ShoppingBag, Search } from "lucide-react";
import { AnularVentaModal } from "./cancel-sale-modal";
import { RegistrarVentaModal } from "./create-sale-modal";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { TicketSheet } from "./ticket-sheet";
import { ConfiguracionPOS } from "@/entities/config/types";
import { createClient } from "@/shared/config/supabase/client";

interface VentasTableProps {
  ventas: Venta[];
  productos: Producto[];
  userRole: string;
}

const formatearFecha = (fechaString: string) => {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaString));
};

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
};

export function VentasTable({
  ventas = [],
  productos = [],
  userRole,
}: Readonly<VentasTableProps>) {
  const [filtroNombre, setFiltroNombre] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [branding, setBranding] = useState<ConfiguracionPOS | null>(null);

  const [ticketAbierto, setTicketAbierto] = useState<TicketData | null>(null);

  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("configuracion_pos")
        .select("*")
        .single();

      if (data) {
        setBranding(data as ConfiguracionPOS);
      }
    };

    fetchConfig();
  }, []);

  const ordenOptions = [
    { value: "recientes", label: "Más recientes" },
    { value: "antiguos", label: "Más antiguos" },
    { value: "mayor_total", label: "Mayor ingreso" },
    ...(isAdmin
      ? [{ value: "mayor_ganancia", label: "Mayor ganancia neta" }]
      : []),
    { value: "menor_total", label: "Menor ingreso" },
    { value: "mayor_cantidad", label: "Más unidades vendidas" },
  ];

  const ventasFiltradasYOrdenadas = useMemo(() => {
    const resultado = ventas.filter((venta) => {
      const items = venta.ventas_items || [];
      if (items.length === 0) return false;

      const searchLower = filtroNombre.toLowerCase().replace("#", "");
      const numeroRecibo = venta.id.split("-")[0].toLowerCase();
      const matchRecibo = numeroRecibo.includes(searchLower);

      const matchesFiltros = items.some((item: VentaItem) => {
        const producto = getSupabaseRelation(item.producto);
        const nombre = producto?.nombre?.toLowerCase() || "";
        return nombre.includes(searchLower) || matchRecibo;
      });

      return matchesFiltros;
    });

    resultado.sort((a, b) => {
      const gananciaA = a.total - (a.precio_costo || 0);
      const gananciaB = b.total - (b.precio_costo || 0);

      const cantA = (a.ventas_items || []).reduce(
        (acc: number, item: VentaItem) => acc + item.cantidad,
        0,
      );
      const cantB = (b.ventas_items || []).reduce(
        (acc: number, item: VentaItem) => acc + item.cantidad,
        0,
      );

      switch (orden) {
        case "recientes":
          return (
            new Date(b.fecha_venta).getTime() -
            new Date(a.fecha_venta).getTime()
          );
        case "antiguos":
          return (
            new Date(a.fecha_venta).getTime() -
            new Date(b.fecha_venta).getTime()
          );
        case "mayor_total":
          return b.total - a.total;
        case "mayor_ganancia":
          return gananciaB - gananciaA;
        case "menor_total":
          return a.total - b.total;
        case "mayor_cantidad":
          return cantB - cantA;
        default:
          return 0;
      }
    });

    return resultado;
  }, [ventas, filtroNombre, orden]);

  const abrirTicket = (venta: Venta) => {
    // Obtenemos el descuento de la cabecera si existe
    const descuento =
      venta.ventas_descuentos && venta.ventas_descuentos.length > 0
        ? venta.ventas_descuentos[0]
        : null;

    setTicketAbierto({
      items: (venta.ventas_items || []).map(
        (item: VentaItem): TicketItemData => ({
          nombre:
            getSupabaseRelation(item.producto)?.nombre || "Producto eliminado",
          variante: item.variante,
          cantidad: item.cantidad,
          precioUnitario: item.precio_unitario,
        }),
      ),
      total: venta.total,
      metodoPago: venta.metodo_pago || "EFECTIVO",
      nroRecibo: venta.id.split("-")[0].toUpperCase(),
      fecha: formatearFecha(venta.fecha_venta),
      vendedor: getSupabaseRelation(venta.perfiles)?.nombre || "Administrador",
      descuentoMonto: descuento
        ? Number(descuento.monto_descontado)
        : undefined,
      promocionNombre: descuento ? descuento.promocion_nombre : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <TicketSheet
        ticket={ticketAbierto}
        config={branding || ({} as ConfiguracionPOS)}
        onClose={() => setTicketAbierto(null)}
      />

      {/* HEADER: Buscador, Ordenamiento y Acciones */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card p-4 sm:p-5 rounded-2xl border border-border">
        {/* Buscador Integrado */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto o #recibo..."
            className="pl-11 h-12 text-base rounded-xl border-border/60 bg-[#f5f4f4] shadow-none transition-colors"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
        </div>

        {/* Controles y Botonera Admin */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
          {/* Selector de Orden */}
          <Select value={orden} onValueChange={setOrden}>
            <SelectTrigger className="h-12 w-full sm:w-[200px] rounded-xl border-border/60 bg-background shadow-none font-medium">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {ordenOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botones Admin */}
          <div className="flex flex-1 sm:flex-none justify-end gap-2 sm:ml-2 sm:pl-4 sm:border-l sm:border-border">
            {isAdmin && (
              <Button
                variant="outline"
                className="hidden sm:flex h-12 px-4 bg-background border-border/60 hover:bg-muted rounded-xl shadow-none font-semibold"
              >
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            )}
            <div className="w-full sm:w-auto [&>button]:h-12 [&>button]:rounded-xl">
              <RegistrarVentaModal productos={productos} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLA O EMPTY STATE */}
      {ventas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-border">
          <Receipt className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium text-lg">
            Aún no hay ventas registradas en el sistema.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-150">
              <TableHeader>
                <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
                  <TableHead className="w-28 pl-4 sm:pl-6">Recibo</TableHead>
                  <TableHead>Resumen de Venta</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Vendedor
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Pago</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                  <TableHead className="text-right w-32 pr-4 sm:pr-6">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasFiltradasYOrdenadas.length > 0 ? (
                  ventasFiltradasYOrdenadas.map((venta) => {
                    const items = venta.ventas_items || [];
                    const primerItem = items[0];

                    if (!primerItem) return null;

                    const producto = getSupabaseRelation(primerItem.producto);
                    const isEliminado = !producto;
                    const nombrePrincipal = isEliminado
                      ? "Producto eliminado"
                      : producto.nombre;
                    const itemsExtra = items.length - 1;

                    const gananciaNeta =
                      venta.total - (venta.precio_costo || 0);
                    const nombreVendedor =
                      getSupabaseRelation(venta.perfiles)?.nombre ||
                      "Administrador";
                    const metodoPago = venta.metodo_pago || "EFECTIVO";

                    return (
                      <TableRow
                        key={venta.id}
                        className="hover:bg-muted/20 cursor-pointer transition-colors border-b border-border/40"
                        onClick={() => abrirTicket(venta)}
                      >
                        <TableCell className="font-bold text-muted-foreground text-xs pl-4 sm:pl-6">
                          #{venta.id.split("-")[0].toUpperCase()}
                        </TableCell>

                        <TableCell className="font-semibold text-foreground py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/5 text-primary hidden sm:block">
                              <ShoppingBag className="w-4 h-4 shrink-0" />
                            </div>
                            <span className="truncate max-w-50 sm:max-w-xs">
                              {nombrePrincipal}
                              {itemsExtra > 0 ? (
                                <span className="text-muted-foreground font-normal ml-1">
                                  y {itemsExtra} artículo
                                  {itemsExtra > 1 ? "s" : ""} más
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-normal ml-1">
                                  · Talle {primerItem.variante} · x
                                  {primerItem.cantidad}
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* ¡Agregamos suppressHydrationWarning aquí! */}
                        <TableCell
                          className="text-sm text-muted-foreground hidden sm:table-cell"
                          suppressHydrationWarning
                        >
                          {formatearFecha(venta.fecha_venta)}
                        </TableCell>

                        <TableCell className="text-sm font-medium text-muted-foreground hidden md:table-cell">
                          {nombreVendedor}
                        </TableCell>

                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-bold tracking-widest bg-muted/50 shadow-none border-border/60"
                          >
                            {metodoPago}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="font-semibold text-foreground text-base">
                            {formatearMoneda(venta.total)}
                          </div>
                          {isAdmin && (
                            <div
                              className="text-xs font-bold text-emerald-600 mt-0.5"
                              title="Ganancia neta del ticket"
                            >
                              +{formatearMoneda(gananciaNeta)}
                            </div>
                          )}
                        </TableCell>

                        <TableCell
                          className="text-right pr-4 sm:pr-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground font-medium h-9 w-9 p-0 hover:bg-muted hover:text-foreground rounded-md transition-colors shadow-none"
                              onClick={() => abrirTicket(venta)}
                              title="Ver recibo detallado"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </Button>

                            {isAdmin && (
                              <AnularVentaModal
                                id={venta.id}
                                productoNombre={
                                  itemsExtra > 0
                                    ? "Ticket Completo"
                                    : nombrePrincipal || "Varios artículos"
                                }
                                cantidad={
                                  itemsExtra > 0
                                    ? venta.cantidad
                                    : primerItem.cantidad
                                }
                                variante={
                                  itemsExtra > 0
                                    ? "Varios artículos"
                                    : primerItem.variante
                                }
                                isProductoEliminado={isEliminado}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground bg-card"
                    >
                      No se encontraron tickets que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
