import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type ProductBasicInfoSectionProps = {
  status: "active" | "inactive";
  onStatusChange: (status: "active" | "inactive") => void;
  defaultNombre?: string;
  defaultDescripcion?: string | null;
};

export function ProductBasicInfoSection({
  status,
  onStatusChange,
  defaultNombre,
  defaultDescripcion,
}: ProductBasicInfoSectionProps) {
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="nombre"
          className="text-sm font-semibold text-foreground"
        >
          Título del producto
        </Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ingresa el nombre del producto"
          defaultValue={defaultNombre}
          required
          className="h-11 px-3 bg-sidebar"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Estado</Label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onStatusChange("active")}
            className={`flex-1 flex items-center gap-3 p-3 bg-transparent border rounded-lg transition-all shadow-none ${status === "active" ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-border/80"}`}
          >
            <div
              className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${status === "active" ? "border-primary" : "border-muted-foreground/40"}`}
            >
              {status === "active" && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
            <span className="font-medium text-sm">Activo</span>
          </button>
          <button
            type="button"
            onClick={() => onStatusChange("inactive")}
            className={`flex-1 flex items-center gap-3 p-3 bg-transparent border rounded-lg transition-all shadow-none ${status === "inactive" ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-border/80"}`}
          >
            <div
              className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${status === "inactive" ? "border-primary" : "border-muted-foreground/40"}`}
            >
              {status === "inactive" && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
            <span className="font-medium text-sm">Inactivo</span>
          </button>
        </div>
        <input
          type="hidden"
          name="publicado"
          value={status === "active" ? "true" : "false"}
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="descripcion"
          className="text-sm font-semibold text-foreground"
        >
          Descripción
        </Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          placeholder="Descripción del producto..."
          defaultValue={defaultDescripcion || ""}
          className="bg-sidebar rounded-lg shadow-none border-border resize-none h-28 p-3 text-sm"
        />
      </div>
    </>
  );
}
