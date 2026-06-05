"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { DateRange } from "react-day-picker";

export function ReportesFilterbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const periodoActual = searchParams.get("periodo") || "mes";
  const desdeActual = searchParams.get("desde") || "";
  const hastaActual = searchParams.get("hasta") || "";

  // Tipamos explícitamente el estado con DateRange
  const [date, setDate] = useState<DateRange | undefined>(() => {
    if (desdeActual && hastaActual) {
      return {
        from: new Date(desdeActual + "T00:00:00"),
        to: new Date(hastaActual + "T00:00:00"),
      };
    }
    return undefined;
  });

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePreset = (preset: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", preset);
    if (preset !== "personalizado") {
      params.delete("desde");
      params.delete("hasta");
      setDate(undefined);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCustomApply = () => {
    if (!date?.from || !date?.to) return;

    // Formateador seguro para evitar desfases de zona horaria local
    const formatLocal = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", "personalizado");
    params.set("desde", formatLocal(date.from));
    params.set("hasta", formatLocal(date.to));
    router.push(`${pathname}?${params.toString()}`);
    setIsPopoverOpen(false);
  };

  const formatDateStr = (d?: Date) => {
    if (!d) return "";
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
    }).format(d);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <Select value={periodoActual} onValueChange={handlePreset}>
        <SelectTrigger className="w-full sm:w-[160px] h-10 bg-card border-border font-medium">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-xl">
          <SelectItem value="hoy">Hoy</SelectItem>
          <SelectItem value="7dias">Últimos 7 días</SelectItem>
          <SelectItem value="30dias">Últimos 30 días</SelectItem>
          <SelectItem value="mes">Este mes</SelectItem>
          <SelectItem value="mes_anterior">Mes anterior</SelectItem>
          <SelectItem value="anio">Este año</SelectItem>
          <SelectItem value="personalizado">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Picker Range Shadcn (Se muestra solo al elegir Personalizado) */}
      {periodoActual === "personalizado" && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full sm:w-[260px] h-10 justify-start text-left font-medium transition-colors border-border bg-card ${
                !date ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {date?.from ? (
                date.to ? (
                  <>
                    {formatDateStr(date.from)} - {formatDateStr(date.to)}
                  </>
                ) : (
                  formatDateStr(date.from)
                )
              ) : (
                <span>Elegir fechas...</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-xl shadow-lg border-border"
            align="end"
          >
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
            <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!date?.from || !date?.to}
              >
                Aplicar Rango
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
