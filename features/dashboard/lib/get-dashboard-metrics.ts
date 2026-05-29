import { Producto } from "@/entities/productos/types";
import { EgresoCaja } from "@/entities/caja/types";

export type PeriodoDashboard =
  | "hoy"
  | "mes"
  | "trimestre"
  | "semestre"
  | "anio"
  | "historico";

// --- TIPOS ESTRICTOS PARA EL DASHBOARD ---

export interface VentaItemDashboard {
  cantidad: number;
  precio_unitario: number;
  precio_costo?: number;
  variante?: string;
  producto_id?: string;
  producto?:
    | { nombre: string; tipo?: string; imagen_url?: string }
    | { nombre: string; tipo?: string; imagen_url?: string }[]
    | any;
}

export interface VentaDashboard {
  id: string;
  total: number;
  precio_costo?: number;
  cantidad: number;
  fecha_venta: string;
  metodo_pago?: string | null;
  perfiles?: { nombre: string } | { nombre: string }[] | any;
  ventas_items?: VentaItemDashboard[];
  [key: string]: any;
}

export function getDashboardMetrics(
  ventas: VentaDashboard[],
  productos: Producto[],
  egresos: EgresoCaja[] = [],
  bajas: any[] = [],
  periodo: PeriodoDashboard = "mes",
) {
  const now = new Date();
  let startDate = new Date(0);

  if (periodo === "hoy") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (periodo === "mes") {
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

  const bajasFiltradas =
    periodo === "historico"
      ? bajas
      : bajas.filter((m) => new Date(m.creado_en) >= startDate);

  // --- CORE KPIs FINANCIEROS ---
  let ingresosBrutos = 0;
  let costoMercaderiaVendida = 0;
  let gananciaBrutaVentas = 0;
  let unidadesVendidas = 0;

  const catMap = new Map<string, number>();
  const rentabilidadCatMap = new Map<string, number>();
  const metodoPagoMap = new Map<string, number>();
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const diaMap = new Map<string, number>();
  diasSemana.forEach((d) => diaMap.set(d, 0));

  const productosConVentas = new Set<string>();
  const ventasPorProducto: Record<
    string,
    { nombre: string; ingresos: number; unidades: number; ganancia: number }
  > = {};

  // 2. Escaneamos la Cabecera de la Venta (Tickets)
  ventasFiltradas.forEach((v) => {
    const totalTicket = Number(v.total || 0);
    const costoTicket = Number(v.precio_costo || 0);

    ingresosBrutos += totalTicket;
    costoMercaderiaVendida += costoTicket;
    gananciaBrutaVentas += totalTicket - costoTicket;

    // Métodos de Pago
    const metodo = v.metodo_pago || "EFECTIVO";
    metodoPagoMap.set(metodo, (metodoPagoMap.get(metodo) || 0) + totalTicket);

    // Días de mayor venta
    const date = new Date(v.fecha_venta);
    const diaName = diasSemana[date.getDay()];
    diaMap.set(diaName, (diaMap.get(diaName) || 0) + totalTicket);

    // 3. Escaneamos los items dentro de cada Ticket (v.ventas_items)
    const items = v.ventas_items || [];

    items.forEach((item: VentaItemDashboard) => {
      const cantidadItem = Number(item.cantidad || 0);
      const precioUnitario = Number(item.precio_unitario || 0);
      const costoUnitario = Number(item.precio_costo || 0);

      const itemIngreso = precioUnitario * cantidadItem;
      const itemGanancia = (precioUnitario - costoUnitario) * cantidadItem;

      unidadesVendidas += cantidadItem;

      // Supabase a veces anida los joins 1:1 en arrays, esto lo previene extrayendo el primer elemento
      const prodData = Array.isArray(item.producto)
        ? item.producto[0]
        : item.producto;

      // Categorías (Ingresos y Rentabilidad)
      const catOriginal = prodData?.tipo || "Sin categoría";
      const cat = catOriginal.charAt(0).toUpperCase() + catOriginal.slice(1);

      catMap.set(cat, (catMap.get(cat) || 0) + itemIngreso);
      rentabilidadCatMap.set(
        cat,
        (rentabilidadCatMap.get(cat) || 0) + itemGanancia,
      );

      // Ranking de Productos
      if (item.producto_id) productosConVentas.add(item.producto_id);

      const pId = item.producto_id || "eliminado";
      if (!ventasPorProducto[pId]) {
        ventasPorProducto[pId] = {
          nombre: prodData ? `${prodData.nombre}` : "Producto Eliminado",
          ingresos: 0,
          unidades: 0,
          ganancia: 0,
        };
      }
      ventasPorProducto[pId].ingresos += itemIngreso;
      ventasPorProducto[pId].unidades += cantidadItem;
      ventasPorProducto[pId].ganancia += itemGanancia;
    });
  });

  const ordenes = ventasFiltradas.length;
  const ticketPromedio = ordenes > 0 ? ingresosBrutos / ordenes : 0;

  // --- EGRESOS Y BAJAS ---
  let totalEgresos = 0;
  egresosFiltrados.forEach((e) => {
    totalEgresos += Number(e.monto || 0);
  });

  let costoPerdidoBajas = 0;
  let unidadesBajas = 0;
  const bajasMotivoMap = new Map<string, number>();

  bajasFiltradas.forEach((b) => {
    const productoAfectado = productos.find((p) => p.id === b.producto_id);
    const costo = Number(productoAfectado?.precio_costo ?? 0);
    const cantidad = Number(b.cantidad || 0);
    const costoTotalBaja = cantidad * costo;

    costoPerdidoBajas += costoTotalBaja;
    unidadesBajas += cantidad;

    const motivo = b.motivo || "No especificado";
    bajasMotivoMap.set(
      motivo,
      (bajasMotivoMap.get(motivo) || 0) + costoTotalBaja,
    );
  });

  // Cálculo del Resultado Operativo (Ganancia Neta)
  const resultadoOperativo = gananciaBrutaVentas - totalEgresos;
  const margenPorcentaje =
    ingresosBrutos > 0 ? (resultadoOperativo / ingresosBrutos) * 100 : 0;

  // --- OPERATIVO Y STOCK ---
  let stockTotalUnidades = 0;
  let stockValorizadoCosto = 0;
  let productosCriticos = 0;
  const stockCriticoDetallado: any[] = [];
  const productosSinMovimiento: Producto[] = [];

  productos.forEach((pro) => {
    const costo = Number(pro.precio_costo ?? 0);
    let stockTotalProducto = 0;

    pro.stock?.forEach((s) => {
      const cantidadStock = Number(s.cantidad);
      stockTotalUnidades += cantidadStock;
      stockValorizadoCosto += cantidadStock * costo;
      stockTotalProducto += cantidadStock;

      if (cantidadStock > 0 && cantidadStock <= 3) {
        productosCriticos++;
        stockCriticoDetallado.push({
          nombre: pro.nombre,
          variante: s.variante,
          cantidad: cantidadStock,
        });
      }
    });

    if (stockTotalProducto > 0 && !productosConVentas.has(pro.id)) {
      productosSinMovimiento.push(pro);
    }
  });

  // --- RESULTADOS DE INTELIGENCIA DE CATÁLOGO ---
  const topProductos = Object.values(ventasPorProducto)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

  const topProductosRentables = Object.values(ventasPorProducto)
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 10);

  const peoresProductosRentables = Object.values(ventasPorProducto)
    .filter((p) => p.ganancia > 0)
    .sort((a, b) => a.ganancia - b.ganancia)
    .slice(0, 5);

  // --- FORMATEO FINAL DE GRÁFICOS ---
  const donutData = [
    {
      label: "Costo Mercadería",
      value: costoMercaderiaVendida,
      color: "#f59e0b",
    },
    { label: "Egresos", value: totalEgresos, color: "#f43f5e" },
    {
      label: "Result. Operativo",
      value: resultadoOperativo > 0 ? resultadoOperativo : 0,
      color: "#10b981",
    },
  ];

  const ventasPorCategoria = Array.from(catMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const rentabilidadPorCategoria = Array.from(rentabilidadCatMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const ventasPorDia = Array.from(diaMap.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const ventasPorMetodo = Array.from(metodoPagoMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const bajasPorMotivo = Array.from(bajasMotivoMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return {
    ingresos: ingresosBrutos,
    ordenes,
    unidadesVendidas,
    ticketPromedio,
    gananciaBrutaVentas,
    gananciaNeta: resultadoOperativo,
    totalEgresos,
    costoPerdidoBajas,
    unidadesBajas,
    margenPorcentaje,
    stockTotalUnidades,
    stockValorizadoCosto,
    productosCriticos,
    stockCriticoDetallado,
    productosSinMovimiento,
    topProductos,
    topProductosRentables,
    peoresProductosRentables,
    donutData,
    ventasPorCategoria,
    rentabilidadPorCategoria,
    ventasPorDia,
    ventasPorMetodo,
    bajasPorMotivo,
  };
}
