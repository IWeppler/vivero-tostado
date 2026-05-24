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
import { ImageIcon, ShoppingBag, Info } from "lucide-react";
import { EditarProductoModal } from "./edit-modal";
import { EliminarProductoModal } from "./delete-modal";
import { TogglePublicado } from "./toggle-shared";
import Image from "next/image";
import { useCartStore } from "@/shared/store/cart-store";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button } from "@/shared/ui/button";
import { TODAS_LAS_VARIANTES } from "@/entities/productos/constants";
import { MermaModal } from "@/features/merma/ui/merma-modal";
import { ProductDetailSheet } from "./product-detail-sheet";

interface StockTableProps {
  productos: Producto[];
  userRole: string;
}

// --- FUNCIONES HELPER ---

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
};

const capitalizar = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace("_", " ");
};

const obtenerPrimeraImagen = (imagenUrl: unknown): string | null => {
  if (!imagenUrl) return null;
  if (Array.isArray(imagenUrl) && imagenUrl.length > 0) return imagenUrl[0];
  if (typeof imagenUrl === "string") {
    if (imagenUrl.startsWith("[")) {
      try {
        const parsed = JSON.parse(imagenUrl);
        return Array.isArray(parsed) ? parsed[0] : imagenUrl;
      } catch {
        return imagenUrl;
      }
    }
    return imagenUrl;
  }
  return null;
};

export function StockTable({ productos, userRole }: Readonly<StockTableProps>) {
  const addItem = useCartStore((state) => state.addItem);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  const isAdmin = userRole === "ADMIN";

  if (productos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-border">
        <p className="text-muted-foreground">
          No hay productos en el inventario.
        </p>
      </div>
    );
  }

  const handleAñadirAlCarrito = (producto: Producto, variante: string) => {
    const stockDeVariante =
      producto.stock?.find((s) => s.variante === variante)?.cantidad || 0;
    const primeraImagen = obtenerPrimeraImagen(producto.imagen_url);

    const itemData = {
      productoId: producto.id,
      nombre: producto.nombre,
      tipo: producto.tipo,
      variante: variante,
      cantidad: 1,
      precio: producto.precio,
      precioUnitario: producto.precio,
      imagenUrl: primeraImagen,
      stockMaximo: stockDeVariante,
    };

    if (addItem) {
      addItem(itemData);
      setIsOpen(true);
      // toast.success("Añadido al carrito", {
      //   description: `1x ${producto.nombre} (Talle: ${variante})`,
      // });
    } else {
      toast.error("El método addItem no existe en el cart-store");
    }
  };

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 sm:w-20">Imagen</TableHead>
              <TableHead>Producto</TableHead>
              {/* Ocultamos en mobile, se muestran a partir de md (tablets/PC) */}
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead className="hidden md:table-cell">Stock</TableHead>

              {/* Oculto para vendedores */}
              {isAdmin && (
                <>
                  <TableHead className="text-center hidden lg:table-cell">
                    Visible
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    Costo
                  </TableHead>
                </>
              )}

              {/* Siempre visibles */}
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right w-24 sm:w-32">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => {
              const primeraImagen = obtenerPrimeraImagen(producto.imagen_url);
              const precioCosto = producto.precio_costo || 0;
              const margenEstimado = producto.precio - precioCosto;

              const stockOrdenado = producto.stock
                ? [...producto.stock].sort((a, b) => {
                    const indexA = TODAS_LAS_VARIANTES.indexOf(
                      a.variante.toUpperCase(),
                    );
                    const indexB = TODAS_LAS_VARIANTES.indexOf(
                      b.variante.toUpperCase(),
                    );
                    return (
                      (indexA === -1 ? 99 : indexA) -
                      (indexB === -1 ? 99 : indexB)
                    );
                  })
                : [];

              return (
                <TableRow key={producto.id} className="group">
                  <TableCell>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                      {primeraImagen ? (
                        <Image
                          src={primeraImagen}
                          alt={producto.nombre}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          priority={false}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                      )}
                    </div>
                  </TableCell>

                  {/* COLUMNA PRINCIPAL (Agrupa info en Mobile) */}
                  <TableCell>
                    <ProductDetailSheet producto={producto}>
                      <button className="font-medium text-card-foreground text-sm sm:text-base leading-tight hover:text-emerald-600 transition-colors text-left flex items-center gap-1.5 group/btn">
                        {producto.nombre}
                        <Info className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-emerald-600 hidden sm:block" />
                      </button>
                    </ProductDetailSheet>
                    {/* Info exclusiva para Mobile (Agrupa Categoria y Stock) */}
                    <div className="md:hidden mt-1.5 space-y-1.5">
                      <span className="text-[11px] text-muted-foreground capitalize block">
                        {capitalizar(producto.tipo)}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {producto.stock && producto.stock.length > 0 ? (
                          producto.stock.map((s) => (
                            <Badge
                              key={s.id}
                              variant={
                                s.cantidad > 0 ? "outline" : "destructive"
                              }
                              className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30"
                            >
                              {s.variante}: {s.cantidad}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Sin stock
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* COLUMNAS DE ESCRITORIO */}
                  <TableCell className="text-muted-foreground capitalize hidden md:table-cell">
                    {capitalizar(producto.tipo)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
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

                  {isAdmin && (
                    <>
                      <TableCell className="text-center hidden lg:table-cell">
                        <TogglePublicado
                          id={producto.id}
                          publicadoInicial={producto.publicado ?? true}
                        />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-medium hidden md:table-cell">
                        {formatearMoneda(precioCosto)}
                      </TableCell>
                    </>
                  )}

                  {/* PRECIO (Siempre visible) */}
                  <TableCell
                    className="text-right font-bold text-sm sm:text-base"
                    title={
                      isAdmin
                        ? `Ganancia estimada: ${formatearMoneda(margenEstimado)}`
                        : undefined
                    }
                  >
                    {formatearMoneda(producto.precio)}
                  </TableCell>

                  {/* ACCIONES */}
                  <TableCell className="text-right px-2 sm:px-4">
                    <div className="flex items-center justify-end gap-1">
                      <MermaModal producto={producto} />

                      {/* Botón de Venta Rápida */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 h-8 w-8 sm:h-9 sm:w-9 cursor-pointer shrink-0"
                            title="Vender"
                          >
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3 z-10" align="end">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                Venta Rápida
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Selecciona el talle a vender:
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {stockOrdenado.length > 0 ? (
                                stockOrdenado.map((s) => (
                                  <Button
                                    key={s.id}
                                    variant="outline"
                                    size="sm"
                                    disabled={s.cantidad <= 0}
                                    onClick={() =>
                                      handleAñadirAlCarrito(
                                        producto,
                                        s.variante,
                                      )
                                    }
                                    className={`h-9 text-xs font-bold ${
                                      s.cantidad > 0
                                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                        : "opacity-50"
                                    }`}
                                  >
                                    {s.variante}
                                  </Button>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground col-span-3 text-center py-2">
                                  Sin stock
                                </p>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Botones exclusivos de ADMIN */}
                      {isAdmin && (
                        <div className="hidden sm:flex items-center gap-1 ml-1 pl-1 border-l border-border">
                          <EditarProductoModal producto={producto} />
                          <EliminarProductoModal
                            id={producto.id}
                            nombre={producto.nombre}
                            tipo={producto.tipo}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
