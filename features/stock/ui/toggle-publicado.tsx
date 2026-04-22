"use client";

import { useTransition } from "react";
import { togglePublicadoAction } from "../actions/toggle-publicado";
import { toast } from "sonner";

export function TogglePublicado({
  id,
  publicadoInicial,
}: {
  id: string;
  publicadoInicial: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nuevoEstado = !publicadoInicial;

    startTransition(async () => {
      const res = await togglePublicadoAction(id, nuevoEstado);
      if (res.success) {
        toast.success(
          nuevoEstado
            ? "Producto visible en la tienda"
            : "Producto oculto de la tienda",
        );
      } else {
        toast.error(res.error || "No se pudo cambiar el estado");
      }
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={publicadoInicial}
      disabled={isPending}
      onClick={handleToggle}
      title={publicadoInicial ? "Ocultar de la tienda" : "Mostrar en la tienda"}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        publicadoInicial ? "bg-green-500" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          publicadoInicial ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
