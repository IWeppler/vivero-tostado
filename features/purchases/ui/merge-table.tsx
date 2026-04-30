"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aprobarOrdenAction } from "../actions/merge-purchase";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { ItemResuelto, OrdenCompra } from "@/entities/compras/types";
import { Producto } from "@/entities/productos/types";

interface MergeTableProps {
  orden: OrdenCompra;
  itemsOriginales: ItemResuelto[];
  productos: Producto[];
}

export function MergeTable({
  orden,
  itemsOriginales,
  productos,
}: Readonly<MergeTableProps>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado local para manejar los cambios fuertemente tipado
  const [items, setItems] = useState<ItemResuelto[]>(() =>
    itemsOriginales.map((item) => ({
      ...item,
      variante_match: item.variante_match || item.raw_variante || "Unico",
      precio_venta_actualizado: productoReal(item.producto_id)?.precio || 0,
    })),
  );

  function productoReal(id: string | null): Producto | undefined {
    if (!id) return undefined;
    return productos.find((p) => p.id === id);
  }

  // --- Handlers ---
  const handleAssignProduct = (itemIndex: number, newProductId: string) => {
    const newItems = [...items];
    const prod = productoReal(newProductId);

    newItems[itemIndex].producto_id = newProductId;
    newItems[itemIndex].precio_venta_actualizado = prod?.precio || 0;

    if (newItems[itemIndex].estado_match === "DESCONOCIDO") {
      newItems[itemIndex].estado_match = "NUEVO_ALIAS";
    }

    setItems(newItems);
  };

  const handleUpdatePrice = (itemIndex: number, newPrice: number) => {
    const newItems = [...items];
    newItems[itemIndex].precio_venta_actualizado = newPrice;
    setItems(newItems);
  };

  const handleAprobar = async () => {
    const sinResolver = items.some((i) => !i.producto_id);
    if (sinResolver) {
      toast.error(
        "Debes asignar una planta a todos los ítems desconocidos (Rojos).",
      );
      return;
    }

    setIsSubmitting(true);
    toast.info("Impactando stock y precios...");

    const res = await aprobarOrdenAction(orden.id, orden.proveedor, items);

    if (res.success) {
      toast.success("¡Orden conciliada! Stock actualizado.");
      router.push("/stock");
    } else {
      toast.error(res.error || "Ocurrió un error.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-border shadow-sm">
        <div>
          <Link
            href="/stock"
            className="text-xs text-muted-foreground hover:text-foreground font-semibold uppercase tracking-widest flex items-center mb-2"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Volver al Inventario
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Conciliación de Pedido
          </h1>
          <p className="text-muted-foreground mt-1">
            Proveedor: <strong>{orden.proveedor}</strong> | Total: $
            {Number(orden.total_presupuestado).toLocaleString("es-AR")}
          </p>
        </div>
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md w-full sm:w-auto cursor-pointer"
          onClick={handleAprobar}
          disabled={isSubmitting}
        >
          <Save className="w-5 h-5 mr-2" />
          {isSubmitting ? "Procesando..." : "Confirmar e Impactar Stock"}
        </Button>
      </div>

      {/* Leyenda Visual */}
      <div className="flex flex-wrap gap-4 px-2">
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Match Perfecto (Se suma el
          stock)
        </Badge>
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1"
        >
          <AlertTriangle className="w-4 h-4 mr-2" /> Aumento de Costo (Ajusta tu
          precio)
        </Badge>
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 border-rose-200 px-3 py-1"
        >
          <HelpCircle className="w-4 h-4 mr-2" /> Desconocido (Asigna una
          planta)
        </Badge>
      </div>

      {/* Tabla Interactiva */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Ítem del Proveedor</th>
              <th className="px-6 py-4">Planta en Sistema</th>
              <th className="px-6 py-4 text-center">Cant.</th>
              <th className="px-6 py-4 text-right">Costo Prov.</th>
              <th className="px-6 py-4 text-right min-w-[150px]">
                Precio Público
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, idx) => {
              const pReal = productoReal(item.producto_id);
              const isPerfecto =
                item.estado_match === "PERFECTO" ||
                item.estado_match === "NUEVO_ALIAS";
              const isInflacion = item.estado_match === "MODIFICADO";
              const isDesconocido = item.estado_match === "DESCONOCIDO";

              // 💡 1. Refactor: Resolvemos la advertencia de complejidad ternaria anidada
              let rowClassName = "hover:bg-muted/30";
              if (isInflacion) {
                rowClassName = "bg-amber-50/30";
              } else if (isDesconocido) {
                rowClassName = "bg-rose-50/30";
              }

              return (
                <tr
                  // 💡 2. Refactor: Evitamos usar array index en el key
                  key={item.id ?? `item-${idx}`}
                  className={`transition-colors ${rowClassName}`}
                >
                  <td className="px-6 py-4">
                    {isPerfecto && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    )}
                    {/* 💡 3. Refactor: El title se lo ponemos a un span para evitar errores en íconos de Lucide */}
                    {isInflacion && (
                      <span title="El costo subió">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      </span>
                    )}
                    {isDesconocido && (
                      <span title="No se encontró alias">
                        <HelpCircle className="w-6 h-6 text-rose-500 animate-pulse" />
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground uppercase tracking-wide">
                      {item.raw_nombre}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Variante: {item.raw_variante}
                    </p>
                  </td>

                  <td className="px-6 py-4 min-w-[250px]">
                    {isDesconocido ? (
                      <div className="relative group">
                        <select
                          className="w-full h-10 px-3 bg-white border border-rose-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none appearance-none cursor-pointer"
                          value={item.producto_id || ""}
                          onChange={(e) =>
                            handleAssignProduct(idx, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            -- Seleccionar Planta --
                          </option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} ({p.tipo})
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                          ▼
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-emerald-800">
                          {pReal?.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Asignado a variante: {item.variante_match}
                        </p>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center font-bold text-base">
                    +{item.cantidad}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-foreground">
                      ${Number(item.precio_costo).toLocaleString("es-AR")}
                    </p>
                    {isInflacion && pReal && (
                      <p className="text-xs text-amber-600 font-semibold line-through mt-0.5">
                        Era $
                        {Number(pReal.precio_costo).toLocaleString("es-AR")}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {item.producto_id ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            $
                          </span>
                          <Input
                            type="number"
                            className={`pl-7 h-9 font-bold text-right ${isInflacion ? "border-amber-400 bg-amber-50 focus-visible:ring-amber-500" : ""}`}
                            value={item.precio_venta_actualizado || 0}
                            onChange={(e) =>
                              handleUpdatePrice(idx, Number(e.target.value))
                            }
                          />
                        </div>
                        {isInflacion &&
                          pReal &&
                          item.precio_venta_actualizado === pReal.precio && (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                              ¡Ajustar precio!
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Esperando asignación...
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
