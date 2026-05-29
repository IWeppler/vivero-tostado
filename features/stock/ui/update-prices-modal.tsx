"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  TrendingUp,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Percent,
  Target,
} from "lucide-react";
import { TIPO_OPTIONS } from "@/entities/productos/constants";
import {
  simularPreciosAction,
  aplicarPreciosAction,
  AlcancePrecio,
  OperacionPrecio,
  CampoObjetivo,
  TipoRedondeo,
} from "../actions/update-prices";

export function UpdatePricesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // --- ESTADO DEL FORMULARIO ---
  const [alcance, setAlcance] = useState<AlcancePrecio>("TODOS");
  const [categoria, setCategoria] = useState<string>("todos");

  const [campo, setCampo] = useState<CampoObjetivo>("PRECIO");
  const [operacion, setOperacion] = useState<OperacionPrecio>(
    "AUMENTAR_PORCENTAJE",
  );
  const [valor, setValor] = useState<string>("");
  const [redondeo, setRedondeo] = useState<TipoRedondeo>("SIN_REDONDEO");
  const [nombreLote, setNombreLote] = useState<string>("");

  // --- ESTADO DE LA SIMULACIÓN ---
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [confirmado, setConfirmado] = useState(false);

  // --- HANDLERS ---
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setAlcance("TODOS");
    setCategoria("todos");
    setCampo("PRECIO");
    setOperacion("AUMENTAR_PORCENTAJE");
    setValor("");
    setRedondeo("SIN_REDONDEO");
    setNombreLote("");
    setPreviewData([]);
    setConfirmado(false);
  };

  const handleSimular = async () => {
    if (!valor || isNaN(Number(valor))) {
      toast.error("Ingresa un valor numérico válido.");
      return;
    }

    setIsSimulating(true);
    const res = await simularPreciosAction(
      alcance,
      categoria,
      campo,
      operacion,
      Number(valor),
      redondeo,
    );

    setIsSimulating(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.preview) {
      setPreviewData(res.preview);
      setStep(3);
    }
  };

  const handleAplicar = async () => {
    setIsApplying(true);
    const res = await aplicarPreciosAction(nombreLote, previewData, {
      alcance,
      campo,
      operacion,
      valor: Number(valor),
      redondeo,
    });
    setIsApplying(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("¡Precios actualizados con éxito!");
      handleOpenChange(false);
    }
  };

  const formatearMoneda = (m: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(m);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 bg-background border-border/60 hover:bg-muted text-foreground"
          title="Actualizar Precios Masivamente"
        >
          <TrendingUp className="w-4 h-4 sm:mr-1.5 text-primary" />
          <span className="hidden sm:inline">Precios</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Percent className="w-5 h-5 text-primary" />
            Actualización Masiva
          </DialogTitle>
          <DialogDescription className="sr-only">
            Actualiza los precios de costo o venta de tus productos de forma
            masiva.
          </DialogDescription>
          <div className="flex gap-2 mt-4">
            <div
              className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`}
            />
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* PASO 1: ALCANCE */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Paso 1: Alcance</h3>
                <p className="text-sm text-muted-foreground">
                  ¿A qué productos quieres aplicarle esta regla?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Seleccionar Alcance</Label>
                  <Select
                    value={alcance}
                    onValueChange={(v: any) => setAlcance(v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="TODOS">
                        Todos los productos del inventario
                      </SelectItem>
                      <SelectItem value="CATEGORIA">
                        Filtrar por una Categoría específica
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {alcance === "CATEGORIA" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Categoría Objetivo</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Elige la categoría..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {TIPO_OPTIONS.filter((o) => o.value !== "todos").map(
                          (opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={() => setStep(2)}
                  disabled={alcance === "CATEGORIA" && categoria === "todos"}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-none h-11 px-6"
                >
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* PASO 2: REGLA MATEMÁTICA */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Paso 2: La Regla</h3>
                <p className="text-sm text-muted-foreground">
                  Configura cómo se modificarán los precios.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Campo Objetivo</Label>
                  <Select value={campo} onValueChange={(v: any) => setCampo(v)}>
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRECIO">Precio de Venta</SelectItem>
                      <SelectItem value="COSTO">Precio de Costo</SelectItem>
                      <SelectItem value="AMBOS">Ambos a la vez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Estrategia</Label>
                  <Select
                    value={operacion}
                    onValueChange={(v: any) => setOperacion(v)}
                  >
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUMENTAR_PORCENTAJE">
                        Aumento (%)
                      </SelectItem>
                      <SelectItem value="REDUCIR_PORCENTAJE">
                        Descuento (%)
                      </SelectItem>
                      <SelectItem value="FIJAR_MARGEN">
                        Fijar Margen (%)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Valor / Porcentaje</Label>
                  <Input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="Ej: 30"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Redondeo (Sugerido)</Label>
                  <Select
                    value={redondeo}
                    onValueChange={(v: any) => setRedondeo(v)}
                  >
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIN_REDONDEO">Sin Redondeo</SelectItem>
                      <SelectItem value="10">Múltiplo de $10</SelectItem>
                      <SelectItem value="50">Múltiplo de $50</SelectItem>
                      <SelectItem value="100">Múltiplo de $100</SelectItem>
                      <SelectItem value="90">Terminar en 90</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>
                    Nombre de esta actualización (Para el Historial)
                  </Label>
                  <Input
                    value={nombreLote}
                    onChange={(e) => setNombreLote(e.target.value)}
                    placeholder="Ej: Aumento Proveedor Mayorista Mayo"
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="h-11 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
                </Button>
                <Button
                  onClick={handleSimular}
                  disabled={!valor || isSimulating}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-none h-11 px-6"
                >
                  {isSimulating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Simular Impacto
                </Button>
              </div>
            </div>
          )}

          {/* PASO 3: PREVIEW & CONFIRM */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Paso 3: Revisión Final
                </h3>
                <p className="text-sm text-muted-foreground">
                  Se actualizarán{" "}
                  <strong className="text-foreground">
                    {previewData.length} productos
                  </strong>
                  . Revisa los cambios.
                </p>
              </div>

              <ScrollArea className="h-50 border border-border rounded-xl bg-muted/20">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground font-bold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      {(campo === "COSTO" || campo === "AMBOS") && (
                        <th className="px-3 py-2 text-right">Nuevo Costo</th>
                      )}
                      {(campo === "PRECIO" || campo === "AMBOS") && (
                        <th className="px-3 py-2 text-right">Nuevo Precio</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.slice(0, 50).map((item) => (
                      <tr key={item.producto_id}>
                        <td className="px-3 py-2 font-medium truncate max-w-30">
                          {item.nombre}
                        </td>

                        {(campo === "COSTO" || campo === "AMBOS") && (
                          <td className="px-3 py-2 text-right">
                            <div className="font-bold">
                              {formatearMoneda(item.costo_nuevo)}
                            </div>
                            <div
                              className={`text-[10px] font-bold ${item.diferencia_costo > 0 ? "text-green-700" : item.diferencia_costo < 0 ? "text-destuctive" : "text-muted-foreground"}`}
                            >
                              {item.diferencia_costo > 0 ? "+" : ""}
                              {formatearMoneda(item.diferencia_costo)}
                            </div>
                          </td>
                        )}

                        {(campo === "PRECIO" || campo === "AMBOS") && (
                          <td className="px-3 py-2 text-right">
                            <div className="font-bold">
                              {formatearMoneda(item.precio_nuevo)}
                            </div>
                            <div
                              className={`text-[10px] font-bold ${item.diferencia_precio > 0 ? "text-green-700" : item.diferencia_precio < 0 ? "text-destructive" : "text-muted-foreground"}`}
                            >
                              {item.diferencia_precio > 0 ? "+" : ""}
                              {formatearMoneda(item.diferencia_precio)}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 50 && (
                  <div className="text-center py-2 text-xs text-muted-foreground bg-muted/30">
                    Mostrando los primeros 50 de {previewData.length}{" "}
                    productos...
                  </div>
                )}
              </ScrollArea>

              <div className="flex items-center space-x-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <input
                  type="checkbox"
                  id="confirm_check"
                  checked={confirmado}
                  onChange={(e) => setConfirmado(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                />
                <Label
                  htmlFor="confirm_check"
                  className="text-amber-900 cursor-pointer leading-tight font-medium text-xs"
                >
                  Entiendo que esta acción modificará irreversiblemente los
                  precios seleccionados.
                </Label>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  disabled={isApplying}
                  className="h-11 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Modificar Regla
                </Button>
                <Button
                  onClick={handleAplicar}
                  disabled={!confirmado || isApplying}
                  className="bg-primary hover:bg-primary text-white rounded-xl shadow-none h-11 px-6"
                >
                  {isApplying && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Confirmar y Aplicar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
