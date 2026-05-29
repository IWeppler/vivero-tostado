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
  Banknote,
  CreditCard,
  Smartphone,
  Tag,
} from "lucide-react";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import Image from "next/image";
import { toast } from "sonner";
import { registrarVentaAction } from "@/features/sales/actions/create-sale";
import { TicketSheet } from "@/features/sales/ui/ticket-sheet";
import { TicketData } from "@/entities/ventas/types";

// --- TIPOS DE PROMOCIÓN (Locales) ---
interface PromocionDB {
  id: string;
  nombre: string;
  tipo_regla: string;
  tipo_descuento: string;
  valor_descuento: number;
  monto_minimo: number;
  promociones_metodos_pago?: { metodo_pago: string }[];
  promociones_categorias?: { categoria_nombre: string }[];
}

const subscribeToClientMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

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

  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [isPending, startTransition] = useTransition();
  const [isAdmin, setIsAdmin] = useState(false);
  const [metodoPago, setMetodoPago] = useState<
    "EFECTIVO" | "TRANSFERENCIA" | "TARJETA"
  >("EFECTIVO");

  // --- ESTADOS DE PROMOCIONES ---
  const [promocionesDB, setPromocionesDB] = useState<PromocionDB[]>([]);
  const [promocionId, setPromocionId] = useState<string>("ninguna");

  const [ventaExitosa, setVentaExitosa] = useState<TicketData | null>(null);
  const router = useRouter();
  const isPOSMode = isAdmin;

  // 1. Verificación de Usuario y Fetch de Promociones Activas
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const checkUserAndFetchPromos = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setIsAdmin(!!session);

        // Si es Admin (POS Mode), traemos las promociones
        if (session) {
          const { data } = await supabase
            .from("promociones")
            .select(
              `
              *,
              promociones_metodos_pago ( metodo_pago ),
              promociones_categorias ( categoria_nombre )
            `,
            )
            .eq("activa", true);

          if (data) setPromocionesDB(data as unknown as PromocionDB[]);
        }
      }
    };

    checkUserAndFetchPromos();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) setIsAdmin(!!session);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Lógica de Elegibilidad (Se recalcula si cambian items o método de pago)
  const totalCarrito = getTotalPrice();

  const promocionesElegibles = useMemo(() => {
    return promocionesDB.filter((promo) => {
      // Regla: Monto Mínimo
      if (promo.monto_minimo && totalCarrito < promo.monto_minimo) return false;

      // Regla: Método de Pago
      if (promo.tipo_regla === "METODO_PAGO") {
        const metodos =
          promo.promociones_metodos_pago?.map((m) => m.metodo_pago) || [];
        if (!metodos.includes(metodoPago)) return false;
      }

      // Regla: Categoría
      if (promo.tipo_regla === "CATEGORIA") {
        const categorias =
          promo.promociones_categorias?.map((c) =>
            c.categoria_nombre.toLowerCase(),
          ) || [];
        const hasCategory = items.some((item) =>
          categorias.includes(item.tipo.toLowerCase()),
        );
        if (!hasCategory) return false;
      }

      return true;
    });
  }, [promocionesDB, totalCarrito, metodoPago, items]);

  // 3. Auto-deseleccionar si la promo actual deja de ser elegible
  const promocionActivaId = useMemo(() => {
    if (promocionId === "ninguna") return "ninguna";
    return promocionesElegibles.some((p) => p.id === promocionId)
      ? promocionId
      : "ninguna";
  }, [promocionesElegibles, promocionId]);

  // 4. Cálculo del Descuento Final
  const descuentoDetalle = useMemo(() => {
    if (promocionActivaId === "ninguna") return { monto: 0, nombre: "" };

    const promo = promocionesElegibles.find((p) => p.id === promocionActivaId);
    if (!promo) return { monto: 0, nombre: "" };

    let montoBase = totalCarrito;

    // Si es por categoría, calculamos el descuento SOLO sobre esas plantas
    if (promo.tipo_regla === "CATEGORIA") {
      const categorias =
        promo.promociones_categorias?.map((c) =>
          c.categoria_nombre.toLowerCase(),
        ) || [];

      montoBase = items.reduce((acc, item) => {
        if (categorias.includes(item.tipo.toLowerCase())) {
          return acc + item.precio * item.cantidad;
        }
        return acc;
      }, 0);
    }

    let descuento = 0;
    if (promo.tipo_descuento === "PORCENTAJE") {
      descuento = (montoBase * promo.valor_descuento) / 100;
    } else {
      descuento = promo.valor_descuento; // Monto Fijo
    }

    // Tope: No podemos descontar más del total del carrito
    if (descuento > totalCarrito) descuento = totalCarrito;

    return { monto: Math.round(descuento), nombre: promo.nombre };
  }, [promocionActivaId, promocionesElegibles, totalCarrito, items]);

  const totalFinal = totalCarrito - descuentoDetalle.monto;

  if (!mounted) return null;

  const handleContinueShopping = () => {
    setIsOpen(false);
    router.push(isPOSMode ? "/stock" : "/store");
  };

  const generarLinkWhatsApp = () => {
    if (!numeroWhatsApp) return "#";
    let mensaje =
      "¡Hola Vivero Tostado! 🥷\nQuiero realizar el siguiente pedido:\n\n";

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

  const handleConfirmarVentaPOS = () => {
    startTransition(async () => {
      try {
        if (!items.length) {
          toast.error("El carrito está vacío.");
          return;
        }

        const formData = new FormData();
        formData.append("cart_items", JSON.stringify(items));
        formData.append("metodo_pago", metodoPago);

        // Adjuntamos la promoción si existe
        if (promocionActivaId !== "ninguna" && descuentoDetalle.monto > 0) {
          formData.append("promocion_id", promocionActivaId);
          formData.append("descuento_monto", descuentoDetalle.monto.toString());
        }

        const result = await registrarVentaAction(
          { error: null, success: false },
          formData,
        );

        if (!result.success) {
          if (result.error === "CAJA_CERRADA") {
            toast.error("La caja está cerrada", {
              description:
                "Debes abrir un turno en el módulo de Caja para poder cobrar.",
              action: {
                label: "Ir a Caja",
                onClick: () => {
                  setIsOpen(false);
                  router.push("/caja");
                },
              },
            });
          } else {
            toast.error("No se pudo registrar la venta.", {
              description: result.error ?? "Intentá nuevamente.",
            });
          }
          return;
        }

        toast.success("¡Venta registrada con éxito!");

        setVentaExitosa({
          items: [...items],
          total: totalFinal,
          metodoPago,
          nroRecibo: Math.random().toString().slice(2, 8).toUpperCase(),
          descuentoMonto: descuentoDetalle.monto,
          promocionNombre: descuentoDetalle.nombre,
        });

        clearCart();
        setMetodoPago("EFECTIVO");
        setPromocionId("ninguna");
        setIsOpen(false);
      } catch (error) {
        console.error("Error al registrar la venta POS:", error);
        toast.error("Ocurrió un error inesperado al registrar la venta.");
      }
    });
  };

  return (
    <>
      {isOpen && (
        <button
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-100 bg-card z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            {isPOSMode ? "Venta en Curso" : "Tu Carrito"}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/70 space-y-4">
              <ShoppingBag className="w-16 h-16" strokeWidth={1} />
              <p className="text-sm uppercase tracking-widest font-medium text-center">
                {isPOSMode
                  ? "No hay productos en la venta"
                  : "El carrito está vacío"}
              </p>
              <Button
                variant="outline"
                className="mt-4 uppercase tracking-widest text-xs font-semibold cursor-pointer shadow-none"
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
                  className="absolute -left-2 -top-2 w-6 h-6 bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors z-10 opacity-0 group-hover:opacity-100 cursor-pointer rounded-full"
                  title="Eliminar producto"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="w-20 h-24 bg-muted/30 rounded-md border border-border/50 shrink-0 flex items-center justify-center overflow-hidden">
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
                    <div className="flex items-center border border-border rounded-md overflow-hidden h-8">
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
                        disabled={isPending}
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

        {items.length > 0 && (
          <div className="border-t border-border bg-card flex flex-col">
            {isPOSMode && (
              <div className="p-4 border-b border-border/50 bg-muted/10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Métodos de Pago
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMetodoPago("EFECTIVO")}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      metodoPago === "EFECTIVO"
                        ? "bg-background border-border text-foreground"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-muted cursor-pointer"
                    }`}
                  >
                    <Banknote
                      className={`w-5 h-5 ${metodoPago === "EFECTIVO" ? "text-emerald-500" : ""}`}
                    />
                    Efectivo
                  </button>
                  <button
                    onClick={() => setMetodoPago("TRANSFERENCIA")}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      metodoPago === "TRANSFERENCIA"
                        ? "bg-background border-border text-foreground"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-muted cursor-pointer"
                    }`}
                  >
                    <Smartphone
                      className={`w-5 h-5 ${metodoPago === "TRANSFERENCIA" ? "text-blue-500" : ""}`}
                    />
                    Transf.
                  </button>
                  <button
                    onClick={() => setMetodoPago("TARJETA")}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      metodoPago === "TARJETA"
                        ? "bg-background border-border text-foreground"
                        : "bg-transparent border-transparent text-muted-foreground hover:bg-muted cursor-pointer"
                    }`}
                  >
                    <CreditCard
                      className={`w-5 h-5 ${metodoPago === "TARJETA" ? "text-purple-500" : ""}`}
                    />
                    Tarjeta
                  </button>
                </div>

                {/* SELECTOR DE PROMOCIONES */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <Tag className="w-3.5 h-3.5" /> Descuentos
                  </div>

                  {promocionesElegibles.length > 0 ? (
                    <Select
                      value={promocionActivaId}
                      onValueChange={setPromocionId}
                    >
                      <SelectTrigger className="w-full text-sm bg-background border-border shadow-none h-10">
                        <SelectValue placeholder="Aplicar descuento..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="ninguna"
                          className="text-muted-foreground italic"
                        >
                          No aplicar descuento
                        </SelectItem>
                        {promocionesElegibles.map((promo) => (
                          <SelectItem
                            key={promo.id}
                            value={promo.id}
                            className="font-medium"
                          >
                            {promo.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md border border-border/50 flex items-center justify-center italic">
                      No hay descuentos aplicables a este carrito.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-5">
              {/* DESGLOSE TOTAL */}
              {descuentoDetalle.monto > 0 && (
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-muted-foreground text-sm">
                    <span>Subtotal</span>
                    <span>${totalCarrito.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-600 font-bold text-sm">
                    <span>Promo: {descuentoDetalle.nombre}</span>
                    <span>
                      -${descuentoDetalle.monto.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold uppercase text-muted-foreground">
                  Total a cobrar
                </span>
                <span className="text-2xl font-black text-foreground">
                  ${totalFinal.toLocaleString("es-AR")}
                </span>
              </div>

              {isPOSMode ? (
                <Button
                  onClick={handleConfirmarVentaPOS}
                  disabled={isPending}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-bold text-sm uppercase tracking-wide transition-colors cursor-pointer rounded-lg shadow-none"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Confirmar Venta
                    </>
                  )}
                </Button>
              ) : (
                <a
                  href={generarLinkWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleEnviarPedidoWhatsApp}
                  className="w-full flex items-center justify-center gap-3 h-12 rounded-lg bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-sm uppercase tracking-widest shadow-none"
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
          </div>
        )}
      </div>

      <TicketSheet
        ticket={ventaExitosa}
        onClose={() => setVentaExitosa(null)}
      />
    </>
  );
}
