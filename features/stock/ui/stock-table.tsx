"use client";

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
import { Image as ImageIcon } from "lucide-react";
import { EditarProductoModal } from "./edit-modal";
import { EliminarProductoModal } from "./delete-modal";
import { TogglePublicado } from "./toggle-shared";

interface StockTableProps {
  productos: Producto[];
}

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
};

// Pequeño helper para embellecer los textos de la categoría y cuidados
const capitalizar = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace("_", " ");
};

export function StockTable({ productos }: Readonly<StockTableProps>) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-border">
        <p className="text-muted-foreground">
          No hay productos en el inventario.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Imagen</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Cuidados</TableHead>
            <TableHead>Stock por Variante</TableHead>
            <TableHead className="text-center">Visible</TableHead>
            <TableHead className="text-right">Costo</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((producto) => {
            let primeraImagen = null;
            if (
              Array.isArray(producto.imagen_url) &&
              producto.imagen_url.length > 0
            ) {
              primeraImagen = producto.imagen_url[0];
            } else if (typeof producto.imagen_url === "string") {
              if (producto.imagen_url.startsWith("[")) {
                try {
                  const parsed = JSON.parse(producto.imagen_url);
                  primeraImagen = Array.isArray(parsed)
                    ? parsed[0]
                    : producto.imagen_url;
                } catch {
                  primeraImagen = producto.imagen_url;
                }
              } else {
                primeraImagen = producto.imagen_url;
              }
            }

            // Calculamos la ganancia unitaria estimada (Venta - Costo)
            const precioCosto = producto.precio_costo || 0;
            const margenEstimado = producto.precio - precioCosto;

            return (
              <TableRow key={producto.id}>
                <TableCell>
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border">
                    {primeraImagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primeraImagen}
                        alt={producto.nombre}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-card-foreground">
                  {producto.nombre}
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {capitalizar(producto.tipo)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="font-normal capitalize bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                  >
                    {capitalizar(producto.cuidados)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {producto.stock && producto.stock.length > 0 ? (
                      producto.stock.map((s) => (
                        <Badge
                          key={s.id}
                          variant={s.cantidad > 0 ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {s.variante}: {s.cantidad}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        Sin stock
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <TogglePublicado
                    id={producto.id}
                    publicadoInicial={producto.publicado ?? true}
                  />
                </TableCell>

                <TableCell className="text-right text-muted-foreground font-medium">
                  {formatearMoneda(precioCosto)}
                </TableCell>
                <TableCell
                  className="text-right font-medium"
                  title={`Ganancia estimada: ${formatearMoneda(margenEstimado)}`}
                >
                  {formatearMoneda(producto.precio)}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditarProductoModal producto={producto} />
                    <EliminarProductoModal
                      id={producto.id}
                      nombre={producto.nombre}
                      tipo={producto.tipo}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
