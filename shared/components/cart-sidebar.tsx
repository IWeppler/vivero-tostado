"use client";

import { useCartStore } from "@/shared/store/cart-store";
import { createClient } from "@/shared/config/supabase/client";
import { useShallow } from "zustand/react/shallow";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { registrarVentaAction } from "@/features/sales/actions/create-sale";

export function CartSidebar({
  numeroWhatsApp,
}: Readonly<{ numeroWhatsApp?: string }>) {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    getTotalPrice,
    clearCart,
  } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      isOpen: state.isOpen,
      setIsOpen: state.setIsOpen,
      removeItem: state.removeItem,
      updateQuantity: state.updateQuantity,
      getTotalPrice: state.getTotalPrice,
      clearCart: state.clearCart,
    })),
  );

  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setIsAdmin(!!session);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          setIsAdmin(!!session);
        }
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!mounted) return null;

  const isPOSMode = isAdmin;

  const handleContinueShopping = () => {
    setIsOpen(false);
    router.push(isPOSMode ? "/stock" : "/store");
  };

  // --- LÓGICA PARA LA TIENDA PÚBLICA (WHATSAPP) ---
  const generarLinkWhatsApp = () => {
    if (!numeroWhatsApp) return "#";
    let mensaje =
      "¡Hola Ninja Camisetas! 🥷\nQuiero realizar el siguiente pedido:\n\n";

    items.forEach((item) => {
      mensaje += `${item.cantidad}x ${item.nombre} (${item.tipo})\n`;
      mensaje += ` └ Talle: ${item.variante} - $${(item.precio * item.cantidad).toLocaleString("es-AR")}\n`;
    });

    mensaje += `\n*TOTAL: $${getTotalPrice().toLocaleString("es-AR")}*\n\n¿Tienen stock disponible para confirmar?`;

    return `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  };

  const handleEnviarPedidoWhatsApp = () => {
    setTimeout(() => {
      clearCart();
      setIsOpen(false);
    }, 1000);
  };

  // --- LÓGICA PARA EL POS PRIVADO ---
  const handleConfirmarVentaPOS = () => {
    startTransition(async () => {
      try {
        if (!items.length) {
          toast.error("El carrito está vacío.");
          return;
        }

        const formData = new FormData();
        formData.append("cart_items", JSON.stringify(items));

        const result = await registrarVentaAction(
          { error: null, success: false },
          formData,
        );
        console.log(result);

        if (!result.success) {
          toast.error("No se pudo registrar la venta.", {
            description: result.error ?? "Intentá nuevamente.",
          });
          return;
        }

        toast.success("¡Venta registrada con éxito!", {
          description: `Se han descontado ${items.length} producto${
            items.length === 1 ? "" : "s"
          } del inventario.`,
        });

        clearCart();
        setIsOpen(false);
      } catch (error) {
        console.error("Error al registrar la venta POS:", error);

        toast.error("Ocurrió un error inesperado al registrar la venta.", {
          description: "Revisá la conexión o intentá nuevamente.",
        });
      }
    });
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
        className={`fixed top-0 right-0 h-full w-full sm:w-100 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header del Carrito */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            {isPOSMode ? "Venta en Curso" : "Tu Carrito"}
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
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/70 space-y-4">
              <ShoppingBag className="w-16 h-16" strokeWidth={1} />
              <p className="text-sm uppercase tracking-widest font-medium text-center">
                {isPOSMode
                  ? "No hay productos en la venta actual"
                  : "El carrito está vacío"}
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-none uppercase tracking-widest text-xs font-semibold cursor-pointer"
                onClick={handleContinueShopping}
              >
                {isPOSMode ? "Volver al inventario" : "Seguir comprando"}
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
                      {item.tipo} • Talle {item.variante}
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
                        disabled={item.cantidad <= 1 || isPending}
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
                        disabled={
                          item.cantidad >= item.stockMaximo || isPending
                        }
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

            {/* RENDERIZADO CONDICIONAL: POS vs PUBLIC STORE */}
            {isPOSMode ? (
              <Button
                onClick={handleConfirmarVentaPOS}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-6 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-widest transition-colors cursor-pointer rounded-none"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar Venta
                  </>
                )}
              </Button>
            ) : (
              <a
                href={generarLinkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleEnviarPedidoWhatsApp}
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
            )}

            <button
              onClick={clearCart}
              disabled={isPending}
              className="w-full mt-4 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors font-semibold disabled:opacity-50 cursor-pointer"
            >
              Vaciar {isPOSMode ? "venta" : "carrito"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
