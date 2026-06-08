"use client";

import { useActionState, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { FolderTree, Plus, Loader2 } from "lucide-react";
import { createCategoriaAction } from "../actions/manage-categories";
import { toast } from "sonner";

export function CreateCategoriaModal() {
  const [isOpen, setIsOpen] = useState(false);

  const [, formAction, isPending] = useActionState(
    async (previousState: any, formData: FormData) => {
      const result = await createCategoriaAction(previousState, formData);

      if (result.success) {
        toast.success("Categoría creada correctamente.");
        setIsOpen(false);
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    { error: null, success: false },
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-none">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-105 bg-card border-border rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            Crear Categoría
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Categoría</Label>
            <Input
              id="nombre"
              name="nombre"
              placeholder="Ej: Interior, Macetas, Sustratos..."
              required
              className="rounded-lg shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Breve descripción de los productos que incluye..."
              className="rounded-lg shadow-none resize-none h-24"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
              className="cursor-pointer"
              disabled={isPending}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
