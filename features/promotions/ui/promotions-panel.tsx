"use client";

import {
  Tag,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Wallet,
  LayoutGrid,
} from "lucide-react";
import { CreatePromotionModal } from "./create-promotion-modal";
import { Badge } from "@/shared/ui/badge";

export interface Promotion {
  id: string;
  nombre: string;
  tipo_regla: "METODO_PAGO" | "CATEGORIA" | "MONTO_MINIMO";
  tipo_descuento: "PORCENTAJE" | "MONTO_FIJO";
  valor_descuento: number;
  activa: boolean;
  monto_minimo?: number;
  promociones_metodos_pago?: { metodo_pago: string }[];
  promociones_categorias?: { categoria_nombre: string }[];
}

interface PromotionsPanelProps {
  promociones: Promotion[];
}

export function PromotionsPanel({
  promociones,
}: Readonly<PromotionsPanelProps>) {
  const renderDetalleCondicion = (promo: Promotion) => {
    if (promo.tipo_regla === "METODO_PAGO") {
      const metodo = promo.promociones_metodos_pago?.[0]?.metodo_pago;
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="w-4 h-4 text-primary" />
          <span>
            Pagando con <strong>{metodo}</strong>
          </span>
        </div>
      );
    }

    if (promo.tipo_regla === "CATEGORIA") {
      const categoria = promo.promociones_categorias?.[0]?.categoria_nombre;
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span>
            Categoría: <strong>{categoria}</strong>
          </span>
        </div>
      );
    }

    if (promo.tipo_regla === "MONTO_MINIMO") {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-4 h-4 text-primary" />
          <span>
            Comprando más de <strong>${promo.monto_minimo}</strong>
          </span>
        </div>
      );
    }

    return <span className="text-muted-foreground">Condición desconocida</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Reglas de Descuento
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automatiza promociones en el mostrador para agilizar tus ventas y
            atraer clientes.
          </p>
        </div>
        <CreatePromotionModal />
      </div>

      {promociones.length === 0 ? (
        <div className="bg-card text-card-foreground p-12 rounded-2xl border border-border flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold">No hay promociones configuradas</h3>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm">
            Crea tu primera regla para aplicar descuentos automáticos por pago
            en efectivo, montos mínimos o categorías específicas.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase font-bold tracking-widest border-b border-border/50">
                <tr>
                  <th className="px-5 py-4">Promoción</th>
                  <th className="px-5 py-4">Condición</th>
                  <th className="px-5 py-4">Beneficio</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {promociones.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* NOMBRE */}
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <div className="flex flex-col">
                        <span>{promo.nombre}</span>
                        <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                          ID: {promo.id.split("-")[0].toUpperCase()}
                        </span>
                      </div>
                    </td>

                    {/* CONDICIÓN DE ACTIVACIÓN */}
                    <td className="px-5 py-4 text-sm font-medium">
                      {renderDetalleCondicion(promo)}
                    </td>

                    {/* BENEFICIO (El Descuento) */}
                    <td className="px-5 py-4">
                      {promo.tipo_descuento === "PORCENTAJE" ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-bold px-2 py-0.5 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        >
                          <Percent className="w-3 h-3 mr-0.5 inline-block" />
                          {promo.valor_descuento}% OFF
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-2 py-0.5 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          <DollarSign className="w-3 h-3 inline-block" />
                          {promo.valor_descuento}
                        </Badge>
                      )}
                    </td>

                    {/* ESTADO */}
                    <td className="px-5 py-4 text-center">
                      {promo.activa ? (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4" /> Activa
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground font-semibold text-xs">
                          <XCircle className="w-4 h-4" /> Inactiva
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
