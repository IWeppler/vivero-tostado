import { getVentasAction } from "@/features/sales/actions/get-sales";
import { getStockAction } from "@/features/stock/actions/get-product";
import { RegistrarVentaModal } from "@/features/sales/ui/create-sale-modal";
import { CrearProductoModal } from "@/features/stock/ui/create-modal";
import { EgresoModal } from "@/features/caja/ui/egreso-modal";
import { createClient } from "@/shared/config/supabase/server";
import { cookies } from "next/headers";
import { getDashboardMetrics } from "@/features/dashboard/lib/get-dashboard-metrics";
import { getSupabaseRelation } from "@/entities/ventas/types";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  Wallet,
  DropletOff,
  Flame,
  Trophy,
  Package,
} from "lucide-react";
import { Button } from "@/shared/ui/button";

export const dynamic = "force-dynamic";

const formatearMoneda = (monto: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
};

const formatearHora = (fechaString: string) => {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaString));
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Traemos los datos
  const [
    ventasResponse,
    productosResponse,
    egresosResponse,
    bajasResponse,
    turnoResponse,
  ] = await Promise.all([
    getVentasAction(),
    getStockAction(),
    supabase.from("egresos").select("id, concepto, monto, fecha"),
    supabase
      .from("bajas")
      .select("id, producto_id, cantidad, creado_en, estado"),
    supabase
      .from("turnos_caja")
      .select("*")
      .eq("estado", "ABIERTO")
      .order("fecha_apertura", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const ventas = ventasResponse.data || [];
  const productos = productosResponse.data || [];
  const egresos = egresosResponse.data || [];
  const bajas = bajasResponse.data || [];
  const turnoAbierto = turnoResponse.data || null;

  const bajasAprobadas = bajas.filter((b) => b.estado === "APROBADA");
  const cantidadBajasPendientes = bajas.filter(
    (b) => b.estado === "PENDIENTE",
  ).length;

  // 2. Métricas de HOY
  const metricasHoy = getDashboardMetrics(
    ventas,
    productos,
    egresos,
    bajasAprobadas,
    "hoy",
  );

  // 3. Cálculos de AYER (Para comparativas de crecimiento)
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  const ventasAyer = ventas.filter((v) => {
    const fechaVenta = new Date(v.fecha_venta);
    return (
      fechaVenta.getDate() === ayer.getDate() &&
      fechaVenta.getMonth() === ayer.getMonth() &&
      fechaVenta.getFullYear() === ayer.getFullYear()
    );
  });

  const ingresosAyer = ventasAyer.reduce((acc, v) => acc + Number(v.total), 0);
  const unidadesAyer = ventasAyer.reduce(
    (acc, v) => acc + Number(v.cantidad),
    0,
  );

  const crecimientoIngresos =
    ingresosAyer > 0
      ? ((metricasHoy.ingresos - ingresosAyer) / ingresosAyer) * 100
      : 100;
  const crecimientoUnidades =
    unidadesAyer > 0
      ? ((metricasHoy.unidadesVendidas - unidadesAyer) / unidadesAyer) * 100
      : 100;

  // 4. Últimas ventas para el Feed
  const ventasDeHoy = ventas.filter((v) => {
    const f = new Date(v.fecha_venta);
    return (
      f.getDate() === hoy.getDate() &&
      f.getMonth() === hoy.getMonth() &&
      f.getFullYear() === hoy.getFullYear()
    );
  });
  const ultimasVentas = ventasDeHoy.slice(0, 4);

  // 5. Cálculos de Caja Resumida (Efectivo Esperado)
  let efectivoEsperado = 0;
  let egresosTurno = 0;
  if (turnoAbierto) {
    const ventasTurnoEfectivo = ventas.filter(
      (v) =>
        new Date(v.fecha_venta) >= new Date(turnoAbierto.fecha_apertura) &&
        v.metodo_pago === "EFECTIVO",
    );
    const egresosTurnoEfectivo = egresos.filter(
      (e) => new Date(e.fecha) >= new Date(turnoAbierto.fecha_apertura),
    );

    const ingresosTurnoEf = ventasTurnoEfectivo.reduce(
      (acc, v) => acc + Number(v.total),
      0,
    );
    egresosTurno = egresosTurnoEfectivo.reduce(
      (acc, e) => acc + Number(e.monto),
      0,
    );

    efectivoEsperado =
      Number(turnoAbierto.monto_inicial) + ingresosTurnoEf - egresosTurno;
  }

  // 6. Bajas de Hoy
  const bajasHoy = bajasAprobadas.filter((b) => {
    const f = new Date(b.creado_en);
    return (
      f.getDate() === hoy.getDate() &&
      f.getMonth() === hoy.getMonth() &&
      f.getFullYear() === hoy.getFullYear()
    );
  });
  const costoBajasHoy = bajasHoy.reduce((acc, b) => {
    const p = productos.find((prod) => prod.id === b.producto_id);
    return acc + Number(b.cantidad) * Number(p?.precio_costo || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* HEADER & ACCIONES RÁPIDAS */}
      <div>
        {/* <div className="mb-6">
          <h1 className="text-2xl font-bold">Operación de Hoy</h1>
          <p className="text-muted-foreground">
            Bienvenido al puesto de mando. Resumen del negocio vivo.
          </p>
        </div> */}

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <EgresoModal />
          <CrearProductoModal />
          <div className="w-full sm:w-auto [&>button]:w-full [&>button]:h-10 [&>button]">
            <RegistrarVentaModal productos={productos} />
          </div>
        </div>
      </div>

      {/* 💰 CARDS PRINCIPALES (KPIs Diarios) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ingresos Brutos */}
        <div className="bg-white p-5 rounded-2xl border border-border flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-muted-foreground">
              Ingresos brutos de hoy
            </div>
            <div
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${crecimientoIngresos >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
            >
              {crecimientoIngresos >= 0 ? "+" : ""}
              {crecimientoIngresos.toFixed(0)}% vs ayer
            </div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-foreground">
              {formatearMoneda(metricasHoy.ingresos)}
            </div>
            <div className="text-xs font-medium text-emerald-600 mt-1">
              Neto estimado: {formatearMoneda(metricasHoy.gananciaNeta)}
            </div>
          </div>
        </div>

        {/* Card 2: Unidades Vendidas */}
        <div className="bg-white p-5 rounded-2xl border border-border flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-muted-foreground">
              Unidades vendidas
            </div>
            <div
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${crecimientoUnidades >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
            >
              {crecimientoUnidades >= 0 ? "+" : ""}
              {crecimientoUnidades.toFixed(0)}% vs ayer
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">
              {metricasHoy.unidadesVendidas}
            </div>
            <div className="text-xs font-medium text-muted-foreground mt-1">
              Artículos entregados hoy
            </div>
          </div>
        </div>

        {/* Card 3: Tickets Emitidos */}
        <div className="bg-white p-5 rounded-2xl border border-border flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-muted-foreground">
              Tickets emitidos
            </div>
            <Receipt className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">
              {metricasHoy.ordenes}
            </div>
            <div className="text-xs font-medium text-blue-600 mt-1">
              Ticket promedio: {formatearMoneda(metricasHoy.ticketPromedio)}
            </div>
          </div>
        </div>

        {/* Card 4: Ganancia Estimada */}
        <div className="bg-emerald-600 text-white p-5 rounded-2xl border border-emerald-700 flex flex-col justify-between relative overflow-hidden">
          <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500 opacity-20 pointer-events-none" />
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="text-sm font-semibold text-emerald-100">
              Ganancia estimada
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold">
              {formatearMoneda(metricasHoy.gananciaBrutaVentas)}
            </div>
            <div className="text-xs font-medium text-emerald-100 mt-1">
              Margen: {metricasHoy.margenPorcentaje.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 🏢 BLOQUES OPERATIVOS (Alertas y Caja) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Caja Resumida */}
        <div className="bg-white p-5 rounded-2xl border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Caja actual</h3>
          </div>
          {turnoAbierto ? (
            <>
              <div className="space-y-1 mb-4">
                <p className="text-xs text-muted-foreground font-medium">
                  Abierta desde {formatearHora(turnoAbierto.fecha_apertura)}
                </p>
                <p className="text-xl font-bold text-foreground">
                  Efectivo esperado: {formatearMoneda(efectivoEsperado)}
                </p>
                <p className="text-xs text-rose-600 font-medium">
                  Egresos del día: {formatearMoneda(egresosTurno)}
                </p>
              </div>
              <Link href="/caja">
                <Button variant="outline" className="w-full text-xs h-8">
                  Ver caja
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center py-4">
                <p className="text-sm text-muted-foreground font-medium">
                  La caja está cerrada
                </p>
              </div>
              <Link href="/caja">
                <Button className="w-full text-xs h-8 bg-primary hover:bg-primary/80 text-white">
                  Abrir turno
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Alertas de Stock */}
        <div className="bg-white p-5 rounded-2xl border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-foreground">Alertas de stock</h3>
          </div>
          <div className="space-y-2 mb-4 flex-1">
            {metricasHoy.productosCriticos > 0 ? (
              <div className="bg-orange-50 text-orange-800 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 border border-orange-100">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                {metricasHoy.productosCriticos} productos con stock bajo (≤ 3)
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic pt-2">
                Inventario saludable. Todo en orden.
              </p>
            )}
            {cantidadBajasPendientes > 0 && (
              <div className="bg-amber-50 text-amber-800 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 border border-amber-100">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {cantidadBajasPendientes} bajas pendientes de revisión
              </div>
            )}
          </div>
          <Link href="/stock">
            <Button variant="outline" className="w-full text-xs h-8">
              Ir al inventario
            </Button>
          </Link>
        </div>

        {/* Bajas del Día */}
        <div className="bg-white p-5 rounded-2xl border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <DropletOff className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-foreground">Bajas de hoy</h3>
          </div>
          <div className="flex-1">
            {bajasHoy.length > 0 ? (
              <div className="space-y-1 mt-2">
                <p className="text-xl font-bold text-rose-600">
                  {formatearMoneda(costoBajasHoy)}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Pérdida operativa registrada hoy
                </p>
                <p className="text-xs text-rose-800/70 font-medium mt-2">
                  ({bajasHoy.reduce((acc, b) => acc + b.cantidad, 0)} unidades
                  afectadas)
                </p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">
                  No se registraron bajas hoy. ¡Excelente!
                </p>
              </div>
            )}
          </div>
          {bajasHoy.length > 0 && (
            <Link href="/stock/bajas" className="mt-4">
              <Button
                variant="outline"
                className="w-full text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Ver detalle
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 🏆 RANKINGS Y FEED (Lo que se mueve AHORA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Rotación HOY */}
        <div className="bg-white rounded-2xl border border-border flex flex-col">
          <div className="p-5 border-b border-border/50">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> Mayor Rotación Hoy
            </h2>
          </div>
          <div className="flex-1 p-2">
            {metricasHoy.topProductos.length > 0 ? (
              <div className="space-y-1">
                {metricasHoy.topProductos.slice(0, 4).map((producto, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-bold text-muted-foreground w-4">
                        {idx + 1}.
                      </span>
                      <p
                        className="font-semibold text-sm text-foreground truncate"
                        title={producto.nombre}
                      >
                        {producto.nombre}
                      </p>
                    </div>
                    <span className="font-bold text-sm bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {producto.unidades} u.
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Esperando ventas...
              </div>
            )}
          </div>
        </div>

        {/* Top Rentabilidad HOY */}
        <div className="bg-white rounded-2xl border border-border flex flex-col">
          <div className="p-5 border-b border-border/50">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" /> Mayor Rentabilidad
              Hoy
            </h2>
          </div>
          <div className="flex-1 p-2">
            {metricasHoy.topProductosRentables.length > 0 ? (
              <div className="space-y-1">
                {metricasHoy.topProductosRentables
                  .slice(0, 4)
                  .map((producto, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xs font-bold text-muted-foreground w-4">
                          {idx + 1}.
                        </span>
                        <p
                          className="font-semibold text-sm text-foreground truncate"
                          title={producto.nombre}
                        >
                          {producto.nombre}
                        </p>
                      </div>
                      <span className="font-bold text-sm text-emerald-600 whitespace-nowrap">
                        +{formatearMoneda(producto.ganancia)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Esperando ventas...
              </div>
            )}
          </div>
        </div>

        {/* FEED DE ÚLTIMAS VENTAS */}
        <div className="bg-white rounded-2xl border border-border flex flex-col">
          <div className="p-5 border-b border-border/50 flex justify-between items-center">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" /> Últimas Ventas
            </h2>
            <Link
              href="/ventas"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Ver todas
            </Link>
          </div>
          <div className="flex-1 p-2">
            {ultimasVentas.length > 0 ? (
              <div className="space-y-1">
                {ultimasVentas.map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-md hidden sm:block">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground line-clamp-1">
                          {getSupabaseRelation(
                            venta.ventas_items?.[0]?.producto,
                          )?.nombre || "Producto eliminado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatearHora(venta.fecha_venta)} • {venta.cantidad}u
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">
                        {formatearMoneda(venta.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay ventas recientes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
