import { useMemo } from "react";
import { Producto } from "@/entities/productos/types";

export const ITEMS_POR_PAGINA = 12;
export const DEFAULT_TIPO = "todos";
export const DEFAULT_VARIANTE = "todos";
export const DEFAULT_ORDEN = "mas_vendidos";

interface UseCatalogFiltersParams {
  productos: Producto[];
  searchQuery: string;
  tipo: string;
  variante: string;
  orden: string;
  visibleCount: number;
}

type ProductoConVentas = Producto & {
  ventas_count?: number;
};

export function useCatalogFilters({
  productos,
  searchQuery,
  tipo,
  variante,
  orden,
  visibleCount,
}: UseCatalogFiltersParams) {
  const conteosPorCategoria = useMemo(() => {
    const conteos: Record<string, number> = {};
    productos.forEach((producto) => {
      const categoria = producto.tipo?.toLowerCase() || "";
      conteos[categoria] = (conteos[categoria] || 0) + 1;
    });
    return conteos;
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const resultado = productos.filter((producto) => {
      const nombre = producto.nombre || "";
      const tipoProducto = producto.tipo || "";

      const matchSearch = nombre
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchTipo =
        tipo === DEFAULT_TIPO ||
        tipoProducto.toLowerCase() === tipo.toLowerCase();
      const matchVariante =
        variante === DEFAULT_VARIANTE ||
        (producto.stock?.some(
          (stock) =>
            (stock.variante || "").toLowerCase() === variante.toLowerCase() &&
            stock.cantidad > 0,
        ) ??
          false);

      return matchSearch && matchTipo && matchVariante;
    });

    resultado.sort((a, b) => {
      if (orden === DEFAULT_ORDEN) {
        const ventasA = (a as ProductoConVentas).ventas_count || 0;
        const ventasB = (b as ProductoConVentas).ventas_count || 0;
        if (ventasA !== ventasB) return ventasB - ventasA;

        return (
          new Date(b.creado_en || 0).getTime() -
          new Date(a.creado_en || 0).getTime()
        );
      }

      if (orden === "recientes") {
        return (
          new Date(b.creado_en || 0).getTime() -
          new Date(a.creado_en || 0).getTime()
        );
      }

      if (orden === "menor_precio") {
        return (a.precio || 0) - (b.precio || 0);
      }

      if (orden === "mayor_precio") {
        return (b.precio || 0) - (a.precio || 0);
      }

      return 0;
    });

    return resultado;
  }, [productos, searchQuery, tipo, variante, orden]);

  const hayFiltrosActivos =
    tipo !== DEFAULT_TIPO ||
    variante !== DEFAULT_VARIANTE ||
    orden !== DEFAULT_ORDEN ||
    searchQuery !== "";

  return {
    conteosPorCategoria,
    productosFiltrados,
    productosVisibles: productosFiltrados.slice(0, visibleCount),
    hayMasProductos: visibleCount < productosFiltrados.length,
    hayFiltrosActivos,
  };
}

