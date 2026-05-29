export interface Insight {
  id: string;
  type: "danger" | "warning" | "success" | "info";
  title: string;
  message: string;
  actionLabel?: string;
  href?: string;
  priority: number; // Define el orden de aparición (100 = Máxima urgencia)
}

// Interfaz adaptada a lo que ya retorna tu getDashboardMetrics
export interface AdvisorMetrics {
  ingresos: number;
  ordenes: number;
  unidadesVendidas: number; // <-- Propiedad agregada para corregir el error TS
  gananciaBrutaVentas: number;
  gananciaNeta: number; // Ex Resultado Operativo Estimado
  totalEgresos: number;
  costoPerdidoBajas: number;
  unidadesBajas: number;
  margenPorcentaje: number;
  ticketPromedio: number;
  stockValorizadoCosto: number;
  stockTotalUnidades: number;
  productosCriticos: number;
  productosSinMovimiento: any[];
  topProductos: { nombre: string; unidades: number; ganancia: number }[];
  topProductosRentables: {
    nombre: string;
    unidades: number;
    ganancia: number;
  }[];
  peoresProductosRentables?: {
    nombre: string;
    unidades: number;
    ganancia: number;
  }[];
  ventasPorDia: { label: string; value: number }[];
  ventasPorCategoria: { label: string; value: number }[];
}

export function getAdvisorInsights(metrics: AdvisorMetrics): Insight[] {
  const insights: Insight[] = [];

  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  // --- REGLA DE CONFIANZA (Onboarding) ---
  // Si no hay suficientes datos en el periodo, nos abstenemos de dar consejos erróneos.
  if (metrics.ordenes < 3) {
    return [
      {
        id: "onboarding",
        type: "info",
        priority: 100,
        title: "Recopilando datos...",
        message:
          "El Advisor necesita al menos 3 ventas en este período para analizar el comportamiento de tu negocio y darte recomendaciones precisas.",
      },
    ];
  }

  /* =========================================================================
     1. ALERTAS GRAVES (Action Required) - Prioridad 80 a 100
     ========================================================================= */

  // 1. Margen Operativo Negativo
  if (metrics.margenPorcentaje < 0) {
    insights.push({
      id: "margin_negative",
      type: "danger",
      priority: 100,
      title: "Alerta de Rentabilidad",
      message: `Tu margen operativo está en rojo (${metrics.margenPorcentaje.toFixed(1)}%). Tus gastos superan tus ganancias brutas. Revisa urgente la caja o ajusta tus precios.`,
      actionLabel: "Analizar Caja",
      href: "/caja",
    });
  }

  // 2. Bajas Elevadas (Fuga de capital > 3% de los ingresos o mayor a $20k)
  const porcentajeBajas =
    metrics.ingresos > 0
      ? (metrics.costoPerdidoBajas / metrics.ingresos) * 100
      : 0;
  if (porcentajeBajas > 3 || metrics.costoPerdidoBajas > 20000) {
    insights.push({
      id: "high_shrinkage",
      type: "danger",
      priority: 95,
      title: "Fuga de Capital en Bajas",
      message: `Has perdido ${formatter.format(metrics.costoPerdidoBajas)} en productos dados de baja (${metrics.unidadesBajas} u.). Esto afecta directamente tu bolsillo limpio.`,
      actionLabel: "Ver historial",
      href: "/reportes", // O "/stock/bajas"
    });
  }

  // 3. Egresos Operativos Altos (Si los gastos son más del 40% de la ganancia bruta)
  const proporcionGastos =
    metrics.gananciaBrutaVentas > 0
      ? (metrics.totalEgresos / metrics.gananciaBrutaVentas) * 100
      : 0;
  if (proporcionGastos > 40 && metrics.totalEgresos > 10000) {
    insights.push({
      id: "high_expenses",
      type: "warning",
      priority: 90,
      title: "Egresos Elevados",
      message: `Tus gastos operativos consumen el ${proporcionGastos.toFixed(0)}% de tu ganancia bruta. Audita en qué se está yendo el efectivo físico.`,
      actionLabel: "Revisar Caja",
      href: "/caja",
    });
  }

  // 4. Stock Crítico
  if (metrics.productosCriticos > 0) {
    insights.push({
      id: "stock_critical",
      type: "danger",
      priority: 85,
      title: "Riesgo de Quiebre",
      message: `Tienes ${metrics.productosCriticos} productos/variantes con nivel de stock crítico (≤ 3 unidades). Podrías estar perdiendo ventas por falta de mercadería.`,
      actionLabel: "Reponer Stock",
      href: "/stock",
    });
  }

  /* =========================================================================
     2. ADVERTENCIAS OPERATIVAS - Prioridad 50 a 79
     ========================================================================= */

  // 5. Capital Inmovilizado Alto (Si hay mucha plata frenada sin venderse)
  // Definimos "Alto" si el stock valorizado es 5 veces mayor a los ingresos del periodo
  if (
    metrics.ingresos > 0 &&
    metrics.stockValorizadoCosto > metrics.ingresos * 5
  ) {
    insights.push({
      id: "capital_stuck",
      type: "warning",
      priority: 75,
      title: "Capital Inmovilizado",
      message: `Tienes ${formatter.format(metrics.stockValorizadoCosto)} frenados en stock. Hay mucha mercadería y poca rotación en este período.`,
    });
  }

  // 6. Mucha rotación concentrada en pocos productos (Dependencia)
  if (metrics.topProductos.length > 0) {
    const ventasDelTop1 = metrics.topProductos[0]?.unidades || 0;
    if (ventasDelTop1 > metrics.unidadesVendidas * 0.4) {
      // El top 1 representa el 40% del total
      insights.push({
        id: "high_dependency",
        type: "warning",
        priority: 70,
        title: "Dependencia de Catálogo",
        message: `El 40% de tu volumen de ventas depende exclusivamente de "${metrics.topProductos[0].nombre}". Intenta promocionar otras categorías para diversificar el riesgo.`,
      });
    }
  }

  // 7. Productos con stock pero sin movimiento
  if (metrics.productosSinMovimiento.length > 3) {
    insights.push({
      id: "no_movement",
      type: "warning",
      priority: 65,
      title: "Inventario Estancado",
      message: `Tienes ${metrics.productosSinMovimiento.length} productos con stock que no registran ventas. Considera armar un combo o descuento temporal para liquidarlos.`,
    });
  }

  /* =========================================================================
     3. OPORTUNIDADES COMERCIALES - Prioridad 30 a 49
     ========================================================================= */

  // 8. Oportunidad de Upselling (Si el ticket es bajo en un negocio con muchas ventas)
  if (
    metrics.ticketPromedio > 0 &&
    metrics.ticketPromedio < 5000 &&
    metrics.ordenes > 10
  ) {
    insights.push({
      id: "upselling",
      type: "info",
      priority: 45,
      title: "Oportunidad de Upselling",
      message: `Tu ticket promedio está en ${formatter.format(metrics.ticketPromedio)}. Si le ofreces un accesorio barato a cada cliente en el mostrador para subir este ticket solo un 15%, tus ganancias crecerán sin necesitar clientes nuevos.`,
    });
  }

  // 9. Producto Estrella con rentabilidad destacada
  if (
    metrics.topProductosRentables.length > 0 &&
    metrics.topProductosRentables[0].ganancia > 0
  ) {
    const top = metrics.topProductosRentables[0];
    insights.push({
      id: "top_profitable",
      type: "success",
      priority: 40,
      title: "Producto Estrella",
      message: `"${top.nombre}" es tu producto más rentable (te dejó +${formatter.format(top.ganancia)} limpios). Dale prioridad en el escaparate o publícalo más seguido.`,
    });
  }

  // 10. Día fuerte de ventas
  if (metrics.ventasPorDia && metrics.ventasPorDia.length > 0) {
    const bestDay = metrics.ventasPorDia[0];
    if (bestDay.value > metrics.ingresos * 0.3) {
      // Representa el 30% de los ingresos
      insights.push({
        id: "best_day",
        type: "info",
        priority: 35,
        title: `Día Pico: ${bestDay.label}`,
        message: `Históricamente, los ${bestDay.label}s concentran tu mayor volumen de facturación. Asegura personal, stock y cambio en la caja desde la mañana.`,
      });
    }
  }

  /* =========================================================================
     4. FELICITACIONES (Señales Positivas) - Prioridad 1 a 29
     ========================================================================= */

  // Solo felicitamos si NO hay alertas graves o advertencias, para no "tapar" el fuego con confeti.
  const hasCriticalWarnings = insights.some(
    (i) => i.type === "danger" || i.type === "warning",
  );

  if (!hasCriticalWarnings) {
    if (metrics.margenPorcentaje > 30) {
      insights.push({
        id: "good_margin",
        type: "success",
        priority: 20,
        title: "Rentabilidad Saludable",
        message: `¡Excelente trabajo! Tu margen operativo está muy sano (${metrics.margenPorcentaje.toFixed(1)}%). Estás controlando muy bien tus gastos.`,
      });
    }

    if (porcentajeBajas === 0) {
      insights.push({
        id: "no_shrinkage",
        type: "success",
        priority: 15,
        title: "Inventario Perfecto",
        message:
          "No registras pérdidas por bajas ni bajas en este período. ¡Sigue cuidando así la mercadería!",
      });
    }
  }

  // --- FILTRADO FINAL ---
  // Ordenamos de mayor prioridad a menor, y cortamos el array para que el dueño
  // solo lea los 3 consejos MÁS importantes, evitando la fatiga de información.
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
