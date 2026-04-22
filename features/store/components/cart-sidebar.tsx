"use client";

import { useCartStore } from "@/features/store/store/cart-store";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import Image from "next/image";

export function CartSidebar({
  numeroWhatsApp,
}: Readonly<{ numeroWhatsApp: string }>) {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    getTotalPrice,
    clearCart,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const generarLinkWhatsApp = () => {
    let mensaje =
      "¡Hola Vivero Tostado! 🥷\nQuiero realizar el siguiente pedido:\n\n";

    items.forEach((item) => {
      mensaje += `${item.cantidad}x ${item.nombre} (${item.cuidados})\n`;
      mensaje += ` └ Talle: ${item.variante} - $${(item.precio * item.cantidad).toLocaleString("es-AR")}\n`;
    });

    mensaje += `\n*TOTAL: $${getTotalPrice().toLocaleString("es-AR")}*\n\n¿Tienen stock disponible para confirmar?`;

    return `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  };

  const handleEnviarPedido = () => {
    setTimeout(() => {
      clearCart();
      setIsOpen(false);
    }, 1000);
  };

  return (
    <>
      {/* Fondo oscuro overlay */}
      {isOpen && (
        <button
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel Lateral (Flat Design) */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header del Carrito */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Tu Carrito
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Productos */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 space-y-4">
              <ShoppingBag className="w-16 h-16" strokeWidth={1} />
              <p className="text-sm uppercase tracking-widest font-medium">
                El carrito está vacío
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-none uppercase tracking-widest text-xs font-semibold cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                Seguir comprando
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productoId}-${item.variante}`}
                className="flex gap-4 relative group"
              >
                <button
                  onClick={() => removeItem(item.productoId, item.variante)}
                  className="absolute -left-2 -top-2 w-6 h-6 bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors z-10 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Eliminar producto"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="w-20 h-24 bg-[#f7f7f7] border border-border/50 shrink-0 flex items-center justify-center overflow-hidden">
                  {item.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                  )}
                </div>

                <div className="flex flex-col flex-1 justify-between py-1">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide leading-tight line-clamp-2">
                      {item.nombre}
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                      {item.cuidados} • Talle {item.variante}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Control de cantidad minimalista */}
                    <div className="flex items-center border border-border h-8">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productoId,
                            item.variante,
                            item.cantidad - 1,
                          )
                        }
                        className="w-8 h-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                        disabled={item.cantidad <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productoId,
                            item.variante,
                            item.cantidad + 1,
                          )
                        }
                        className="w-8 h-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                        disabled={item.cantidad >= item.stockMaximo}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-sm">
                      ${(item.precio * item.cantidad).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer del Carrito */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <span className="text-xl font-black">
                ${getTotalPrice().toLocaleString("es-AR")}
              </span>
            </div>

            <a
              href={generarLinkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleEnviarPedido}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-sm uppercase tracking-widest transition-colors cursor-pointer"
            >
              <Image
                src="/whatsappp.png"
                alt="Whatsapp"
                width={20}
                height={20}
              />
              Enviar Pedido
            </a>

            <button
              onClick={clearCart}
              className="w-full mt-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors font-semibold"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
