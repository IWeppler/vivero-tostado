"use client";

import { useState } from "react";
import { Producto } from "@/entities/productos/types";
import {
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { TALLE_OPTIONS } from "@/entities/productos/constants";
import { useCartStore } from "@/features/store/store/cart-store";
import { toast } from "sonner";

interface ProductDetailProps {
  producto: Producto;
  baseUrl?: string;
}

export function ProductDetail({ producto }: Readonly<ProductDetailProps>) {
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<
    string | null
  >(null);
  const [errorVariante, setErrorVariante] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const addItem = useCartStore((state) => state.addItem);

  let imagenes: string[] = [];
  if (Array.isArray(producto.imagen_url)) {
    imagenes = producto.imagen_url;
  } else if (typeof producto.imagen_url === "string") {
    try {
      const parsed = JSON.parse(producto.imagen_url);
      imagenes = Array.isArray(parsed) ? parsed : [producto.imagen_url];
    } catch {
      imagenes = [producto.imagen_url];
    }
  }

  const stockTotal =
    producto.stock?.reduce((acc, s) => acc + s.cantidad, 0) || 0;
  const estaAgotado = stockTotal === 0;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? imagenes.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === imagenes.length - 1 ? 0 : prev + 1,
    );
  };

  const handleAddToCart = () => {
    if (estaAgotado) return;

    if (!varianteSeleccionada) {
      setErrorVariante(true);
      return;
    }
    setErrorVariante(false);

    const stockDeVariante = producto.stock?.find(
      (s) =>
        (s.variante || "").toLowerCase() === varianteSeleccionada.toLowerCase(),
    );
    const stockMaximo = stockDeVariante ? stockDeVariante.cantidad : 0;

    if (stockMaximo <= 0) {
      toast.error("Esta variante se encuentra agotada.");
      return;
    }

    addItem({
      productoId: producto.id,
      camisetaId: producto.id,
      nombre: producto.nombre || "Sin nombre",
      equipo: producto.nombre || "Sin equipo",
      temporada: producto.temporada,
      tipo: producto.tipo,
      variante: varianteSeleccionada,
      talle: varianteSeleccionada,
      precio: producto.precio,
      cantidad: 1,
      imagenUrl: imagenes[0] || null,
      stockMaximo: stockMaximo,
    } as any);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          href="/store"
          className="inline-flex items-center text-xs font-semibold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
        <div className="w-full md:w-3/5 lg:w-2/3 flex flex-col gap-4">
          <div className="relative aspect-4/4 bg-[#f7f7f7] w-full flex items-center justify-center group overflow-hidden border border-border/40">
            {imagenes.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagenes[currentImageIndex]}
                alt={`${producto.nombre} - Vista ${currentImageIndex + 1}`}
                className="object-cover w-full h-full transition-opacity duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground/30">
                <ShoppingBag className="w-20 h-20 mb-4" strokeWidth={1} />
                <span className="text-sm font-medium uppercase tracking-widest">
                  Sin imagen
                </span>
              </div>
            )}

            {imagenes.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-foreground flex items-center justify-center rounded-none opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm border border-border/50 cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-foreground flex items-center justify-center rounded-none opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm border border-border/50 cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>

          {imagenes.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {imagenes.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-20 h-24 sm:w-24 sm:h-28 shrink-0 bg-[#f7f7f7] transition-all border-2 cursor-pointer ${
                    currentImageIndex === index
                      ? "border-foreground opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Miniatura ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col sticky top-24">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                {producto.temporada}
              </span>
              {producto.tipo && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    {producto.tipo}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase tracking-tight leading-none mb-4">
              {producto.nombre || "Sin nombre"}
            </h1>

            <div className="text-xl font-medium text-foreground">
              ${(producto.precio || 0).toLocaleString("es-AR")}
            </div>
          </div>

          <div className="w-full h-px bg-border/60 mb-8"></div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                Selecciona una opción
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {TALLE_OPTIONS.filter((o) => o.value !== "todos").map((opt) => {
                const stockDeVariante = producto.stock?.find(
                  (s) =>
                    (s.variante || "").toLowerCase() ===
                    opt.value.toLowerCase(),
                );
                const tieneStock =
                  stockDeVariante && stockDeVariante.cantidad > 0;
                const isSelected = varianteSeleccionada === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!tieneStock}
                    onClick={() => {
                      setVarianteSeleccionada(opt.value);
                      setErrorVariante(false);
                    }}
                    className={`
                      py-3 rounded-none border text-sm font-semibold uppercase transition-all
                      ${
                        isSelected
                          ? "border-foreground bg-foreground text-background cursor-pointer"
                          : tieneStock
                            ? "border-border bg-transparent text-foreground hover:border-foreground/40 cursor-pointer"
                            : "border-border/40 bg-transparent text-muted-foreground opacity-40 cursor-not-allowed line-through"
                      }
                    `}
                  >
                    {opt.value}
                  </button>
                );
              })}
            </div>

            {errorVariante && (
              <p className="text-destructive text-xs font-semibold tracking-wide flex items-center mt-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Selecciona una opción para continuar
              </p>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={handleAddToCart}
              disabled={estaAgotado}
              className={`
                w-full flex items-center justify-center gap-3 py-4 px-6 rounded-none font-bold text-sm uppercase tracking-widest transition-colors cursor-pointer
                ${
                  estaAgotado
                    ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                    : "bg-foreground hover:bg-foreground/90 text-background"
                }
              `}
            >
              <ShoppingCart className="w-5 h-5" />
              {estaAgotado ? "Agotado" : "Añadir al carrito"}
            </button>

            {!estaAgotado && (
              <p className="text-center text-[11px] uppercase tracking-wide font-medium text-muted-foreground mt-4 leading-relaxed">
                El pago y envío se coordinan <br /> de forma segura por WhatsApp
                al finalizar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
