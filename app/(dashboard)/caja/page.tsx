import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CajaDashboard } from "@/features/caja/ui/caja-dashboard";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verificación estricta de Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "ADMIN") {
    redirect("/stock"); // Bloqueamos a los vendedores
  }

  // 2. Traer TODAS las ventas (solo datos necesarios para cálculos)
  const { data: ventas, error: ventasError } = await supabase
    .from("ventas")
    .select(
      "id, total, precio_costo, cantidad, fecha_venta, producto:productos(nombre)",
    )
    .order("fecha_venta", { ascending: false });

  // 3. Traer TODOS los egresos
  const { data: egresos, error: egresosError } = await supabase
    .from("egresos")
    .select("id, concepto, monto, fecha")
    .order("fecha", { ascending: false });

  if (ventasError || egresosError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">
        <h2 className="font-bold text-lg mb-2">
          Error cargando la base de datos
        </h2>
        <p>No se pudo cargar el historial financiero.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Caja y Movimientos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control de ingresos, egresos y cálculo de ganancia real.
          </p>
        </div>
      </div>

      {/* Le pasamos la data al cliente para que pueda filtrarla instantáneamente */}
      <CajaDashboard ventas={ventas || []} egresos={egresos || []} />
    </div>
  );
}
