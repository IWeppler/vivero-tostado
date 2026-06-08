"use client";

import { useState, useTransition } from "react";
import {
  FolderTree,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Loader2,
  FileSliders,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { toast } from "sonner";
import {
  toggleCategoriaAction,
  deleteCategoriaAction,
} from "../actions/manage-categories";
import { CreateCategoriaModal } from "./create-categories-modal";
import { EditCategoriaModal } from "./edit-categories-modal";

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  activa: boolean;
  orden: number;
}

export function CategoriesPanel({
  categorias,
}: Readonly<{ categorias: Categoria[] }>) {
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [deletingCat, setDeletingCat] = useState<Categoria | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, startTransition] = useTransition();

  const handleToggle = (cat: Categoria) => {
    startTransition(async () => {
      const res = await toggleCategoriaAction(cat.id, cat.activa);
      if (res.success) {
        toast.info(`Categoría ${cat.activa ? "desactivada" : "activada"}`);
      } else {
        toast.error(res.error || "Ocurrió un error.");
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    setIsDeleting(true);
    const res = await deleteCategoriaAction(deletingCat.id);
    setIsDeleting(false);

    if (res.success) {
      toast.success("Categoría eliminada.");
      setDeletingCat(null);
    } else {
      toast.error(res.error || "No se pudo eliminar.");
      setDeletingCat(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileSliders className="w-5 h-5 text-primary" /> Catálogo Online
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Administra las categorías para organizar tu catálogo de productos.
          </p>
        </div>
        <CreateCategoriaModal />
      </div>

      {categorias.length === 0 ? (
        <div className="bg-card text-card-foreground p-12 rounded-2xl border border-border flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FolderTree className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold">No hay categorías configuradas</h3>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm">
            Agrega tu primera categoría (ej: Interior, Macetas) para comenzar a
            clasificar tus productos dinámicamente.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-border/50">
                <tr>
                  <th className="px-5 py-4 w-1/3">Nombre</th>
                  <th className="px-5 py-4">Descripción</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {categorias.map((cat) => (
                  <tr
                    key={cat.id}
                    className={`transition-colors group ${
                      !cat.activa
                        ? "bg-muted/10 opacity-70"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg border bg-background text-foreground">
                          <FolderTree className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {cat.nombre}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                            /{cat.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-muted-foreground">
                      <span className="line-clamp-2 max-w-xs">
                        {cat.descripcion || (
                          <span className="italic opacity-50">
                            Sin descripción
                          </span>
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {cat.activa ? (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Activa
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground font-semibold text-xs">
                          <XCircle className="w-4 h-4" /> Inactiva
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-md hover:bg-muted"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 p-1.5 rounded-xl border-border/60 bg-card"
                        >
                          <DropdownMenuItem
                            onClick={() => handleToggle(cat)}
                            className="cursor-pointer text-sm font-medium rounded-lg h-9"
                          >
                            <Power className="w-4 h-4 mr-2" />
                            {cat.activa ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingCat(cat)}
                            className="cursor-pointer text-sm font-medium rounded-lg h-9"
                          >
                            <Edit2 className="w-4 h-4 mr-2 text-blue-600" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-border/60" />
                          <DropdownMenuItem
                            onClick={() => setDeletingCat(cat)}
                            className="cursor-pointer text-sm font-medium text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg h-9"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALES INDEPENDIENTES */}
      {editingCat && (
        <EditCategoriaModal
          categoria={editingCat}
          open={!!editingCat}
          onOpenChange={(open) => !open && setEditingCat(null)}
        />
      )}

      {/* MODAL DE ELIMINAR */}
      <AlertDialog
        open={!!deletingCat}
        onOpenChange={(open) => !open && setDeletingCat(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar categoría &quot;{deletingCat?.nombre}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Sólo podrás eliminarla si no
              tiene productos asociados en tu catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
