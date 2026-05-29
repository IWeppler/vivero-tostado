import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CajaDashboard } from "@/features/caja/ui/caja-dashboard";
import {
  TurnoCajaHistorial,
  VentaCaja,
  EgresoCaja,
} from "@/entities/caja/types";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verificación de permisos
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (perfil?.rol !== "ADMIN") redirect("/stock");

  // 2. Traemos el historial de turnos completos
  const { data: turnosHistorial } = await supabase
    .from("turnos_caja")
    .select("*, perfiles(nombre)")
    .order("fecha_apertura", { ascending: false })
    .limit(30);

  const turnos = (turnosHistorial || []) as TurnoCajaHistorial[];

  // 3. Identificamos si hay uno abierto
  const turnoAbierto = turnos.find((t) => t.estado === "ABIERTO") || null;

  let ventas: VentaCaja[] = [];
  let egresos: EgresoCaja[] = [];

  // 4. Si hay turno abierto, traemos sus movimientos
  if (turnoAbierto) {
    const [ventasRes, egresosRes] = await Promise.all([
      supabase
        .from("ventas")
        .select(
          "id, total, metodo_pago, fecha_venta, perfiles(nombre), ventas_items(producto:productos(nombre))",
        )
        .gte("fecha_venta", turnoAbierto.fecha_apertura)
        .order("fecha_venta", { ascending: false }),
      supabase
        .from("egresos")
        .select("id, concepto, monto, fecha, perfiles(nombre)")
        .gte("fecha", turnoAbierto.fecha_apertura)
        .order("fecha", { ascending: false }),
    ]);

    // Casteamos la respuesta de Supabase a nuestras interfaces fuertes
    ventas = (ventasRes.data || []) as unknown as VentaCaja[];
    egresos = (egresosRes.data || []) as unknown as EgresoCaja[];
  }

  return (
    <div className="space-y-6 mx-auto pb-12">
      <CajaDashboard
        turno={turnoAbierto}
        ventas={ventas}
        egresos={egresos}
        historial={turnos}
      />
    </div>
  );
}
