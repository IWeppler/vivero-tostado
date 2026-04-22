import { getStockAction } from "@/features/stock/actions/get-producto";
import { StockView } from "@/features/stock/ui/stock-view";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { data: productos } = await getStockAction();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Inventario de Productos
          </h1>
          <p className="text-muted-foreground mt-1">
            Acá podés gestionar el stock de los productos.
          </p>
        </div>
      </div>
      <StockView productos={productos || []} />
    </div>
  );
}
