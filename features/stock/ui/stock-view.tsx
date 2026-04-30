"use client";

import { useState, useMemo } from "react";
import { Producto } from "@/entities/productos/types";
import { StockTable } from "./stock-table";
import { StockGrid } from "./stock-grid";
import { Button } from "@/shared/ui/button";
import { LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { CrearProductoModal } from "@/features/stock/ui/create-modal";
import { ImportarPedidoModal } from "@/features/purchases/ui/create-purchase-modal";
import { FilterToolbar } from "@/shared/ui/filter-toolbar";

interface StockViewProps {
  productos: Producto[];
}

export function StockView({ productos }: Readonly<StockViewProps>) {
  const [view, setView] = useState<"table" | "grid">("table");

  const ITEMS_POR_PAGINA = 10;
  const [paginaActual, setPaginaActual] = useState(1);

  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCuidados, setFiltroCuidados] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroVariante, setFiltroVariante] = useState("todos");
  const [orden, setOrden] = useState("recientes");

  const ordenOptions = [
    { value: "recientes", label: "Agregados recientemente" },
    { value: "antiguos", label: "Más antiguos" },
    { value: "mayor_precio", label: "Mayor precio" },
    { value: "menor_precio", label: "Menor precio" },
  ];

  const productosFiltradosYOrdenados = useMemo(() => {
    const resultado = productos.filter((producto) => {
      const nombre = producto.nombre?.toLowerCase() || "";
      const cuidados = producto.cuidados?.toLowerCase() || "";
      const tipo = producto.tipo?.toLowerCase() || "";

      let tieneVariante = false;
      if (filtroVariante === "todos") {
        tieneVariante = true;
      } else if (producto.stock) {
        tieneVariante = producto.stock.some(
          (s) =>
            s.variante.toLowerCase() === filtroVariante.toLowerCase() &&
            s.cantidad > 0,
        );
      }

      const matchNombre = nombre.includes(filtroNombre.toLowerCase());
      const matchCuidados = cuidados.includes(filtroCuidados.toLowerCase());
      const matchTipo =
        filtroTipo === "todos" || tipo === filtroTipo.toLowerCase();

      return matchNombre && matchCuidados && matchTipo && tieneVariante;
    });

    resultado.sort((a, b) => {
      switch (orden) {
        case "recientes":
          return (
            new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
          );
        case "antiguos":
          return (
            new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime()
          );
        case "mayor_precio":
          return b.precio - a.precio;
        case "menor_precio":
          return a.precio - b.precio;
        default:
          return 0;
      }
    });

    return resultado;
  }, [
    productos,
    filtroNombre,
    filtroCuidados,
    filtroTipo,
    filtroVariante,
    orden,
  ]);

  const totalPaginas = Math.ceil(
    productosFiltradosYOrdenados.length / ITEMS_POR_PAGINA,
  );
  const productosPaginados = productosFiltradosYOrdenados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroCuidados("");
    setFiltroTipo("todos");
    setFiltroVariante("todos");
    setOrden("recientes");
    setPaginaActual(1);
  };

  const handleFiltroNombre = (v: string) => {
    setFiltroNombre(v);
    setPaginaActual(1);
  };
  const handleFiltroCuidados = (v: string) => {
    setFiltroCuidados(v);
    setPaginaActual(1);
  };
  const handleFiltroTipo = (v: string) => {
    setFiltroTipo(v);
    setPaginaActual(1);
  };
  const handleFiltroVariante = (v: string) => {
    setFiltroVariante(v);
    setPaginaActual(1);
  };
  const handleOrden = (v: string) => {
    setOrden(v);
    setPaginaActual(1);
  };

  const hayFiltrosActivos =
    filtroNombre !== "" ||
    filtroCuidados !== "" ||
    filtroTipo !== "todos" ||
    filtroVariante !== "todos" ||
    orden !== "recientes";

  // 💡 Dejamos SOLO el selector de vista (Tabla/Grilla) en la Toolbar
  const viewToggleButtons = (
    <div className="hidden sm:flex items-center gap-1 bg-muted p-1 rounded-md justify-center">
      <Button
        variant={view === "table" ? "default" : "ghost"}
        className={`font-medium transition-all h-8 ${
          view === "table"
            ? "shadow-sm bg-neutral-900 text-white"
            : "text-muted-foreground cursor-pointer"
        }`}
        onClick={() => setView("table")}
      >
        <List className="h-4 w-4 mr-1" /> Tabla
      </Button>
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        className={`font-medium transition-all h-8 ${
          view === "grid"
            ? "shadow-sm bg-neutral-900 text-white"
            : "text-muted-foreground cursor-pointer"
        }`}
        onClick={() => setView("grid")}
      >
        <LayoutGrid className="h-4 w-4 mr-1" /> Grilla
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 💡 Acciones Superiores: Las extraemos de la barra de filtros y las ponemos en su propio contenedor */}
      <div className="flex flex-wrap items-center justify-end gap-3 w-full -mt-4 mb-2">
        <ImportarPedidoModal />
        <CrearProductoModal />
      </div>

      <FilterToolbar
        searchQuery={filtroNombre}
        onSearchChange={handleFiltroNombre}
        searchPlaceholder="Buscar por nombre..."
        cuidados={filtroCuidados}
        onCuidadosChange={handleFiltroCuidados}
        tipo={filtroTipo}
        onTipoChange={handleFiltroTipo}
        variante={filtroVariante}
        onVarianteChange={handleFiltroVariante}
        orden={orden}
        onOrdenChange={handleOrden}
        ordenOptions={ordenOptions}
        onLimpiar={limpiarFiltros}
        hayFiltrosActivos={hayFiltrosActivos}
        actionButtons={viewToggleButtons}
      />

      {view === "table" ? (
        <StockTable productos={productosPaginados} />
      ) : (
        <StockGrid productos={productosPaginados} />
      )}

      {totalPaginas > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t border-border mt-4">
          <span className="text-sm text-muted-foreground">
            Mostrando{" "}
            {Math.min(
              productosFiltradosYOrdenados.length,
              (paginaActual - 1) * ITEMS_POR_PAGINA + 1,
            )}{" "}
            a{" "}
            {Math.min(
              productosFiltradosYOrdenados.length,
              paginaActual * ITEMS_POR_PAGINA,
            )}{" "}
            de {productosFiltradosYOrdenados.length} productos
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <div className="text-sm font-medium px-4">
              Página {paginaActual} de {totalPaginas}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaActual === totalPaginas}
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
