"use client";

import { Producto } from "@/entities/productos/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";
import { Leaf, AlignLeft, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ProductDetailSheetProps {
  producto: Producto;
  children: React.ReactNode;
}

// --- HELPERS ---
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

export function ProductDetailSheet({
  producto,
  children,
}: Readonly<ProductDetailSheetProps>) {
  const primeraImagen = obtenerPrimeraImagen(producto.imagen_url);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto px-4 sm:px-6"
      >
        <SheetHeader className="pb-4 border-b border-border/50 text-left mt-2 sm:mt-0">
          <SheetTitle className="text-xl flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            Ficha de la Planta
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pt-6 pb-8">
          {/* Cabecera: Imagen, Nombre y Precio */}
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0 ">
              {primeraImagen ? (
                <Image
                  src={primeraImagen}
                  alt={producto.nombre}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
              )}
            </div>
            <div className="pt-1">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {producto.nombre}
              </h3>
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex items-center">
                  <Badge
                    variant="secondary"
                    className="capitalize text-xs sm:text-sm"
                  >
                    {capitalizar(producto.tipo)}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {formatearMoneda(producto.precio)}
                </div>
              </div>
            </div>
          </div>

          {/* Información Detallada */}
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground uppercase tracking-wider">
                <AlignLeft className="w-4 h-4" />
                Descripción
              </h4>
              <div className="text-sm text-foreground bg-muted/40 p-4 rounded-xl border border-border/50 leading-relaxed min-h-30">
                {producto.descripcion ? (
                  /* whitespace-pre-wrap respeta los saltos de línea que hagas en el formulario */
                  <p className="whitespace-pre-wrap">{producto.descripcion}</p>
                ) : (
                  <p className="italic opacity-60">
                    No hay descripción detallada para este producto.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
