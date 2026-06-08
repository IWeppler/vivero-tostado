import { TIPO_OPTIONS } from "@/entities/productos/constants";
import { Button } from "@/shared/ui/button";

interface CategoryPillsProps {
  tipo: string;
  conteosPorCategoria: Record<string, number>;
  onTipoChange: (tipo: string) => void;
}

export function CategoryPills({
  tipo,
  conteosPorCategoria,
  onTipoChange,
}: Readonly<CategoryPillsProps>) {
  return (
    <div className="flex gap-2 overflow-x-auto bg-background py-1 scrollbar-hide w-full top-16 z-20">
      <Button
        variant={tipo === "todos" ? "default" : "outline"}
        className={`rounded-full h-12 md:h-9 px-5 text-xs font-semibold shrink-0 shadow-none border-border/60 transition-colors ${
          tipo === "todos"
            ? "bg-neutral-900 text-white border-transparent hover:bg-neutral-800"
            : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        onClick={() => onTipoChange("todos")}
      >
        Ver todo
      </Button>

      {TIPO_OPTIONS.filter((option) => option.value !== "todos").map(
        (option) => {
          const count = conteosPorCategoria[option.value.toLowerCase()] || 0;
          if (count === 0) return null;

          return (
            <Button
              key={option.value}
              variant={tipo === option.value ? "default" : "outline"}
              className={`rounded-full h-12 md:h-9 px-5 text-xs font-semibold shrink-0 shadow-none border-border/60 transition-colors ${
                tipo === option.value
                  ? "bg-foreground text-background border-transparent hover:bg-foreground/90"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => onTipoChange(option.value)}
            >
              {option.label}{" "}
              <span className="ml-1.5 opacity-60 font-normal">({count})</span>
            </Button>
          );
        },
      )}
    </div>
  );
}

