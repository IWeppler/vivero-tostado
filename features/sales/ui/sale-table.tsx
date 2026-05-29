"use client";

import { useState, useMemo } from "react";
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
import { Download, Eye, Receipt, Search, ShoppingBag } from "lucide-react";
import { AnularVentaModal } from "./cancel-sale-modal";
import { FilterToolbar } from "@/shared/ui/filter-toolbar";
import { RegistrarVentaModal } from "./create-sale-modal";
import { Button } from "@/shared/ui/button";
import { TicketSheet } from "./ticket-sheet";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";

interface VentasTableProps {
  ventas: Venta[];
  productos: Producto[];
  userRole: string;
}

const formatearFecha = (fechaString: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date(fechaString))
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.day}/${parts.month}/${parts.year}, ${parts.hour}:${parts.minute}`;
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
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroVariante, setFiltroVariante] = useState("todos");
  const [orden, setOrden] = useState("recientes");

  const [ticketAbierto, setTicketAbierto] = useState<TicketData | null>(null);

  const isAdmin = userRole === "ADMIN";

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
      // Leemos los items del nuevo formato relacional
      const items = venta.ventas_items || [];
      if (items.length === 0) return false;

      // Limpiamos la búsqueda (quitamos el # por si el usuario lo escribe)
      const searchLower = filtroNombre.toLowerCase().replace("#", "");
      const numeroRecibo = venta.id.split("-")[0].toLowerCase();
      const matchRecibo = numeroRecibo.includes(searchLower);

      // La venta coincide si AL MENOS UN producto coincide O si coincide el Nro de Recibo
      const matchesFiltros = items.some((item: VentaItem) => {
        const producto = getSupabaseRelation(item.producto);
        const nombre = producto?.nombre?.toLowerCase() || "";
        const variante = item.variante?.toLowerCase() || "";

        const matchNombre = nombre.includes(searchLower);
        const matchTipo = filtroTipo === "todos";
        const matchVariante =
          filtroVariante === "todos" ||
          variante === filtroVariante.toLowerCase();

        return (matchNombre || matchRecibo) && matchTipo && matchVariante;
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
  }, [ventas, filtroNombre, filtroTipo, filtroVariante, orden]);

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroTipo("todos");
    setFiltroVariante("todos");
    setOrden("recientes");
  };

  const hayFiltrosActivos =
    filtroNombre !== "" ||
    filtroTipo !== "todos" ||
    filtroVariante !== "todos" ||
    orden !== "recientes";

  const actionButtons = (
    <>
      {isAdmin && (
        <Button
          variant="outline"
          className="hidden sm:flex w-full sm:w-auto h-10"
        >
          <Download className="mr-2 h-3.5 w-3.5" /> Exportar CSV
        </Button>
      )}
      <RegistrarVentaModal productos={productos} />
    </>
  );

  const abrirTicket = (venta: Venta) => {
    setTicketAbierto({
      items: (venta.ventas_items || []).map(
        (item: VentaItem): TicketItemData => ({
          nombre:
            getSupabaseRelation(item.producto)?.nombre || "Producto eliminado",
          variante: item.variante,
          cantidad: item.cantidad,
          precio: item.precio_unitario,
        }),
      ),
      total: venta.total,
      metodoPago: venta.metodo_pago || "EFECTIVO",
      nroRecibo: venta.id.split("-")[0].toUpperCase(),
      fecha: formatearFecha(venta.fecha_venta),
      vendedor: getSupabaseRelation(venta.perfiles)?.nombre || "Administrador",
    });
  };

  if (ventas.length === 0) {
    return (
      <div className="space-y-4">
        <FilterToolbar
          searchQuery={filtroNombre}
          onSearchChange={setFiltroNombre}
          searchPlaceholder="Buscar producto o recibo..."
          tipo={filtroTipo}
          onTipoChange={setFiltroTipo}
          variante={filtroVariante}
          onVarianteChange={setFiltroVariante}
          orden={orden}
          onOrdenChange={setOrden}
          ordenOptions={ordenOptions}
          onLimpiar={limpiarFiltros}
          hayFiltrosActivos={hayFiltrosActivos}
          actionButtons={actionButtons}
        />
        <div className="flex flex-col items-center justify-center py-12 bg-background rounded-lg border border-border">
          <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">
            Aún no hay ventas registradas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TicketSheet
        ticket={ticketAbierto}
        onClose={() => setTicketAbierto(null)}
      />

      {/* HEADER: Buscador, Ordenamiento y Acciones */}
      <div className="flex flex-col lg:flex-row gap-2 justify-between items-start lg:items-center bg-background p-4 rounded-2xl border border-border">
        {/* Buscador Integrado */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto o #recibo..."
            className="pl-11 h-12 text-base rounded-xl border-border/60 bg-[#f5f4f4] focus-visible:bg-background shadow-none transition-colors"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
          />
        </div>

        {/* Controles y Botonera Admin */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
          {/* Selector de Orden */}
          <Select value={orden} onValueChange={setOrden}>
            <SelectTrigger className="h-12 w-full sm:w-50 rounded-xl border-border/60 bg-background shadow-none font-medium">
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

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-150">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-28">Recibo</TableHead>
                <TableHead>Resumen de Venta</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                <TableHead className="hidden sm:table-cell">Pago</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
                <TableHead className="text-right w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventasFiltradasYOrdenadas.length > 0 ? (
                ventasFiltradasYOrdenadas.map((venta) => {
                  const items = venta.ventas_items || [];
                  const primerItem = items[0];

                  if (!primerItem) return null; // Previene fallos si un ticket quedó vacío por error

                  const producto = getSupabaseRelation(primerItem.producto);
                  const isEliminado = !producto;
                  const nombrePrincipal = isEliminado
                    ? "Producto eliminado"
                    : producto.nombre;
                  const itemsExtra = items.length - 1;

                  const gananciaNeta = venta.total - (venta.precio_costo || 0);
                  const nombreVendedor =
                    getSupabaseRelation(venta.perfiles)?.nombre ||
                    "Administrador";
                  const metodoPago = venta.metodo_pago || "EFECTIVO";

                  return (
                    <TableRow
                      key={venta.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => abrirTicket(venta)}
                    >
                      <TableCell className="font-medium text-muted-foreground text-xs">
                        #{venta.id.split("-")[0].toUpperCase()}
                      </TableCell>

                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                          <span>
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

                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {formatearFecha(venta.fecha_venta)}
                      </TableCell>

                      <TableCell className="text-sm font-medium text-muted-foreground hidden md:table-cell">
                        {nombreVendedor}
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-semibold"
                        >
                          {metodoPago}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="font-bold text-foreground text-base">
                          {formatearMoneda(venta.total)}
                        </div>
                        {isAdmin && (
                          <div
                            className="text-[10px] font-semibold text-emerald-600 mt-0.5"
                            title="Ganancia neta del ticket"
                          >
                            +{formatearMoneda(gananciaNeta)}
                          </div>
                        )}
                      </TableCell>

                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-foreground font-medium px-2 h-8 hover:bg-muted"
                            onClick={() => abrirTicket(venta)}
                            title="Ver recibo detallado"
                          >
                            <Eye className="w-4 h-4" />
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
                    className="h-24 text-center text-muted-foreground bg-muted/10"
                  >
                    No se encontraron tickets que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
