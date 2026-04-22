"use client";

import { useState, useMemo, Suspense } from "react";
import { Producto } from "@/entities/productos/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  ShoppingBag,
  SearchX,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { VARIANTE_OPTIONS, TIPO_OPTIONS } from "@/entities/productos/constants";

const CATEGORIAS_SIMPLIFICADAS = [
  { value: "todas", label: "Todas las categorías" },
  { value: "interior", label: "Plantas de Interior" },
  { value: "exterior", label: "Plantas de Exterior" },
  { value: "suculentas", label: "Suculentas" },
  { value: "macetas", label: "Macetas" },
];

interface StoreCatalogProps {
  productos: Producto[];
}

const ITEMS_POR_PAGINA = 12;

function CatalogContent({ productos }: { productos: Producto[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchQuery = searchParams.get("q") || "";

  const [cuidados, setCuidados] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [variante, setVariante] = useState("todos");
  const [orden, setOrden] = useState("recientes");
  const [visibleCount, setVisibleCount] = useState(ITEMS_POR_PAGINA);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const ordenOptions = [
    { value: "recientes", label: "Últimos ingresos" },
    { value: "menor_precio", label: "Menor precio" },
    { value: "mayor_precio", label: "Mayor precio" },
  ];

  const productosFiltradas = useMemo(() => {
    const resultado = productos.filter((c) => {
      const nombreStr = c.nombre || "";
      const tipoStr = c.tipo || "";

      const matchSearch = nombreStr
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchCuidados = cuidados === "" || c.cuidados === cuidados;
      const matchTipo =
        tipo === "todos" || tipoStr.toLowerCase() === tipo.toLowerCase();

      const matchVariante =
        variante === "todos" ||
        (c.stock &&
          c.stock.some(
            (s) =>
              (s.variante || "").toLowerCase() === variante.toLowerCase() &&
              s.cantidad > 0,
          ));

      return matchSearch && matchCuidados && matchTipo && matchVariante;
    });

    resultado.sort((a, b) => {
      if (orden === "recientes") {
        return (
          new Date(b.creado_en || 0).getTime() -
          new Date(a.creado_en || 0).getTime()
        );
      }
      if (orden === "menor_precio") return (a.precio || 0) - (b.precio || 0);
      if (orden === "mayor_precio") return (b.precio || 0) - (a.precio || 0);
      return 0;
    });

    return resultado;
  }, [productos, searchQuery, cuidados, tipo, variante, orden]);

  const productosVisibles = productosFiltradas.slice(0, visibleCount);
  const hayMasProductos = visibleCount < productosFiltradas.length;

  const handleFiltrar =
    (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
      setter(val);
      setVisibleCount(ITEMS_POR_PAGINA);
    };

  const limpiarFiltros = () => {
    setCuidados("");
    setTipo("todos");
    setVariante("todos");
    setOrden("recientes");
    setVisibleCount(ITEMS_POR_PAGINA);
    setIsMobileFiltersOpen(false);

    if (searchQuery) {
      router.replace(pathname);
    }
  };

  const hayFiltrosActivos =
    cuidados !== "" ||
    tipo !== "todos" ||
    variante !== "todos" ||
    orden !== "recientes" ||
    searchQuery !== "";

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShoppingBag
          className="w-16 h-16 text-muted-foreground/20 mb-6"
          strokeWidth={1}
        />
        <h2 className="text-2xl font-light text-foreground tracking-tight">
          Catálogo vacío
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOOLBAR MOBILE */}
      <div className="grid grid-cols-2 sm:hidden w-full border-y border-border bg-white sticky top-16 z-30 divide-x divide-border">
        {/* BOTÓN FILTROS */}
        <Dialog
          open={isMobileFiltersOpen}
          onOpenChange={setIsMobileFiltersOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-14 rounded-none border-0 border-r border-border uppercase tracking-widest text-xs font-bold text-foreground hover:bg-muted/30 focus-visible:ring-0 flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {hayFiltrosActivos && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="fixed inset-0 z-50 w-screen h-dvh max-w-none translate-x-0! translate-y-0! top-0! left-0! m-0 p-0 rounded-none border-none bg-white flex flex-col overflow-hidden [&>button]:hidden">
            <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between shadow-none space-y-0">
              <DialogTitle className="uppercase tracking-widest text-sm font-bold m-0">
                Filtrar Catálogo
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="rounded-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-4">
                <Label className="uppercase tracking-widest text-[10px] text-muted-foreground font-bold">
                  Categoría
                </Label>
                <Select
                  value={cuidados === "" ? "todas" : cuidados}
                  onValueChange={(val) => {
                    setCuidados(val === "todas" ? "" : val);
                    setVisibleCount(ITEMS_POR_PAGINA);
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-none bg-[#f5f4f4] border-0 shadow-none uppercase tracking-widest text-xs font-bold focus:ring-0">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border shadow-xl">
                    {CATEGORIAS_SIMPLIFICADAS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="rounded-none uppercase tracking-widest text-xs py-3"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="uppercase tracking-widest text-[10px] text-muted-foreground font-bold">
                  Tipo
                </Label>
                <Select value={tipo} onValueChange={handleFiltrar(setTipo)}>
                  <SelectTrigger className="w-full h-12 rounded-none bg-[#f5f4f4] border-0 shadow-none uppercase tracking-widest text-xs font-bold focus:ring-0">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border shadow-xl">
                    {TIPO_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="rounded-none uppercase tracking-widest text-xs py-3"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="uppercase tracking-widest text-[10px] text-muted-foreground font-bold">
                  Talle
                </Label>
                <Select
                  value={variante}
                  onValueChange={handleFiltrar(setVariante)}
                >
                  <SelectTrigger className="w-full h-12 rounded-none bg-[#f5f4f4] border-0 shadow-none uppercase tracking-widest text-xs font-bold focus:ring-0">
                    <SelectValue placeholder="Variante" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border shadow-xl">
                    {VARIANTE_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="rounded-none uppercase tracking-widest text-xs py-3"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3 bg-white mb-4">
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                className="flex-1 rounded-none uppercase tracking-widest text-xs font-bold h-12 border-border shadow-none"
              >
                Limpiar
              </Button>
              <Button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 rounded-none uppercase tracking-widest text-xs font-bold h-12 shadow-none"
              >
                Ver Resultados
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* BOTÓN ORDENAR */}
        <Select value={orden} onValueChange={handleFiltrar(setOrden)}>
          <SelectTrigger className="w-full h-14 my-1 rounded-none border-0 shadow-none uppercase tracking-widest text-xs font-bold text-foreground focus:ring-0 bg-transparent hover:bg-muted/30 [&>svg]:hidden px-0 flex items-center justify-center">
            <div className="flex items-center justify-center gap-2 ">
              <ArrowUpDown className="w-4 h-4" />
              <span>Ordenar</span>
            </div>
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className="w-[200px] rounded-none border-border shadow-xl"
          >
            {ordenOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="rounded-none uppercase tracking-widest text-xs py-3"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TOOLBAR DESKTOP  */}
      <div className="hidden sm:flex items-center justify-between py-3 border-b border-border bg-white sticky top-16 z-20 mb-8">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-widest text-[10px] font-bold text-muted-foreground mr-1">
            Filtros:
          </span>

          <Select
            value={cuidados === "" ? "todas" : cuidados}
            onValueChange={(val) =>
              handleFiltrar(setCuidados)(val === "todas" ? "" : val)
            }
          >
            <SelectTrigger className="w-[200px] h-10 rounded-none border-0 bg-[#f5f4f4] shadow-none uppercase tracking-widest text-[10px] font-bold focus:ring-0 px-3">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border shadow-xl">
              {CATEGORIAS_SIMPLIFICADAS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-none uppercase tracking-widest text-[11px] py-2.5"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tipo} onValueChange={handleFiltrar(setTipo)}>
            <SelectTrigger className="w-[160px] h-10 rounded-none border-0 bg-[#f5f4f4] shadow-none uppercase tracking-widest text-[10px] font-bold focus:ring-0 px-3">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border shadow-xl">
              {TIPO_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-none uppercase tracking-widest text-[11px] py-2.5"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={variante} onValueChange={handleFiltrar(setVariante)}>
            <SelectTrigger className="w-[170px] h-10 rounded-none border-0 bg-[#f5f4f4] shadow-none uppercase tracking-widest text-[10px] font-bold focus:ring-0 px-3">
              <SelectValue placeholder="Variante" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border shadow-xl">
              {VARIANTE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-none uppercase tracking-widest text-[11px] py-2.5"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hayFiltrosActivos && (
            <Button
              variant="ghost"
              onClick={limpiarFiltros}
              className="h-10 rounded-none uppercase tracking-widest text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-[#f5f4f4]"
            >
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="uppercase tracking-widest text-[10px] font-bold text-muted-foreground">
            Ordenar:
          </span>
          <Select value={orden} onValueChange={handleFiltrar(setOrden)}>
            <SelectTrigger className="w-[200px] h-10 rounded-none border-0 bg-[#f5f4f4] shadow-none uppercase tracking-widest text-[10px] font-bold focus:ring-0 px-3">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border shadow-xl">
              {ordenOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="rounded-none uppercase tracking-widest text-[10px] py-2.5"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* GRILLA DE PRODUCTOS */}
      {productosFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <SearchX
            className="w-12 h-12 text-muted-foreground/30 mb-4"
            strokeWidth={1}
          />
          <h2 className="text-xl font-medium text-foreground tracking-tight">
            No encontramos resultados
          </h2>
          <Button
            variant="link"
            className="mt-4 text-foreground underline underline-offset-4"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
            {productosVisibles.map((producto) => {
              let imagenes: string[] = [];
              if (Array.isArray(producto.imagen_url)) {
                imagenes = producto.imagen_url;
              } else if (typeof producto.imagen_url === "string") {
                try {
                  const parsed = JSON.parse(producto.imagen_url);
                  imagenes = Array.isArray(parsed)
                    ? parsed
                    : [producto.imagen_url];
                } catch {
                  imagenes = [producto.imagen_url];
                }
              }

              const primeraImagen = imagenes[0] || null;
              const linkDestino = producto.slug
                ? `/store/${producto.slug}`
                : "#";

              return (
                <div
                  key={producto.id}
                  className="group relative flex flex-col transition-all"
                >
                  <Link
                    href={linkDestino}
                    className="aspect-4/5 bg-[#f7f7f7] relative overflow-hidden flex items-center justify-center w-full shadow-none border border-border/40"
                  >
                    {primeraImagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primeraImagen}
                        alt={producto.nombre || "Producto"}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <ShoppingBag
                        className="w-10 h-10 text-muted-foreground/20"
                        strokeWidth={1}
                      />
                    )}

                    {producto.tipo && (
                      <div className="absolute top-3 left-3 z-5">
                        <Badge
                          variant="secondary"
                          className="bg-white/90 text-black rounded-none uppercase text-[9px] font-bold tracking-widest px-2 py-0.5 border-none shadow-none"
                        >
                          {producto.tipo}
                        </Badge>
                      </div>
                    )}
                  </Link>

                  <div className="pt-4 flex flex-col">
                    <Link
                      href={linkDestino}
                      className="hover:underline decoration-1 underline-offset-4"
                    >
                      <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide truncate">
                        {producto.nombre || "Sin nombre"}
                      </h3>
                    </Link>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                      {producto.cuidados}
                    </p>
                    <div className="mt-2">
                      <span className="text-sm font-bold text-foreground">
                        ${(producto.precio || 0).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hayMasProductos && (
            <div className="flex justify-center pt-12 pb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  setVisibleCount((prev) => prev + ITEMS_POR_PAGINA)
                }
                className="w-full sm:w-auto font-bold rounded-none border-border shadow-none text-foreground hover:bg-neutral-900 hover:text-white px-12 uppercase tracking-widest text-xs transition-colors h-14 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" /> Cargar más
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function StoreCatalog({ productos }: Readonly<StoreCatalogProps>) {
  return (
    <Suspense
      fallback={
        <div className="py-32 text-center uppercase tracking-widest font-bold text-muted-foreground">
          Cargando catálogo...
        </div>
      }
    >
      <CatalogContent productos={productos} />
    </Suspense>
  );
}
