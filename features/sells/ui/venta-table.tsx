"use client";

import { useState, useMemo } from "react";
import { Venta } from "@/entities/ventas/types";
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
import { Image as ImageIcon, Receipt, Download } from "lucide-react";
import { AnularVentaModal } from "./anular-modal";
import { FilterToolbar } from "@/shared/ui/filter-toolbar";
import { RegistrarVentaModal } from "./venta-modal";
import { Button } from "@/shared/ui/button";

interface VentasTableProps {
  ventas: Venta[];
  productos: Producto[];
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
}: Readonly<VentasTableProps>) {
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTemporada, setFiltroTemporada] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroVariante, setFiltroVariante] = useState("todos");
  const [orden, setOrden] = useState("recientes");

  const ordenOptions = [
    { value: "recientes", label: "Más recientes" },
    { value: "antiguos", label: "Más antiguos" },
    { value: "mayor_total", label: "Mayor ingreso" },
    { value: "mayor_ganancia", label: "Mayor ganancia neta" },
    { value: "menor_total", label: "Menor ingreso" },
    { value: "mayor_cantidad", label: "Más unidades vendidas" },
  ];

  const ventasFiltradasYOrdenadas = useMemo(() => {
    // 1. Filtrar
    const resultado = ventas.filter((venta) => {
      const nombre = venta.producto?.nombre?.toLowerCase() || "";
      const temporada = venta.producto?.temporada?.toLowerCase() || "";
      const tipo = venta.producto?.tipo?.toLowerCase() || "";
      const variante = venta.variante?.toLowerCase() || "";

      const matchNombre = nombre.includes(filtroNombre.toLowerCase());
      const matchTemporada = temporada.includes(filtroTemporada.toLowerCase());
      const matchTipo =
        filtroTipo === "todos" || tipo === filtroTipo.toLowerCase();
      const matchVariante =
        filtroVariante === "todos" || variante === filtroVariante.toLowerCase();

      return matchNombre && matchTemporada && matchTipo && matchVariante;
    });

    // 2. Ordenar
    resultado.sort((a, b) => {
      // Cálculo seguro de ganancia por si hay ventas viejas sin costo cargado
      const gananciaA =
        (a.precio_unitario - (a.precio_costo || 0)) * a.cantidad;
      const gananciaB =
        (b.precio_unitario - (b.precio_costo || 0)) * b.cantidad;

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
          return b.cantidad - a.cantidad;
        default:
          return 0;
      }
    });

    return resultado;
  }, [
    ventas,
    filtroNombre,
    filtroTemporada,
    filtroTipo,
    filtroVariante,
    orden,
  ]);

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroTemporada("");
    setFiltroTipo("todos");
    setFiltroVariante("todos");
    setOrden("recientes");
  };

  const hayFiltrosActivos =
    filtroNombre !== "" ||
    filtroTemporada !== "" ||
    filtroTipo !== "todos" ||
    filtroVariante !== "todos" ||
    orden !== "recientes";

  const actionButtons = (
    <>
      <Button
        variant="outline"
        className="hidden sm:flex w-full sm:w-auto bg-card text-muted-foreground mr-2 h-9 text-[10px] font-bold uppercase tracking-widest shadow-sm"
      >
        <Download className="mr-2 h-3.5 w-3.5" /> Exportar CSV
      </Button>
      <RegistrarVentaModal productos={productos} />
    </>
  );

  if (ventas.length === 0) {
    return (
      <div className="space-y-4">
        <FilterToolbar
          searchQuery={filtroNombre}
          onSearchChange={setFiltroNombre}
          searchPlaceholder="Buscar por equipo..."
          temporada={filtroTemporada}
          onTemporadaChange={setFiltroTemporada}
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
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-border">
          <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">
            Aún no hay ventas registradas.
          </p>
          <p className="text-sm text-muted-foreground/70">
            ¡Las ventas aparecerán aquí cuando empieces a vender!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterToolbar
        searchQuery={filtroNombre}
        onSearchChange={setFiltroNombre}
        searchPlaceholder="Buscar por equipo..."
        temporada={filtroTemporada}
        onTemporadaChange={setFiltroTemporada}
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

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Imagen</TableHead>
              <TableHead>Producto Vendido</TableHead>
              <TableHead>Talle</TableHead>
              <TableHead className="text-center">Cant.</TableHead>
              <TableHead>Fecha de Venta</TableHead>
              <TableHead className="text-right">Precio / Costo</TableHead>
              <TableHead className="text-right font-bold">
                Total / Ganancia
              </TableHead>
              <TableHead className="text-right w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventasFiltradasYOrdenadas.length > 0 ? (
              ventasFiltradasYOrdenadas.map((venta) => {
                let primeraImagen = null;
                const imagenUrl = venta.producto?.imagen_url;

                if (Array.isArray(imagenUrl) && imagenUrl.length > 0) {
                  primeraImagen = imagenUrl[0];
                } else if (typeof imagenUrl === "string") {
                  if (imagenUrl.startsWith("[")) {
                    try {
                      const parsed = JSON.parse(imagenUrl);
                      primeraImagen = Array.isArray(parsed)
                        ? parsed[0]
                        : imagenUrl;
                    } catch {
                      primeraImagen = imagenUrl;
                    }
                  } else {
                    primeraImagen = imagenUrl;
                  }
                }

                const isEliminado = !venta.producto;
                const nombreProducto = isEliminado
                  ? "Producto eliminado"
                  : `${venta.producto?.nombre} (${venta.producto?.temporada})`;

                // Cálculo de ganancia
                const costoUnitario = venta.precio_costo || 0;
                const gananciaNeta =
                  (venta.precio_unitario - costoUnitario) * venta.cantidad;

                return (
                  <TableRow key={venta.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {primeraImagen ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primeraImagen}
                            alt="Producto"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-card-foreground">
                      {isEliminado ? (
                        <span className="text-muted-foreground italic">
                          Producto eliminado
                        </span>
                      ) : (
                        <>
                          <div>{venta.producto?.nombre}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {venta.producto?.temporada}
                          </div>
                        </>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-medium bg-muted/50"
                      >
                        {venta.variante}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-medium">
                      {venta.cantidad}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
                      {formatearFecha(venta.fecha_venta)}
                    </TableCell>

                    {/* COLUMNA APILADA: Precio y Costo */}
                    <TableCell className="text-right">
                      <div className="font-medium text-foreground">
                        {formatearMoneda(venta.precio_unitario)}
                      </div>
                      <div
                        className="text-xs text-muted-foreground mt-0.5"
                        title="Costo unitario"
                      >
                        Costo: {formatearMoneda(costoUnitario)}
                      </div>
                    </TableCell>

                    {/* COLUMNA APILADA: Total y Ganancia */}
                    <TableCell className="text-right">
                      <div className="font-bold text-foreground">
                        {formatearMoneda(venta.total)}
                      </div>
                      <div
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mt-0.5"
                        title="Ganancia neta total"
                      >
                        +{formatearMoneda(gananciaNeta)}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <AnularVentaModal
                        id={venta.id}
                        productoNombre={nombreProducto}
                        cantidad={venta.cantidad}
                        variante={venta.variante}
                        isProductoEliminado={isEliminado}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron ventas que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
