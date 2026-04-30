"use client";

import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import {
  procesarPedidoAction,
  RawOrderItem,
} from "@/features/purchases/actions/create-purchase";

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
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

type ExcelRow = Record<string, string | number | undefined>;

export function ImportarPedidoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [proveedor, setProveedor] = useState("Distribuidora Fabbro");
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        raw: false,
      });

      if (jsonData.length === 0) {
        throw new Error("El archivo parece estar vacío.");
      }

      // 4. Mapeador Inteligente
      const mappedItems: RawOrderItem[] = jsonData
        .map((row, index) => {
          const desc =
            row["DESCRIPCIÓN"] ||
            row["DESCRIPCION"] ||
            row["PRODUCTO"] ||
            row["NOMBRE"];
          const env =
            row["ENVASE"] || row["TALLE"] || row["VARIANTE"] || row["MACETA"];
          const cant = row["CANTIDAD"] || row["CANT"];
          const precio =
            row["PRECIO UNITARIO"] || row["COSTO"] || row["PRECIO"];

          if (!desc) {
            console.warn(`Fila ${index} omitida por no tener descripción`, row);
            return null;
          }

          const parseNumber = (val: string | number | undefined) => {
            if (typeof val === "number") return val;
            if (!val) return 0;
            return Number(
              val
                .toString()
                .replaceAll(/[^0-9,-]+/g, "")
                .replace(",", "."),
            );
          };

          return {
            raw_nombre: String(desc),
            raw_variante: String(env || "Unico"),
            cantidad: Math.max(0, Number.parseInt(String(cant)) || 0),
            precio_costo: Math.max(0, parseNumber(precio)),
          };
        })
        .filter((item): item is RawOrderItem => item !== null);

      if (mappedItems.length === 0) {
        throw new Error(
          "No se detectaron columnas válidas (DESCRIPCIÓN, ENVASE, CANTIDAD, PRECIO UNITARIO).",
        );
      }

      const result = await procesarPedidoAction(proveedor, mappedItems);

      if (result.success) {
        toast.success("Pedido pre-cargado. Redirigiendo a Conciliación...");
        setIsOpen(false);
        router.push(`/compras/merge/${result.ordenId}`);
      } else {
        throw new Error(result.error || "Error en el servidor");
      }
    } catch (error: unknown) {
      // 💡 5. Tipamos el catch con 'unknown' e instanciamos el Error
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al procesar el archivo.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="hidden sm:flex h-10 border-border/60 bg-white shadow-sm hover:bg-muted transition-colors font-medium cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Importar Pedido
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            Importar Remito / Pedido
          </DialogTitle>
          <DialogDescription>
            Sube el archivo Excel o CSV enviado por el proveedor. El sistema
            detectará las plantas nuevas y los cambios de precio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Ej. Distribuidora Fabbro"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-3">
            <Label>Archivo (.xlsx, .csv)</Label>
            <Label
              htmlFor="archivo_excel"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
                isProcessing
                  ? "bg-muted/50 border-border cursor-not-allowed"
                  : "bg-blue-50/50 border-blue-200 hover:bg-blue-50 cursor-pointer"
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-8 h-8 mb-3 text-blue-500 animate-spin" />
                    <p className="text-sm font-semibold text-blue-600">
                      Procesando y emparejando...
                    </p>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-8 h-8 mb-3 text-blue-400" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-blue-600">
                        Haz clic para subir
                      </span>{" "}
                      el Excel
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Debe contener columnas: Descripción, Envase, Cantidad,
                      Precio Unitario
                    </p>
                  </>
                )}
              </div>
              <Input
                id="archivo_excel"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </Label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
