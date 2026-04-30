"use client";

import { useState, useActionState, startTransition } from "react";
import { crearProductoAction } from "../actions/create-product";
import { toast } from "sonner";
import { optimizarImagen } from "@/shared/utils/image-optimizer";

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
import { Plus, ImagePlus, Leaf, Loader2 } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  TIPO_OPTIONS,
  VARIANTE_OPTIONS,
  CUIDADOS_OPTIONS,
  getCategoriaPrincipal,
} from "@/entities/productos/constants";

export function CrearProductoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(
    getCategoriaPrincipal(),
  );

  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(Array.from(e.target.files));
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setArchivos([]);
      setCategoriaSeleccionada(getCategoriaPrincipal());
    }
  };

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { error: string | null; success: boolean },
      formData: FormData,
    ) => {
      const result = await crearProductoAction(prevState, formData);

      if (result.success) {
        setIsOpen(false);
        setArchivos([]);
        setCategoriaSeleccionada(getCategoriaPrincipal());
        toast.success("Producto añadido al inventario con éxito 🌿");
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    { error: null, success: false },
  );

  const handleSubmit = async (formData: FormData) => {
    if (archivos.length > 0) {
      setIsCompressing(true);

      // 1. Borramos los archivos pesados originales del FormData
      formData.delete("imagenes");

      // 2. Comprimimos todos los archivos en paralelo
      const archivosComprimidos = await Promise.all(
        archivos.map((file) => optimizarImagen(file)),
      );

      // 3. Agregamos los livianos al FormData
      archivosComprimidos.forEach((file) => {
        formData.append("imagenes", file);
      });

      setIsCompressing(false);
    }

    // Disparamos la acción del servidor de React
    startTransition(() => {
      formAction(formData);
    });
  };

  const variantesAMostrar =
    VARIANTE_OPTIONS[categoriaSeleccionada] || VARIANTE_OPTIONS["interior"];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-14 h-14 rounded-full shadow-2xl sm:w-auto sm:h-10 sm:px-4 sm:rounded-md sm:shadow-sm bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer transition-transform active:scale-95">
          <Plus className="h-6 w-6 sm:h-4 sm:w-4 sm:mr-2" strokeWidth={2.5} />
          <span className="hidden sm:inline text-xs tracking-wide uppercase font-semibold">
            Nuevo Producto
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            Añadir Nuevo Producto
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh] px-1">
          {/* Conectamos nuestro interceptor de compresión aquí */}
          <form action={handleSubmit} className="space-y-6 mt-4 pb-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej. Monstera Gigante"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  name="categoria"
                  value={categoriaSeleccionada}
                  onValueChange={setCategoriaSeleccionada}
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

              <div className="space-y-2">
                <Label htmlFor="cuidados">Nivel de Cuidados</Label>
                <Select name="cuidados" defaultValue="facil">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio_costo">Costo Base (ARS)</Label>
                <Input
                  id="precio_costo"
                  name="precio_costo"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio Público (ARS)</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Fotos del Producto (Opcional)</Label>
              <div className="flex flex-col items-center justify-center w-full">
                <Label
                  htmlFor="imagenes"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <ImagePlus className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-emerald-600">
                        Haz clic para subir
                      </span>{" "}
                      o arrastra tus fotos aquí
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Soporta PNG, JPG, HEIC o WEBP. Serán optimizadas
                      automáticamente.
                    </p>
                  </div>
                  <Input
                    id="imagenes"
                    name="imagenes"
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp, image/heic"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
              </div>

              {/* Previsualización de Thumbnails */}
              {archivos.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {archivos.map((file, index) => (
                    <div
                      key={file.name}
                      className="relative w-16 h-16 rounded-md overflow-hidden border border-border bg-muted group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium mb-3 text-emerald-800">
                Stock Inicial por Variante
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {variantesAMostrar.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex flex-col items-center space-y-1 bg-muted/30 p-2 rounded-md border border-border/50"
                  >
                    <Label
                      htmlFor={`stock_${opt.value}`}
                      className="text-[10px] text-muted-foreground font-bold uppercase text-center leading-tight h-8 flex items-center"
                    >
                      {opt.label}
                    </Label>
                    <Input
                      id={`stock_${opt.value}`}
                      name={`stock_${opt.value}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      className="text-center px-1 h-8 text-sm bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isPending || isCompressing}
            >
              {isCompressing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizando fotos...
                </>
              ) : isPending ? (
                "Guardando Producto..."
              ) : (
                "Guardar Producto"
              )}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
