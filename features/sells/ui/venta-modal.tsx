"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
import { registrarVentaAction } from "../actions/create-venta";
import { getProductosAction } from "@/features/store/actions/store-actions";
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
import { Plus, Loader2, Trash2, ShoppingCart } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";

interface Props {
  productos?: Producto[];
}

export function RegistrarVentaModal({ productos = [] }: Readonly<Props>) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

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

  const [state, formAction, isPending] = useActionState(
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

  const resetForm = () => {
    setSelectedProductoId(undefined);
    setSelectedVariante(undefined);
    setCantidadToAdd(1);
    setItems([]);
    setFormKey((k) => k + 1);
  };

  const productoSeleccionado = useMemo(
    () => listaProductos.find((c) => c.id === selectedProductoId),
    [listaProductos, selectedProductoId],
  );

  // Función para saber cuánto stock queda restando lo que ya agregamos al carrito virtual
  const getStockDisponible = (varianteBuscado: string) => {
    const stockOriginal =
      productoSeleccionado?.stock?.find((s) => s.variante === varianteBuscado)
        ?.cantidad || 0;
    const enCarrito = items
      .filter(
        (i) =>
          i.productoId === selectedProductoId && i.variante === varianteBuscado,
      )
      .reduce((acc, curr) => acc + curr.cantidad, 0);
    return stockOriginal - enCarrito;
  };

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

    // Buscamos si ya existe el mismo modelo+talle en el carrito para sumarle la cantidad
    const existingIndex = items.findIndex(
      (i) =>
        i.productoId === selectedProductoId && i.variante === selectedVariante,
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].cantidad += cantidadToAdd;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productoId: selectedProductoId,
          nombre: productoSeleccionado.nombre,
          tipo: productoSeleccionado.tipo,
          cuidados: productoSeleccionado.cuidados,
          variante: selectedVariante,
          cantidad: cantidadToAdd,
          precioUnitario: productoSeleccionado.precio,
        },
      ]);
    }

    setSelectedVariante(undefined);
    setCantidadToAdd(1);
  };

  const handleEliminarDelCarrito = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const totalVenta = items.reduce(
    (acc, item) => acc + item.cantidad * item.precioUnitario,
    0,
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white">
          <Plus className="mr-2 h-4 w-4" /> Registrar Venta
        </Button>
      </DialogTrigger>

      {/* Ampliamos el modal para que entre cómodamente el carrito */}
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* SECCIÓN 1: AGREGAR AL CARRITO */}
          <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-4">
            <div className="space-y-2">
              <Label>1. Seleccionar Producto</Label>
              <Select
                key={`select-prod-${formKey}`}
                value={selectedProductoId}
                onValueChange={(val) => {
                  setSelectedProductoId(val);
                  setSelectedVariante(undefined);
                }}
                disabled={listaProductos.length === 0 || isLoadingStock}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingStock
                        ? "Cargando stock actual..."
                        : listaProductos.length === 0
                          ? "No hay stock disponible"
                          : "Busca un producto..."
                    }
                  />
                  {isLoadingStock && (
                    <Loader2 className="animate-spin h-4 w-4 ml-2 opacity-50" />
                  )}
                </SelectTrigger>
                <SelectContent className="z-100">
                  {listaProductos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.cuidados} ($
                      {p.precio.toLocaleString("es-AR")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                          {s.variante}{" "}
                          {disponible > 0
                            ? `(Quedan ${disponible})`
                            : "(Agotado)"}
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
              className="w-full"
              variant="secondary"
              disabled={!selectedProductoId || !selectedVariante}
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Añadir a la lista
            </Button>
          </div>

          {/* SECCIÓN 2: LISTA DE CARRITO Y TOTAL */}
          {items.length > 0 && (
            <div className="space-y-3">
              <Label className="text-muted-foreground uppercase text-xs tracking-wider font-bold">
                Detalle de la venta
              </Label>
              <ScrollArea className="max-h-[180px] pr-3">
                <div className="space-y-2">
                  {items.map((item, dtl) => (
                    <div
                      key={dtl}
                      className="flex justify-between items-center bg-background border border-border p-3 rounded-md shadow-sm"
                    >
                      <div>
                        <p className="font-semibold text-sm leading-none">
                          {item.nombre}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({item.cuidados})
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
                        <p className="font-bold text-sm text-primary">
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
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={isPending || items.length === 0}
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
