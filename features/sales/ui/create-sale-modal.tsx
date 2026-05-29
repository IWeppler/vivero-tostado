"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
import { registrarVentaAction } from "../actions/create-sale";
import { getProductosAction } from "@/shared/actions/store-actions";
import { Producto } from "@/entities/productos/types";
import { CartItem } from "@/entities/cart/types";
import { toast } from "sonner";

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
import {
  Plus,
  Loader2,
  Trash2,
  ShoppingCart,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import Image from "next/image";

interface Props {
  productos?: Producto[];
}

type ProductoConImagenPreview = Producto & {
  imagen?: string | null;
  imageUrl?: string | null;
};

const getProductoImagenPreview = (producto: ProductoConImagenPreview) =>
  producto.imagen || producto.imageUrl || null;

const getStockLabel = (disponible: number) =>
  disponible > 0 ? `(Quedan ${disponible})` : "(Agotado)";

export function CreateSaleModal({ productos = [] }: Readonly<Props>) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [openCombobox, setOpenCombobox] = useState(false);

  const [items, setItems] = useState<CartItem[]>([]);

  const [selectedProductoId, setSelectedProductoId] = useState<
    string | undefined
  >();
  const [selectedVariante, setSelectedVariante] = useState<
    string | undefined
  >();
  const [cantidadToAdd, setCantidadToAdd] = useState<number>(1);

  // Estados para manejar el stock en tiempo real
  const [listaProductos, setListaProductos] = useState<Producto[]>(productos);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchStock = async () => {
      setIsLoadingStock(true);
      try {
        const res = await getProductosAction();
        if (res.data) setListaProductos(res.data);
      } finally {
        setIsLoadingStock(false);
      }
    };

    fetchStock();
  }, [isOpen]);

  const resetForm = () => {
    setSelectedProductoId(undefined);
    setSelectedVariante(undefined);
    setCantidadToAdd(1);
    setItems([]);
    setFormKey((k) => k + 1);
    setOpenCombobox(false);
  };

  const [, formAction, isPending] = useActionState(
    async (
      prevState: { error: string | null; success: boolean },
      formData: FormData,
    ) => {
      const result = await registrarVentaAction(prevState, formData);

      if (result.success) {
        setIsOpen(false);
        resetForm();
        toast.success("¡Venta registrada con éxito!");
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    },
    { error: null, success: false },
  );

  const productoSeleccionado = useMemo(
    () => listaProductos.find((c) => c.id === selectedProductoId),
    [listaProductos, selectedProductoId],
  );

  const stockDisponiblePorVariante = useMemo(() => {
    const cantidadesEnCarrito = items.reduce<Record<string, number>>(
      (acc, item) => {
        if (item.productoId !== selectedProductoId) return acc;

        return {
          ...acc,
          [item.variante]: (acc[item.variante] ?? 0) + item.cantidad,
        };
      },
      {},
    );

    return (productoSeleccionado?.stock ?? []).reduce<Record<string, number>>(
      (acc, stock) => ({
        ...acc,
        [stock.variante]:
          stock.cantidad - (cantidadesEnCarrito[stock.variante] ?? 0),
      }),
      {},
    );
  }, [items, productoSeleccionado?.stock, selectedProductoId]);

  const getStockDisponible = (varianteBuscado: string) =>
    stockDisponiblePorVariante[varianteBuscado] ?? 0;

  const productoTriggerContent = useMemo(() => {
    if (productoSeleccionado) {
      return (
        <span className="truncate">
          {productoSeleccionado.nombre} {productoSeleccionado.tipo}{" "}
          <span className="text-muted-foreground font-medium ml-1">
            ${productoSeleccionado.precio.toLocaleString("es-AR")}
          </span>
        </span>
      );
    }

    if (isLoadingStock) return "Cargando stock actual...";

    if (listaProductos.length === 0) return "No hay stock disponible";

    return "Busca un producto...";
  }, [isLoadingStock, listaProductos.length, productoSeleccionado]);

  const handleAgregarAlCarrito = () => {
    if (
      !selectedProductoId ||
      !selectedVariante ||
      cantidadToAdd < 1 ||
      !productoSeleccionado
    )
      return;

    const disponible = getStockDisponible(selectedVariante);

    if (cantidadToAdd > disponible) {
      toast.error(
        `Solo quedan ${disponible} unidades disponibles en talle ${selectedVariante}.`,
      );
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (i) =>
          i.productoId === selectedProductoId &&
          i.variante === selectedVariante,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.productoId === selectedProductoId &&
          item.variante === selectedVariante
            ? { ...item, cantidad: item.cantidad + cantidadToAdd }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          productoId: selectedProductoId,
          nombre: productoSeleccionado.nombre,
          tipo: productoSeleccionado.tipo,
          variante: selectedVariante,
          cantidad: cantidadToAdd,
          precioUnitario: productoSeleccionado.precio,
        },
      ];
    });

    setSelectedVariante(undefined);
    setCantidadToAdd(1);
  };

  const handleEliminarDelCarrito = (index: number) => {
    setItems((currentItems) => currentItems.filter((_, dtl) => dtl !== index));
  };

  const totalVenta = useMemo(
    () =>
      items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0),
    [items],
  );

  const hasItems = items.length > 0;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-10 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Registrar Venta
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-140">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* SECCIÓN 1: AGREGAR AL CARRITO */}
          <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-4">
            <div className="space-y-2">
              <Label>1. Seleccionar Producto</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between font-normal bg-background h-10"
                    disabled={listaProductos.length === 0 || isLoadingStock}
                  >
                    {productoTriggerContent}
                    {isLoadingStock ? (
                      <Loader2 className="animate-spin h-4 w-4 ml-2 opacity-50 shrink-0" />
                    ) : (
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-120 p-0 z-100" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre, tipo..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron productos.</CommandEmpty>
                      <CommandGroup>
                        {listaProductos.map((p) => {
                          const imagenPreview = getProductoImagenPreview(p);

                          return (
                            <CommandItem
                              key={p.id}
                              value={`${p.nombre} ${p.tipo}`} // Permite búsqueda fuzzy usando nombre y tipo
                              onSelect={() => {
                                setSelectedProductoId(p.id);
                                setSelectedVariante(undefined);
                                setOpenCombobox(false);
                              }}
                              className="flex items-center gap-3 cursor-pointer py-2"
                            >
                              <div className="h-10 w-10 rounded-md bg-card flex items-center justify-center overflow-hidden shrink-0 border border-border">
                                {imagenPreview ? (
                                  <Image
                                    src={imagenPreview}
                                    alt={p.nombre}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ShoppingCart className="h-4 w-4 text-muted" />
                                )}
                              </div>
                              <div className="flex flex-col flex-1">
                                <span className="font-medium text-sm">
                                  {p.nombre}{" "}
                                  <span className="text-muted-foreground font-normal">
                                    ({p.tipo})
                                  </span>
                                </span>
                                <span className="text-xs text-green-600 font-medium">
                                  ${p.precio.toLocaleString("es-AR")}
                                </span>
                              </div>
                              <Check
                                className={`ml-auto h-4 w-4 transition-opacity ${selectedProductoId === p.id ? "opacity-100" : "opacity-0"}`}
                              />
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>2. Talle</Label>
                <Select
                  key={`select-talle-${selectedProductoId}-${formKey}`}
                  value={selectedVariante}
                  onValueChange={setSelectedVariante}
                  disabled={!selectedProductoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent className="z-100">
                    {productoSeleccionado?.stock?.map((s) => {
                      const disponible = getStockDisponible(s.variante);
                      return (
                        <SelectItem
                          key={s.id}
                          value={s.variante}
                          disabled={disponible <= 0}
                        >
                          {s.variante} {getStockLabel(disponible)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad">3. Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  value={cantidadToAdd}
                  onChange={(e) =>
                    setCantidadToAdd(Number.parseInt(e.target.value) || 1)
                  }
                  disabled={!selectedVariante}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAgregarAlCarrito}
              className="w-full h-10 bg-background"
              disabled={!selectedProductoId || !selectedVariante}
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Añadir a la lista
            </Button>
          </div>

          {/* SECCIÓN 2: LISTA DE CARRITO Y TOTAL */}
          {hasItems && (
            <div className="space-y-3">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider font-bold">
                Detalle de la venta
              </Label>
              <ScrollArea className="max-h-45 pr-3">
                <div className="space-y-2">
                  {items.map((item, dtl) => (
                    <div
                      key={dtl}
                      className="flex justify-between items-center bg-background border border-border p-3 rounded-md"
                    >
                      <div>
                        <p className="font-semibold text-sm leading-none">
                          {item.nombre}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({item.tipo})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Talle:{" "}
                          <span className="font-medium text-foreground">
                            {item.variante}
                          </span>{" "}
                          | Cant:{" "}
                          <span className="font-medium text-foreground">
                            {item.cantidad}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-primary dark:text-foreground">
                          $
                          {(item.cantidad * item.precioUnitario).toLocaleString(
                            "es-AR",
                          )}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminarDelCarrito(dtl)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-bold text-lg text-foreground">
                  Total Venta
                </span>
                <span className="font-bold text-xl text-green-600 dark:text-green-500">
                  ${totalVenta.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          )}

          {/* FORMULARIO FINAL  */}
          <form action={formAction}>
            <input
              type="hidden"
              name="cart_items"
              value={JSON.stringify(items)}
            />
            <Button
              type="submit"
              className="w-full h-10 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              disabled={isPending || !hasItems}
            >
              {isPending ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "Confirmar Venta"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const RegistrarVentaModal = CreateSaleModal;
