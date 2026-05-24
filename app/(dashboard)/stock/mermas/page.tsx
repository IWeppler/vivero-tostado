import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// --- ACTIONS INTERNOS ---
// (Es válido poner actions en la misma página si son exclusivos de esta vista)

async function aprobarMerma(
  mermaId: string,
  productoId: string,
  variante: string,
  cantidadA_restar: number,
) {
  "use server";
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Obtener el stock actual de esa variante
  const { data: stockItem } = await supabase
    .from("productos_stock")
    .select("id, cantidad")
    .eq("producto_id", productoId)
    .eq("variante", variante)
    .single();

  if (!stockItem) return;

  // 2. Restar el stock
  const nuevoStock = Math.max(0, stockItem.cantidad - cantidadA_restar);
  await supabase
    .from("productos_stock")
    .update({ cantidad: nuevoStock })
    .eq("id", stockItem.id);

  // 3. Cambiar el estado de la merma a APROBADA
  await supabase
    .from("mermas")
    .update({ estado: "APROBADA" })
    .eq("id", mermaId);

  revalidatePath("/stock");
  revalidatePath("/stock/mermas");
}

async function rechazarMerma(mermaId: string) {
  "use server";
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase
    .from("mermas")
    .update({ estado: "RECHAZADA" })
    .eq("id", mermaId);

  revalidatePath("/stock/mermas");
}

// --- PÁGINA ---

export default async function MermasPage() {
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
    redirect("/stock"); // Si un vendedor se cuela por URL, lo pateamos al inventario
  }

  // 2. Traer las mermas pendientes y el historial
  const { data: mermas, error } = await supabase
    .from("mermas")
    .select(
      `
      id,
      variante,
      cantidad,
      motivo,
      estado,
      creado_en,
      producto_id,
      productos ( nombre ),
      perfiles ( nombre )
    `,
    )
    .order("creado_en", { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">Error cargando mermas.</div>
    );
  }

  const pendientes = mermas?.filter((m) => m.estado === "PENDIENTE") || [];
  const historial = mermas?.filter((m) => m.estado !== "PENDIENTE") || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border pb-4">
        <Link href="/stock" className="shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bajas de Inventario
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aprueba o rechaza los reportes de plantas dañadas o faltantes.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Pendientes de Revisión ({pendientes.length})
        </h2>

        {pendientes.length === 0 ? (
          <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            No hay reportes de bajas pendientes de revisión. ¡Excelente!
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendientes.map((merma) => (
              <div
                key={merma.id}
                className="bg-white border border-amber-200 rounded-xl p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-foreground truncate max-w-[180px]">
                      {/* @ts-ignore */}
                      {merma.productos?.nombre || "Producto Eliminado"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Variante: {merma.variante}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    -{merma.cantidad}
                  </Badge>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm mb-4">
                  <p className="font-medium text-foreground text-xs mb-1 uppercase tracking-wider">
                    Motivo Reportado
                  </p>
                  <p className="text-muted-foreground">{merma.motivo}</p>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    {/* @ts-ignore */}
                    Reportado por: {merma.perfiles?.nombre || "Usuario"} •{" "}
                    {new Date(merma.creado_en).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>

                <div className="flex gap-2 w-full">
                  <form
                    action={rechazarMerma.bind(null, merma.id)}
                    className="flex-1"
                  >
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                    >
                      Rechazar
                    </Button>
                  </form>
                  <form
                    action={aprobarMerma.bind(
                      null,
                      merma.id,
                      merma.producto_id,
                      merma.variante,
                      merma.cantidad,
                    )}
                    className="flex-1"
                  >
                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Aprobar
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {historial.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Historial de Mermas
          </h2>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historial.slice(0, 10).map((merma) => (
                  <tr key={merma.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(merma.creado_en).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {/* @ts-ignore */}
                      {merma.productos?.nombre}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({merma.variante})
                      </span>
                      <span className="ml-2 text-rose-500 font-bold">
                        -{merma.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {merma.motivo}
                    </td>
                    <td className="px-4 py-3">
                      {merma.estado === "APROBADA" ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Aprobada
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-200"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Rechazada
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
