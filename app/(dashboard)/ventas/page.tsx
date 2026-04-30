import { getVentasAction } from "@/features/sales/actions/get-sales";
import { getStockAction } from "@/features/stock/actions/get-product";
import { VentasTable } from "@/features/sales/ui/sale-table";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const [ventasResponse, productosResponse] = await Promise.all([
    getVentasAction(),
    getStockAction(),
  ]);

  const ventas = ventasResponse.data;
  const error = ventasResponse.error;
  const productos = productosResponse.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Historial de Ventas
          </h1>
          <p className="text-muted-foreground mt-1">
            Revisa el registro de todas las transacciones realizadas.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      ) : (
        <VentasTable ventas={ventas || []} productos={productos || []} />
      )}
    </div>
  );
}
