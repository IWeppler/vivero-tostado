import { Venta } from "@/entities/ventas/types";
import { Producto } from "@/entities/productos/types";

export type PeriodoDashboard =
  | "mes"
  | "trimestre"
  | "semestre"
  | "anio"
  | "historico";

export function getDashboardMetrics(
  ventas: Venta[],
  productos: Producto[],
  egresos: any[] = [],
  mermas: any[] = [],
  periodo: PeriodoDashboard = "mes",
) {
  const now = new Date();
  let startDate = new Date(0);

  if (periodo === "mes") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (periodo === "trimestre") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  } else if (periodo === "semestre") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  } else if (periodo === "anio") {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }

  // 1. Contextos Temporales
  const ventasFiltradas =
    periodo === "historico"
      ? ventas
      : ventas.filter((v) => new Date(v.fecha_venta) >= startDate);

  const egresosFiltrados =
    periodo === "historico"
      ? egresos
      : egresos.filter((e) => new Date(e.fecha) >= startDate);

  const mermasFiltradas =
    periodo === "historico"
      ? mermas
      : mermas.filter((m) => new Date(m.creado_en) >= startDate);

  // --- CORE KPIs FINANCIEROS ---
  let ingresosBrutos = 0;
  let gananciaBrutaVentas = 0; // Ventas - Costo de Plantas
  let unidadesVendidas = 0;

  ventasFiltradas.forEach((v) => {
    const total = Number(v.total);
    const cantidad = Number(v.cantidad);
    const precio = Number(v.precio_unitario);
    const costoUnitario = Number(v.precio_costo ?? 0);

    ingresosBrutos += total;
    unidadesVendidas += cantidad;

    if (costoUnitario > 0) {
      gananciaBrutaVentas += (precio - costoUnitario) * cantidad;
    }
  });

  const ordenes = ventasFiltradas.length;
  const ticketPromedio = ordenes > 0 ? ingresosBrutos / ordenes : 0;

  // --- EGRESOS Y MERMAS (Nuevas Fugas de Capital) ---
  let totalEgresos = 0;
  egresosFiltrados.forEach((e) => {
    totalEgresos += Number(e.monto || 0);
  });

  let costoPerdidoMermas = 0;
  let unidadesMermadas = 0;
  mermasFiltradas.forEach((m) => {
    const productoAfectado = productos.find((p) => p.id === m.producto_id);
    const costo = Number(productoAfectado?.precio_costo ?? 0);
    const cantidad = Number(m.cantidad || 0);

    costoPerdidoMermas += cantidad * costo;
    unidadesMermadas += cantidad;
  });

  // Ganancia Neta Real = Ganancia Bruta (Ventas - Costos) - Gastos Operativos (Egresos)
  const gananciaNeta = gananciaBrutaVentas - totalEgresos;

  // Margen de ganancia neta en porcentaje sobre el ingreso
  const margenPorcentaje =
    ingresosBrutos > 0 ? (gananciaNeta / ingresosBrutos) * 100 : 0;

  // --- OPERATIVO ---
  let stockTotalUnidades = 0;
  let stockValorizadoCosto = 0;
  let productosCriticos = 0;

  productos.forEach((pro) => {
    const costo = Number(pro.precio_costo ?? 0);

    pro.stock?.forEach((s) => {
      const cantidadStock = Number(s.cantidad);
      stockTotalUnidades += cantidadStock;
      stockValorizadoCosto += cantidadStock * costo;

      if (cantidadStock > 0 && cantidadStock <= 3) {
        productosCriticos++;
      }
    });
  });

  // --- INTELIGENCIA DE CATÁLOGO ---
  const ventasPorProducto = ventasFiltradas.reduce(
    (acc, v) => {
      const id = v.producto_id || "eliminado";
      const total = Number(v.total);
      const cantidad = Number(v.cantidad);
      const precio = Number(v.precio_unitario);
      const costoUnitario = Number(v.precio_costo ?? 0);

      if (!acc[id]) {
        acc[id] = {
          nombre: v.producto ? `${v.producto.nombre}` : "Producto Eliminado",
          ingresos: 0,
          unidades: 0,
          ganancia: 0,
        };
      }

      acc[id].ingresos += total;
      acc[id].unidades += cantidad;

      if (costoUnitario > 0) {
        acc[id].ganancia += (precio - costoUnitario) * cantidad;
      }

      return acc;
    },
    {} as Record<
      string,
      { nombre: string; ingresos: number; unidades: number; ganancia: number }
    >,
  );

  const topProductosUnidades = Object.values(ventasPorProducto)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5);

  const topProductosRentables = Object.values(ventasPorProducto)
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 5);

  return {
    ingresos: ingresosBrutos,
    ordenes,
    unidadesVendidas,
    ticketPromedio,
    gananciaBrutaVentas,
    gananciaNeta,
    totalEgresos,
    costoPerdidoMermas,
    unidadesMermadas,
    margenPorcentaje,
    stockTotalUnidades,
    stockValorizadoCosto,
    productosCriticos,
    topProductos: topProductosUnidades,
    topProductosRentables,
  };
}
