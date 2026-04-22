"use client";

import { useState, useActionState } from "react";
import { editarProductoAction } from "../actions/edit-producto";
import { Producto } from "@/entities/productos/types";
import { toast } from "sonner";

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
import { Pencil, ImagePlus } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  TIPO_OPTIONS,
  VARIANTE_OPTIONS,
  CUIDADOS_OPTIONS,
} from "@/entities/productos/constants";

interface EditarProductoModalProps {
  producto: Producto;
}

export function EditarProductoModal({
  producto,
}: Readonly<EditarProductoModalProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(Array.from(e.target.files));
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setArchivos([]);
    }
  };

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { error: string | null; success: boolean },
      formData: FormData,
    ) => {
      const result = await editarProductoAction(prevState, formData);

      if (result.success) {
        setIsOpen(false);
        setArchivos([]);
        toast.success("Producto actualizado correctamente");
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    { error: null, success: false },
  );

  // Procesamos las imágenes existentes en la base de datos
  let imagenesExistentes: string[] = [];
  if (Array.isArray(producto.imagen_url)) {
    imagenesExistentes = producto.imagen_url;
  } else if (typeof producto.imagen_url === "string") {
    try {
      const parsed = JSON.parse(producto.imagen_url);
      imagenesExistentes = Array.isArray(parsed)
        ? parsed
        : [producto.imagen_url];
    } catch {
      imagenesExistentes = [producto.imagen_url];
    }
  }

  // Función para obtener el stock actual de un talle específico
  const getStockParaVariante = (talleBuscado: string) => {
    const stockVariante = producto.stock?.find(
      (s) => s.variante.toLowerCase() === talleBuscado.toLowerCase(),
    );
    return stockVariante ? stockVariante.cantidad : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors cursor-pointer"
          title="Editar producto"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para editar los detalles, precios, imágenes y stock del
            producto.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <form action={formAction} className="space-y-6 mt-4 px-1 pb-2">
            <input type="hidden" name="id" value={producto.id} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Equipo</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  defaultValue={producto.nombre}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuidados">Cuidados</Label>
                <Select
                  name="cuidados"
                  defaultValue={producto.cuidados.toLowerCase()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CUIDADOS_OPTIONS.filter(
                      (opt) => opt.value !== "todos",
                    ).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                name="tipo"
                defaultValue={producto.tipo?.toLowerCase() || "local"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.filter((opt) => opt.value !== "todos").map(
                    (opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio_costo">Precio de Costo</Label>
                <Input
                  id="precio_costo"
                  name="precio_costo"
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={producto.precio_costo || 0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio de Venta</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={producto.precio}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Reemplazar Imágenes (Opcional)</Label>
              <div className="flex flex-col items-center justify-center w-full">
                <Label
                  htmlFor={`imagenes-edit-${producto.id}`}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <ImagePlus className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">
                        Haz clic para subir
                      </span>{" "}
                      o arrastra tus fotos aquí
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Si subes nuevas fotos, reemplazarán a las actuales.
                    </p>
                  </div>
                  <Input
                    id={`imagenes-edit-${producto.id}`}
                    name="imagenes"
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>

              {archivos.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  <p className="w-full text-xs font-semibold text-blue-600 mb-1">
                    Nuevas imágenes listas para subir:
                  </p>
                  {archivos.map((file) => (
                    <div
                      key={file.name}
                      className="relative w-16 h-16 rounded-md overflow-hidden border-2 border-blue-500 bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${file.name}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}

              {archivos.length === 0 && imagenesExistentes.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3 opacity-80">
                  <p className="w-full text-xs font-medium text-muted-foreground mb-1">
                    Imágenes actuales en la tienda:
                  </p>
                  {imagenesExistentes.map((img, index) => (
                    <div
                      key={img}
                      className="relative w-16 h-16 rounded-md overflow-hidden border border-border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`Actual ${index}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium mb-3">
                Actualizar Stock por Talle
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {VARIANTE_OPTIONS.filter((opt) => opt.value !== "todos").map(
                  (opt) => (
                    <div
                      key={opt.value}
                      className="flex flex-col items-center space-y-1"
                    >
                      <Label
                        htmlFor={`stock_edit_${producto.id}_${opt.value}`}
                        className="text-xs text-muted-foreground uppercase"
                      >
                        {opt.label}
                      </Label>
                      <Input
                        id={`stock_edit_${producto.id}_${opt.value}`}
                        name={`stock_${opt.value.toLowerCase()}`}
                        type="number"
                        min="0"
                        defaultValue={getStockParaVariante(opt.value)}
                        className="text-center px-1"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Actualizando..." : "Guardar Cambios"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
