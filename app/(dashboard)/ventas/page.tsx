import { getVentasAction } from "@/features/sales/actions/get-sales";
import { getStockAction } from "@/features/stock/actions/get-product";
import { VentasTable } from "@/features/sales/ui/sale-table";
import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Obtener su rol de la tabla perfiles
  let userRole = "VENDEDOR";
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    if (perfil) userRole = perfil.rol;
  }

  // 3. Cargar las ventas y los productos
  const [ventasResponse, productosResponse] = await Promise.all([
    getVentasAction(),
    getStockAction(),
  ]);

  const ventas = ventasResponse.data;
  const error = ventasResponse.error;
  const productos = productosResponse.data;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      ) : (
        <VentasTable
          ventas={ventas || []}
          productos={productos || []}
          userRole={userRole}
        />
      )}
    </div>
  );
}
