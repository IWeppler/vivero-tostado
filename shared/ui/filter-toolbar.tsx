"use client";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
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
import {
  FilterX,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { TALLE_OPTIONS, TIPO_OPTIONS } from "@/entities/productos/constants";
import { SelectOption } from "@/shared/types/select";
import { useState } from "react";

const CATEGORIAS_SIMPLIFICADAS = [
  { value: "todas", label: "Todas las categorías" },
  { value: "2025/2026", label: "25/26 (Actual)" },
  { value: "otras", label: "Otras temporadas" },
  { value: "retro", label: "Retro" },
  { value: "especiales", label: "Especiales" },
];

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  temporada: string;
  onTemporadaChange: (value: string) => void;
  tipo: string;
  onTipoChange: (value: string) => void;
  variante: string;
  onVarianteChange: (value: string) => void;
  orden: string;
  onOrdenChange: (value: string) => void;
  ordenOptions: SelectOption[];
  onLimpiar: () => void;
  hayFiltrosActivos: boolean;
  actionButtons?: React.ReactNode;
}

export function FilterToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  temporada,
  onTemporadaChange,
  orden,
  tipo,
  onTipoChange,
  variante,
  onVarianteChange,
  onOrdenChange,
  ordenOptions,
  onLimpiar,
  hayFiltrosActivos,
  actionButtons,
}: Readonly<FilterToolbarProps>) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="space-y-4 mb-4">
      {/* ========================================= */}
      {/* MOBILE TOOLBAR */}
      {/* ========================================= */}
      <div className="flex flex-col sm:hidden w-full border border-border bg-white shadow-sm overflow-hidden rounded-md">
        {/* Fila 1: Buscador + Botón Nueva Camiseta (Inyectado) */}
        <div className="flex items-center border-b border-border bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-12 w-full pl-10 rounded-none border-0 focus-visible:ring-0 shadow-none text-sm bg-transparent"
            />
          </div>
          {/* El botón de "+" y otros botones se inyectan acá en mobile */}
          {actionButtons && (
            <div className="flex items-center justify-center px-2 py-1 border-l border-border bg-[#f5f4f4] h-12 shrink-0">
              {actionButtons}
            </div>
          )}
        </div>

        {/* Fila 2: Dos botones Flat (Filtros y Ordenar) */}
        <div className="grid grid-cols-2 divide-x divide-border">
          <Dialog
            open={isMobileFiltersOpen}
            onOpenChange={setIsMobileFiltersOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 rounded-none border-0 uppercase tracking-widest text-xs font-bold text-foreground hover:bg-muted/30 focus-visible:ring-0 flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {hayFiltrosActivos && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </DialogTrigger>

            <DialogContent className="fixed inset-0 z-50 w-screen h-dvh max-w-none !translate-x-0 !translate-y-0 !top-0 !left-0 m-0 p-0 rounded-none border-none bg-white flex flex-col overflow-hidden [&>button]:hidden">
              <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between shadow-none space-y-0">
                <DialogTitle className="uppercase tracking-widest text-sm font-bold m-0">
                  Filtros de Búsqueda
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

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="uppercase tracking-widest text-[10px] text-muted-foreground font-bold">
                    Categoría
                  </Label>
                  <Select
                    value={temporada === "" ? "todas" : temporada}
                    onValueChange={(val) =>
                      onTemporadaChange(val === "todas" ? "" : val)
                    }
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

                <div className="space-y-3">
                  <Label className="uppercase tracking-widest text-[10px] text-muted-foreground font-bold">
                    Tipo
                  </Label>
                  <Select value={tipo} onValueChange={onTipoChange}>
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

                <div className="space-y-3">
                  <Label className="uppercase tracking-widest text-[10px] text-muted-foreground font-bold">
                    Talle
                  </Label>
                  <Select value={variante} onValueChange={onVarianteChange}>
                    <SelectTrigger className="w-full h-12 rounded-none bg-[#f5f4f4] border-0 shadow-none uppercase tracking-widest text-xs font-bold focus:ring-0">
                      <SelectValue placeholder="Talle" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-border shadow-xl">
                      {TALLE_OPTIONS.map((opt) => (
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

              <div className="p-4 border-t border-border flex gap-3 bg-white">
                <Button
                  variant="outline"
                  onClick={() => {
                    onLimpiar();
                    setIsMobileFiltersOpen(false);
                  }}
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

          <Select value={orden} onValueChange={onOrdenChange}>
            <SelectTrigger className="flex-1 h-12 rounded-none border-0 shadow-none uppercase tracking-widest text-xs font-bold text-foreground focus:ring-0 bg-transparent flex items-center justify-center [&>svg]:hidden px-0">
              <div className="flex items-center justify-center gap-2">
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
      </div>

      {/* ========================================= */}
      {/* DESKTOP TOOLBAR (Mantenemos el formato clásico y amplio) */}
      {/* ========================================= */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 p-2 bg-[#f5f4f4] border border-border/60 rounded-md">
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full rounded-none shadow-none border-border/60 bg-white hover:border-foreground/40 focus-visible:border-foreground focus-visible:ring-0 transition-colors h-10"
          />
        </div>

        <Select
          value={temporada === "" ? "todas" : temporada}
          onValueChange={(val) => onTemporadaChange(val === "todas" ? "" : val)}
        >
          <SelectTrigger className="w-full sm:w-[150px] rounded-none shadow-none cursor-pointer border-border/60 hover:border-foreground/40 bg-white focus:ring-0 transition-colors text-xs font-medium h-10">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="rounded-none shadow-md">
            {CATEGORIAS_SIMPLIFICADAS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer rounded-none text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tipo} onValueChange={onTipoChange}>
          <SelectTrigger className="w-full sm:w-[130px] rounded-none shadow-none cursor-pointer border-border/60 hover:border-foreground/40 bg-white focus:ring-0 transition-colors text-xs font-medium h-10">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="rounded-none shadow-md">
            {TIPO_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer rounded-none text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={variante} onValueChange={onVarianteChange}>
          <SelectTrigger className="w-full sm:w-[120px] rounded-none shadow-none cursor-pointer border-border/60 hover:border-foreground/40 bg-white focus:ring-0 transition-colors text-xs font-medium h-10">
            <SelectValue placeholder="Talle" />
          </SelectTrigger>
          <SelectContent className="rounded-none shadow-md">
            {TALLE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer rounded-none uppercase text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={orden} onValueChange={onOrdenChange}>
          <SelectTrigger className="w-full sm:w-[220px] rounded-none shadow-none cursor-pointer border-border/60 hover:border-foreground/40 bg-white focus:ring-0 transition-colors text-xs font-medium h-10">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3 w-3 opacity-50" />
              <SelectValue placeholder="Ordenar por" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-none shadow-md">
            {ordenOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="cursor-pointer rounded-none text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hayFiltrosActivos && (
          <Button
            variant="ghost"
            onClick={onLimpiar}
            className="text-muted-foreground hover:text-foreground w-full sm:w-auto rounded-none cursor-pointer uppercase tracking-widest text-[10px] font-semibold hover:bg-muted/50 h-10 px-3"
          >
            <FilterX className="h-3 w-3 mr-1.5" /> Limpiar
          </Button>
        )}

        {actionButtons && (
          <div className="flex items-center gap-2 w-full sm:w-auto xl:ml-auto">
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
}
