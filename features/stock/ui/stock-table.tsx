"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { Producto } from "@/entities/productos/types";
import { TODAS_LAS_VARIANTES } from "@/entities/productos/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { useCartStore } from "@/shared/store/cart-store";
import { toast } from "sonner";
import {
  Edit2,
  ImageIcon,
  MinusCircle,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { EditarProductoModal } from "./edit-modal";
import { EliminarProductoModal } from "./delete-modal";
import { TogglePublicado } from "./toggle-shared";
import { BajaModal } from "@/features/baja/ui/baja-modal";
import { ProductDetailSheet } from "./product-detail-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface StockTableProps {
  productos: Producto[];
  userRole: string;
}

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
  const [variantesAbiertas, setVariantesAbiertas] = useState<
    Record<string, boolean>
  >({});

  const toggleVariantes = (id: string) => {
    setVariantesAbiertas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAgregarAlCarrito = (
    producto: Producto,
    variante: string,
    stockMax: number,
  ) => {
    if (stockMax <= 0 && !isAdmin) {
      toast.error("No hay stock suficiente.");
      return;
    }

    addItem({
      productoId: producto.id,
      nombre: producto.nombre,
      tipo: producto.tipo,
      variante,
      cantidad: 1,
      precio: producto.precio,
      imagenUrl: obtenerPrimeraImagen(producto.imagen_url),
      stockMaximo: stockMax,
    });
    setIsOpen(true);
  };

  if (productos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No hay productos que coincidan con la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
          <TableHead className="w-14 sm:w-20 pl-4 sm:pl-6 text-muted-foreground">
            Imagen
          </TableHead>
          <TableHead className="text-muted-foreground">Producto</TableHead>
          <TableHead className="text-center hidden sm:table-cell text-muted-foreground">
            Stock Total
          </TableHead>
          {isAdmin && (
            <TableHead className="text-right hidden md:table-cell text-muted-foreground">
              Costo
            </TableHead>
          )}
          <TableHead className="text-right text-muted-foreground">
            Precio Ref.
          </TableHead>
          <TableHead className="text-right w-44 sm:w-56 pr-4 sm:pr-6 text-muted-foreground">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {productos.map((producto) => {
          const primeraImagen = obtenerPrimeraImagen(producto.imagen_url);
          const stockOrdenado = producto.stock
            ? [...producto.stock].sort((a, b) => {
                const indexA = TODAS_LAS_VARIANTES.indexOf(
                  a.variante.toUpperCase(),
                );
                const indexB = TODAS_LAS_VARIANTES.indexOf(
                  b.variante.toUpperCase(),
                );
                return (
                  (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
                );
              })
            : [];
          const totalUnidades = stockOrdenado.reduce(
            (acc, curr) => acc + (curr.cantidad > 0 ? curr.cantidad : 0),
            0,
          );
          const variantesDisponibles = stockOrdenado.filter(
            (variante) => variante.cantidad > 0,
          );
          const sinStock = totalUnidades <= 0;
          const variantesEstanAbiertas = variantesAbiertas[producto.id];

          return (
            <Fragment key={producto.id}>
              <TableRow
                className={`group transition-colors border-b border-border/40 ${
                  variantesEstanAbiertas ? "bg-muted/10" : "hover:bg-muted/20"
                }`}
              >
                <TableCell className="pl-4 sm:pl-6 py-3">
                  <ProductDetailSheet producto={producto} userRole={userRole}>
                    <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/60 cursor-pointer hover:opacity-80 transition-opacity">
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
                    </button>
                  </ProductDetailSheet>
                </TableCell>

                <TableCell className="py-3">
                  <ProductDetailSheet producto={producto} userRole={userRole}>
                    <button className="font-semibold text-foreground text-sm sm:text-base hover:text-primary transition-colors text-left truncate max-w-50 sm:max-w-xs cursor-pointer">
                      {producto.nombre}
                    </button>
                  </ProductDetailSheet>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                    <span className="capitalize">
                      {capitalizar(producto.tipo)}
                    </span>
                    <span>·</span>
                    <span>
                      {variantesDisponibles.length}{" "}
                      {variantesDisponibles.length === 1
                        ? "variante"
                        : "variantes"}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center font-bold hidden sm:table-cell py-3">
                  <span
                    className={sinStock ? "text-rose-500" : "text-foreground"}
                  >
                    {totalUnidades}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest">
                      unid.
                    </span>
                  </span>
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right font-medium text-muted-foreground hidden md:table-cell py-3">
                    {formatearMoneda(producto.precio_costo ?? 0)}
                  </TableCell>
                )}

                <TableCell className="text-right font-semibold text-sm sm:text-base py-3">
                  {formatearMoneda(producto.precio)}
                </TableCell>

                <TableCell className="text-right pr-4 sm:pr-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <div
                      className={`flex items-center justify-end gap-1 overflow-hidden transition-all duration-200 ease-out ${
                        variantesEstanAbiertas
                          ? "max-w-48 opacity-100 translate-x-0"
                          : "max-w-0 opacity-0 translate-x-3 pointer-events-none"
                      }`}
                    >
                      {variantesDisponibles.length === 0 ? (
                        <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                          Sin stock
                        </span>
                      ) : (
                        variantesDisponibles.map((variante, index) => (
                          <button
                            key={variante.id}
                            type="button"
                            onClick={() =>
                              handleAgregarAlCarrito(
                                producto,
                                variante.variante,
                                variante.cantidad,
                              )
                            }
                            className="h-8 px-2.5 min-w-9 rounded-md border border-border bg-background text-[11px] font-bold uppercase tracking-wide text-foreground hover:bg-primary hover:text-background hover:border-primary transition-all cursor-pointer"
                            style={{
                              transitionDelay: variantesEstanAbiertas
                                ? `${index * 25}ms`
                                : "0ms",
                            }}
                          >
                            {variante.variante}
                          </button>
                        ))
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVariantes(producto.id)}
                      className={`h-8 w-8 text-primary shrink-0 shadow-none rounded-md ${
                        variantesEstanAbiertas
                          ? "bg-primary/20"
                          : "bg-primary/10 hover:bg-primary/20"
                      }`}
                      title="Elegir variante"
                    >
                      <Plus className="w-4 h-4 " />
                    </Button>

                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground cursor-pointer shrink-0 rounded-md"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 p-1 rounded-xl border-border/60"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between px-2 py-2 text-sm hover:bg-muted rounded-md transition-colors">
                              <span className="font-medium text-muted-foreground">
                                Catalogo web:
                              </span>
                              <TogglePublicado
                                id={producto.id}
                                publicadoInicial={producto.publicado ?? true}
                              />
                            </div>
                            <DropdownMenuSeparator className="bg-border/60" />
                            <EditarProductoModal producto={producto}>
                              <Button
                                variant="ghost"
                                className="w-full justify-start h-9 px-2 text-sm font-medium cursor-pointer rounded-md"
                              >
                                <Edit2 className="w-4 h-4 mr-2 text-emerald-600" />
                                Editar producto
                              </Button>
                            </EditarProductoModal>
                            <BajaModal producto={producto}>
                              <Button
                                variant="ghost"
                                className="w-full justify-start h-9 px-2 text-sm font-medium cursor-pointer text-amber-700 hover:bg-amber-50 rounded-md"
                              >
                                <MinusCircle className="w-4 h-4 mr-2 text-amber-500" />
                                Registrar baja
                              </Button>
                            </BajaModal>
                            <DropdownMenuSeparator className="bg-border/60" />
                            <EliminarProductoModal
                              id={producto.id}
                              nombre={producto.nombre}
                              tipo={producto.tipo}
                            >
                              <Button
                                variant="ghost"
                                className="w-full justify-start h-9 px-2 text-sm font-medium cursor-pointer text-destructive hover:bg-destructive/10 rounded-md"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar producto
                              </Button>
                            </EliminarProductoModal>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
