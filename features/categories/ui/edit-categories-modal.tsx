"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { FolderTree, Loader2 } from "lucide-react";
import { editCategoriaAction } from "../actions/manage-categories";
import { toast } from "sonner";
import { Categoria } from "./categories-panel";

export function EditCategoriaModal({
  categoria,
  open,
  onOpenChange,
}: {
  categoria: Categoria;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, formAction, isPending] = useActionState(
    async (previousState: any, formData: FormData) => {
      formData.append("id", categoria.id);
      const result = await editCategoriaAction(previousState, formData);

      if (result.success) {
        toast.success("Categoría actualizada correctamente.");
        onOpenChange(false);
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    { error: null, success: false },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-105 bg-card border-border rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            Editar Categoría
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Categoría</Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={categoria.nombre}
              required
              className="rounded-lg shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={categoria.descripcion || ""}
              className="rounded-lg shadow-none resize-none h-24"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Actualizar Categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
