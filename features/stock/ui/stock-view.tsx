"use client";

import { useState, useMemo } from "react";
import { Producto } from "@/entities/productos/types";
import { StockTable } from "./stock-table";
import { StockGrid } from "./stock-grid";
import { Button } from "@/shared/ui/button";
import {
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  FilterX,
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import { CrearProductoModal } from "@/features/stock/ui/create-modal";
import { ImportarPedidoModal } from "@/features/purchases/ui/create-purchase-modal";
import Link from "next/link";
import { TIPO_OPTIONS } from "@/entities/productos/constants";

interface StockViewProps {
  productos: Producto[];
  userRole: string;
}

export function StockView({ productos, userRole }: Readonly<StockViewProps>) {
  const [view, setView] = useState<"table" | "grid">("table");

  const ITEMS_POR_PAGINA = 10;
  const [paginaActual, setPaginaActual] = useState(1);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todos");

  const isAdmin = userRole === "ADMIN";

  // Lógica de filtrado por producto.
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = p.nombre
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchCat =
        categoriaActiva === "todos" ||
        p.tipo?.toLowerCase() === categoriaActiva.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [productos, searchQuery, categoriaActiva]);

  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA);
  const productosPaginados = productosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  const hayFiltrosActivos = searchQuery !== "" || categoriaActiva !== "todos";

  const limpiarFiltros = () => {
    setSearchQuery("");
    setCategoriaActiva("todos");
    setPaginaActual(1);
  };

  return (
    <div className="space-y-4">
      {/* 1. BARRA SUPERIOR: Buscador y Acciones */}
      <div className="flex flex-row gap-4 justify-between items-start xl:items-center bg-background p-4 rounded-xl border border-border">
        {/* Buscador Integrado */}
        <div className="relative flex-1 min-w-4/5 md:min-w-1/2 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar planta, maceta, sustrato..."
            className="pl-9 h-10 text-sm rounded-lg border-border/60 bg-[#f5f4f4] focus-visible:bg-background shadow-none transition-colors"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>

        {/* Controles y Botonera Admin */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Toggle View (Solo si no estás filtrando fuerte) */}
          <div className="hidden sm:flex items-center bg-[#f5f4f4] border border-border/60 p-0.5 rounded-lg shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("table")}
              className={`h-8 px-2.5 rounded-md ${view === "table" ? "bg-background font-bold" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista de lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("grid")}
              className={`h-8 px-2.5 rounded-md ${view === "grid" ? "bg-background font-bold" : "text-muted-foreground hover:text-foreground"}`}
              title="Vista de grilla (agrupada)"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Botones Admin Compactos */}
          {isAdmin && (
            <div className="flex flex-1 sm:flex-none justify-end gap-2 sm:ml-2 sm:pl-4 sm:border-l sm:border-border">
              <ImportarPedidoModal />
              <Link href="/stock/bajas" className="hidden lg:block">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10  bg-background border-border/60 hover:bg-muted"
                >
                  <ClipboardList className="w-4 h-4 sm:mr-1.5 text-amber-600" />
                  <span className="hidden sm:inline">Bajas</span>
                </Button>
              </Link>
              <CrearProductoModal />
            </div>
          )}
        </div>
      </div>

      {/* 2. BARRA DE CATEGORÍAS (Pills) Y LIMPIEZA */}
      <div className="flex items-start gap-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1 px-1 sm:px-0">
          <Button
            variant={categoriaActiva === "todos" ? "default" : "outline"}
            className={`rounded-full h-8 px-4 text-xs font-semibold shrink-0 shadow-none border-border/60 ${categoriaActiva === "todos" ? "bg-neutral-900 text-white border-transparent" : "bg-background text-muted-foreground hover:bg-muted"}`}
            onClick={() => {
              setCategoriaActiva("todos");
              setPaginaActual(1);
            }}
          >
            Todas
          </Button>
          {TIPO_OPTIONS.filter((opt) => opt.value !== "todos").map((opt) => (
            <Button
              key={opt.value}
              variant={categoriaActiva === opt.value ? "default" : "outline"}
              className={`rounded-full h-8 px-4 text-xs font-semibold shrink-0 transition-colors shadow-none border-border/60 ${
                categoriaActiva === opt.value
                  ? "bg-neutral-900 text-white border-transparent"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => {
                setCategoriaActiva(opt.value);
                setPaginaActual(1);
              }}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Botón de limpiar filtros si están activos */}
        {hayFiltrosActivos && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="h-8 mt-0 text-xs font-bold text-muted-foreground hover:text-foreground shrink-0 hidden sm:flex items-center"
          >
            <FilterX className="w-3.5 h-3.5 mr-1.5" /> Limpiar
          </Button>
        )}
      </div>

      {/* 3. VISTAS */}
      <div className="bg-background rounded-xl border border-border overflow-hidden min-h-100">
        {view === "table" ? (
          <StockTable productos={productosPaginados} userRole={userRole} />
        ) : (
          <StockGrid productos={productosPaginados} userRole={userRole} />
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t border-border mt-4">
          <span className="text-xs font-medium text-muted-foreground">
            Mostrando{" "}
            {Math.min(
              productosFiltrados.length,
              (paginaActual - 1) * ITEMS_POR_PAGINA + 1,
            )}{" "}
            a{" "}
            {Math.min(
              productosFiltrados.length,
              paginaActual * ITEMS_POR_PAGINA,
            )}{" "}
            de {productosFiltrados.length} productos
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 shadow-none"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
            >
              <ChevronLeft className="w-4 h-4 sm:mr-1" />{" "}
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <div className="text-xs font-bold px-3">
              {paginaActual} / {totalPaginas}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shadow-none"
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaActual === totalPaginas}
            >
              <span className="hidden sm:inline">Siguiente</span>{" "}
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
