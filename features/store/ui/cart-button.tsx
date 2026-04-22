"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/store/store/cart-store";
import { useEffect, useState } from "react";

export function CartButton() {
  const [mounted, setMounted] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const toggleCart = useCartStore((state) => state.toggleCart);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 text-foreground hover:bg-muted transition-colors cursor-pointer group"
      aria-label="Abrir carrito"
    >
      <ShoppingCart className="w-6 h-6" strokeWidth={1.5} />

      {mounted && getTotalItems() > 0 && (
        <span className="absolute top-0 right-0 translate-x-1 -translate-y-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
          {getTotalItems()}
        </span>
      )}
    </button>
  );
}
