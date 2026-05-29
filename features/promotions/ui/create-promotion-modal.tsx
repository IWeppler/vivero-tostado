"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Loader2, Plus, Tag } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { TIPO_OPTIONS } from "@/entities/productos/constants";
import { createPromotionAction } from "../actions/create-promotion";
import { toast } from "sonner";

type PromotionActionState = {
  error: string | null;
  success: boolean;
};

const initialState: PromotionActionState = {
  error: null,
  success: false,
};

export function CreatePromotionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [tipoRegla, setTipoRegla] = useState("METODO_PAGO");
  const [tipoDescuento, setTipoDescuento] = useState("PORCENTAJE");
  const [metodoPago, setMetodoPago] = useState("");
  const [categoria, setCategoria] = useState("");

  const resetForm = () => {
    setTipoRegla("METODO_PAGO");
    setTipoDescuento("PORCENTAJE");
    setMetodoPago("");
    setCategoria("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const [, formAction, isPending] = useActionState(
    async (previousState: PromotionActionState, formData: FormData) => {
      formData.append("tipo_regla", tipoRegla);
      formData.append("tipo_descuento", tipoDescuento);

      if (tipoRegla === "METODO_PAGO") {
        formData.append("metodo_pago", metodoPago);
      }

      if (tipoRegla === "CATEGORIA") {
        formData.append("categoria_nombre", categoria);
      }

      const result = await createPromotionAction(previousState, formData);

      if (result.success) {
        toast.success("Promocion creada correctamente");
        setIsOpen(false);
        resetForm();
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    },
    initialState,
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Promocion
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md w-[95vw] rounded-xl p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Tag className="w-5 h-5 text-primary" />
            Crear Regla de Descuento
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <form action={formAction} className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la promo</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Especial 10% Efectivo"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-bold text-foreground">
                Cuando aplica este descuento?
              </h4>

              <div className="space-y-2">
                <Label>Tipo de condicion</Label>
                <Select value={tipoRegla} onValueChange={setTipoRegla} required>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Selecciona la condicion..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="METODO_PAGO">
                      Por Metodo de Pago
                    </SelectItem>
                    <SelectItem value="CATEGORIA">
                      Por Categoria de Producto
                    </SelectItem>
                    <SelectItem value="MONTO_MINIMO">
                      Por Monto Minimo de Compra
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipoRegla === "METODO_PAGO" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Con que metodo pagan?</Label>
                  <Select
                    value={metodoPago}
                    onValueChange={setMetodoPago}
                    required
                  >
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue placeholder="Ej: EFECTIVO" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                      <SelectItem value="TRANSFERENCIA">
                        Transferencia
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tipoRegla === "CATEGORIA" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>A que categoria aplica?</Label>
                  <Select
                    value={categoria}
                    onValueChange={setCategoria}
                    required
                  >
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue placeholder="Selecciona categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_OPTIONS.filter((o) => o.value !== "todos").map(
                        (opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tipoRegla === "MONTO_MINIMO" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="monto_minimo">
                    Monto minimo del carrito
                  </Label>
                  <Input
                    id="monto_minimo"
                    name="monto_minimo"
                    type="number"
                    min="0"
                    placeholder="Ej: 50000"
                    required
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-bold text-foreground">
                Que beneficio le damos?
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de rebaja</Label>
                  <Select
                    value={tipoDescuento}
                    onValueChange={setTipoDescuento}
                  >
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PORCENTAJE">Porcentaje (%)</SelectItem>
                      <SelectItem value="MONTO_FIJO">Monto fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Valor ({tipoDescuento === "PORCENTAJE" ? "%" : "$"})
                  </Label>
                  <Input
                    name="valor_descuento"
                    type="number"
                    min="1"
                    step="any"
                    placeholder={
                      tipoDescuento === "PORCENTAJE" ? "Ej: 15" : "Ej: 2000"
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white hover:bg-primary/90 cursor-pointer"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Guardar Regla
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
