"use client";

import { useState } from "react";
import Image from "next/image";
import { Producto } from "@/entities/productos/types";
import { TODAS_LAS_VARIANTES } from "@/entities/productos/constants";
import { Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useCartStore } from "@/shared/store/cart-store";
import { toast } from "sonner";
import { ProductDetailSheet } from "./product-detail-sheet";
import { formatearMoneda } from "@/shared/utils/formatters";

interface StockGridProps {
  productos: Producto[];
  userRole: string; // Para saber si es admin y puede vender sin stock
}

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

export function StockGrid({ productos, userRole }: Readonly<StockGridProps>) {
  const addItem = useCartStore((state) => state.addItem);
  const setIsOpen = useCartStore((state) => state.setIsOpen);
  const isAdmin = userRole === "ADMIN";

  // Estado para saber qué tarjeta tiene las variantes abiertas
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

    // Auto-cierra el panel
    if (variantesAbiertas[producto.id]) {
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
    // grid-cols-2 para que se vean 2 columnas en celulares
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 m-2">
      {productos.map((producto) => {
        const primeraImagen = obtenerPrimeraImagen(producto.imagen_url);
        const isOpen = variantesAbiertas[producto.id];

        // Lógica de variantes (Igual que en la tabla)
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

        const variantesParaVender = isAdmin
          ? stockOrdenado
          : stockOrdenado.filter((s) => s.cantidad > 0);
        const esVentaDirecta = variantesParaVender.length === 1;

        return (
          <div key={producto.id} className="flex flex-col group relative">
            {/* CONTENEDOR DE IMAGEN (Click abre detalles) */}
            <div className="relative aspect-4/5 bg-muted/30 rounded-xl overflow-hidden mb-3 border border-border/40 transition-all group-hover:border-border">
              <ProductDetailSheet producto={producto} userRole={userRole}>
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
              </ProductDetailSheet>

              {/* OVERLAY DE VARIANTES */}
              <div
                className={`absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-border/50 transition-transform duration-300 ease-in-out flex flex-col p-2 ${
                  isOpen ? "translate-y-0" : "translate-y-full"
                }`}
              >
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {variantesParaVender.map((v) => (
                    <Button
                      key={v.id}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAgregarAlCarrito(producto, v.variante, v.cantidad)
                      }
                      className={`h-8 px-3 rounded-md text-xs font-bold shrink-0 shadow-none border-border/60 ${
                        v.cantidad > 0
                          ? "hover:bg-foreground hover:text-background hover:border-foreground"
                          : "opacity-40 line-through decoration-muted-foreground/50 cursor-not-allowed"
                      }`}
                    >
                      {v.variante}
                    </Button>
                  ))}
                  {variantesParaVender.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-1">
                      Sin stock
                    </p>
                  )}
                </div>
              </div>

              {/* BOTÓN + FLOTANTE */}
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

            {/* INFO DEL PRODUCTO */}
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
