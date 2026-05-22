import { getStockAction } from "@/features/stock/actions/get-product";
import { StockView } from "@/features/stock/ui/stock-view";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const { data: productos, error } = await getStockAction();

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
      {error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-center font-medium">
          Ocurrió un error al cargar el inventario. Por favor, intenta
          nuevamente más tarde.
        </div>
      ) : (
        <StockView productos={productos || []} />
      )}
    </div>
  );
}
