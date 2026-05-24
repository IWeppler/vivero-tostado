"use client";

import { useState, useActionState, startTransition } from "react";
import { Producto } from "@/entities/productos/types";
import { createMermaAction } from "../actions/create-merma";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { MinusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MermaModalProps {
  producto: Producto;
}

export function MermaModal({ producto }: Readonly<MermaModalProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [variante, setVariante] = useState("");
  const [motivo, setMotivo] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createMermaAction(prevState, formData);
      if (result.success) {
        toast.success("Baja registrada exitosamente", {
          description: "La merma quedó en estado PENDIENTE de revisión.",
        });
        setIsOpen(false);
        setVariante("");
        setMotivo("");
      } else {
        toast.error(result.error || "Ocurrió un error");
      }
      return result;
    },
    { error: null, success: false },
  );

  const handleSubmit = (formData: FormData) => {
    formData.append("producto_id", producto.id);
    formData.append("variante", variante);
    formData.append("motivo", motivo);
    startTransition(() => {
      formAction(formData);
    });
  };

  // Solo permitimos dar de baja talles que tengan stock > 0
  const variantesDisponibles =
    producto.stock?.filter((s) => s.cantidad > 0) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 h-8 w-8 sm:h-9 sm:w-9 cursor-pointer shrink-0"
          title="Registrar Merma / Baja"
        >
          <MinusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="merma-description">
        <DialogHeader>
          <DialogTitle>Registrar Merma</DialogTitle>
          <DialogDescription id="merma-description">
            Reporta una baja de stock para{" "}
            <strong className="text-foreground">{producto.nombre}</strong>. Un
            administrador deberá aprobarla.
          </DialogDescription>
        </DialogHeader>

        {variantesDisponibles.length === 0 ? (
          <div className="p-4 mt-4 text-center text-sm font-medium text-muted-foreground bg-muted rounded-md border border-border">
            No hay stock disponible para dar de baja en esta planta.
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label>Variante / Talle</Label>
              <Select value={variante} onValueChange={setVariante} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la variante afectada" />
                </SelectTrigger>
                <SelectContent>
                  {variantesDisponibles.map((s) => (
                    <SelectItem key={s.id} value={s.variante}>
                      {s.variante} (Stock actual: {s.cantidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad a descontar</Label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                min="1"
                max={
                  variantesDisponibles.find((v) => v.variante === variante)
                    ?.cantidad || 1
                }
                placeholder="Ej: 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo principal</Label>
              <Select value={motivo} onValueChange={setMotivo} required>
                <SelectTrigger>
                  <SelectValue placeholder="¿Por qué se da de baja?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planta seca">
                    Planta seca / Muerta
                  </SelectItem>
                  <SelectItem value="Plaga/Hongos">
                    Enferma (Plaga/Hongos)
                  </SelectItem>
                  <SelectItem value="Rotura de maceta">
                    Rotura de maceta
                  </SelectItem>
                  <SelectItem value="Error de inventario">
                    Error de inventario (Sobra stock)
                  </SelectItem>
                  <SelectItem value="Otro">Otro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || !variante || !motivo}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reportar Baja
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
