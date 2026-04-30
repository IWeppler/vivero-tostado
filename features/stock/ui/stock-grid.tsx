"use client";

import { Producto } from "@/entities/productos/types";
import { Badge } from "@/shared/ui/badge";
import { Image as ImageIcon } from "lucide-react";
import { EditarProductoModal } from "./edit-modal";
import { EliminarProductoModal } from "./delete-modal";

interface StockGridProps {
  productos: Producto[];
}

export function StockGrid({ productos }: Readonly<StockGridProps>) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border">
        <p className="text-muted-foreground">
          No hay productos en el inventario.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {productos.map((producto) => {
        let primeraImagen = null;
        if (
          Array.isArray(producto.imagen_url) &&
          producto.imagen_url.length > 0
        ) {
          primeraImagen = producto.imagen_url[0];
        } else if (typeof producto.imagen_url === "string") {
          if (producto.imagen_url.startsWith("[")) {
            try {
              const parsed = JSON.parse(producto.imagen_url);
              primeraImagen = Array.isArray(parsed)
                ? parsed[0]
                : producto.imagen_url;
            } catch {
              primeraImagen = producto.imagen_url;
            }
          } else {
            primeraImagen = producto.imagen_url;
          }
        }

        const precioCosto = producto.precio_costo ?? 0;

        return (
          <div
            key={producto.id}
            className="flex flex-col border border-border bg-card text-card-foreground overflow-hidden"
          >
            {/* Contenedor de Imagen */}
            <div className="aspect-square bg-muted flex items-center justify-center relative border-b border-border">
              {primeraImagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primeraImagen}
                  alt={producto.nombre}
                  className="object-cover w-full h-full"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-30" />
              )}
              {/* Badge flotante de Tipo */}
              <div className="absolute top-3 right-3">
                <Badge
                  variant="secondary"
                  className="backdrop-blur-sm bg-background/80"
                >
                  {producto.tipo}
                </Badge>
              </div>
            </div>

            {/* Contenido (Info) */}
            <div className="p-4 flex flex-col flex-1">
              <h3
                className="font-bold text-lg leading-tight truncate"
                title={producto.nombre}
              >
                {producto.nombre}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {producto.cuidados}
              </p>

              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  Stock Disponible
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {producto.stock && producto.stock.length > 0 ? (
                    producto.stock.map((s) => (
                      <Badge
                        key={s.id}
                        variant={s.cantidad > 0 ? "outline" : "destructive"}
                        className="text-xs px-1.5"
                      >
                        {s.variante}: {s.cantidad}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Sin definir
                    </span>
                  )}
                </div>
              </div>

              {/* Spacer para empujar el precio y botones hacia abajo */}
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold text-primary leading-none">
                    ${producto.precio.toLocaleString("es-AR")}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 font-medium">
                    Costo: ${precioCosto.toLocaleString("es-AR")}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <EditarProductoModal producto={producto} />
                  <EliminarProductoModal
                    id={producto.id}
                    nombre={producto.nombre}
                    tipo={producto.tipo}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
