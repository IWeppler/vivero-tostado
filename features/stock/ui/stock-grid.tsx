"use client";

import { useState } from "react";
import Image from "next/image";
import type { Producto } from "@/entities/productos/types";
import { Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatearMoneda } from "@/shared/utils/formatters";
import { useStockCartActions } from "../hooks/use-stock-cart-actions";
import {
  capitalizar,
  getVariantesVisibles,
  obtenerPrimeraImagen,
} from "../lib/stock-product-utils";
import { ProductEditDetailSheet } from "./edit-sheet";

interface StockGridProps {
  productos: Producto[];
  userRole: string;
}

export function StockGrid({ productos, userRole }: Readonly<StockGridProps>) {
  const { isAdmin, agregarAlCarrito } = useStockCartActions(userRole);
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
    const agregado = agregarAlCarrito(producto, variante, stockMax);

    if (agregado && variantesAbiertas[producto.id]) {
      setVariantesAbiertas((prev) => ({ ...prev, [producto.id]: false }));
    }
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 m-2">
      {productos.map((producto) => {
        const primeraImagen = obtenerPrimeraImagen(producto.imagen_url);
        const isOpen = variantesAbiertas[producto.id];
        const variantesParaVender = getVariantesVisibles(producto, isAdmin);
        const esVentaDirecta = variantesParaVender.length === 1;

        return (
          <div key={producto.id} className="flex flex-col group relative">
            <div className="relative aspect-4/5 bg-muted/30 rounded-xl overflow-hidden mb-3 border border-border/40 transition-all group-hover:border-border">
              <ProductEditDetailSheet producto={producto}>
                <div className="w-full h-full cursor-pointer">
                  {primeraImagen ? (
                    <Image
                      src={primeraImagen}
                      alt={producto.nombre}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground opacity-30" />
                    </div>
                  )}
                </div>
              </ProductEditDetailSheet>

              <div
                className={`absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-border/50 transition-transform duration-300 ease-in-out flex flex-col p-2 ${
                  isOpen ? "translate-y-0" : "translate-y-full"
                }`}
              >
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {variantesParaVender.map((variante) => (
                    <Button
                      key={variante.id}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAgregarAlCarrito(
                          producto,
                          variante.variante,
                          variante.cantidad,
                        )
                      }
                      className={`h-8 px-3 rounded-md text-xs font-bold shrink-0 shadow-none border-border/60 ${
                        variante.cantidad > 0
                          ? "hover:bg-foreground hover:text-background hover:border-foreground"
                          : "opacity-40 line-through decoration-muted-foreground/50 cursor-not-allowed"
                      }`}
                    >
                      {variante.variante}
                    </Button>
                  ))}
                  {variantesParaVender.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-1">
                      Sin stock
                    </p>
                  )}
                </div>
              </div>

              {!isOpen && (
                <Button
                  size="icon"
                  onClick={() => {
                    if (esVentaDirecta) {
                      handleAgregarAlCarrito(
                        producto,
                        variantesParaVender[0].variante,
                        variantesParaVender[0].cantidad,
                      );
                    } else {
                      toggleVariantes(producto.id);
                    }
                  }}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-background text-foreground hover:bg-card transition-all z-10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="px-1 flex flex-col">
              <div className="flex justify-between items-start gap-2">
                <h3
                  className="font-semibold text-sm leading-tight text-foreground truncate"
                  title={producto.nombre}
                >
                  {producto.nombre}
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                {capitalizar(producto.tipo)}
              </p>
              <p className="font-bold text-sm mt-1 text-foreground">
                {formatearMoneda(producto.precio)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
