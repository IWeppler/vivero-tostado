import { ShoppingBag, X } from "lucide-react";

interface CartSidebarHeaderProps {
  isPOSMode: boolean;
  onClose: () => void;
}

export function CartSidebarHeader({
  isPOSMode,
  onClose,
}: Readonly<CartSidebarHeaderProps>) {
  return (
    <div className="shrink-0 flex items-center justify-between p-4 border-b border-border bg-muted/20">
      <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
        <ShoppingBag className="w-4 h-4" />
        {isPOSMode ? "Venta en Curso" : "Tu Carrito"}
      </h2>
      <button
        onClick={onClose}
        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

