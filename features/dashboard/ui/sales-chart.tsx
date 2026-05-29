"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { Venta } from "@/entities/ventas/types";

interface SalesChartProps {
  ventas: Venta[];
  periodo: string;
}

export function SalesChart({ ventas, periodo }: Readonly<SalesChartProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = 320; // Altura fija
  const margin = { top: 20, right: 20, bottom: 30, left: 60 };

  // --- 1. Observador de tamaño para hacer el SVG Responsive ---
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // --- 2. Procesamiento Inteligente de Datos ---
  const data = useMemo(() => {
    if (ventas.length === 0) return [];

    const grouped = new Map<
      string,
      { dateObj: Date; label: string; total: number }
    >();

    ventas.forEach((v) => {
      const date = new Date(v.fecha_venta);
      let key = "";
      let label = "";

      // Agrupación dinámica según el período
      if (periodo === "hoy") {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        label = `${date.getHours()}:00 hs`;
        date.setMinutes(0, 0, 0); // Normalizamos a la hora en punto
      } else if (periodo === "mes" || periodo === "trimestre") {
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        label = date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
        });
        date.setHours(0, 0, 0, 0);
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}`;
        label = date.toLocaleDateString("es-AR", {
          month: "short",
          year: "2-digit",
        });
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
      }

      if (!grouped.has(key)) {
        grouped.set(key, { dateObj: date, label, total: 0 });
      }
      grouped.get(key)!.total += Number(v.total);
    });

    // Convertimos el Map a Array y ordenamos cronológicamente
    let sortedData = Array.from(grouped.values()).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime(),
    );

    // Truco visual: Si solo hay 1 dato (ej. primer venta del día), agregamos un punto inicial en 0 para generar la curva
    if (sortedData.length === 1) {
      const singlePoint = sortedData[0];
      const previousDate = new Date(singlePoint.dateObj);
      if (periodo === "hoy") previousDate.setHours(previousDate.getHours() - 1);
      else previousDate.setDate(previousDate.getDate() - 1);

      sortedData = [
        { dateObj: previousDate, label: "Previo", total: 0 },
        singlePoint,
      ];
    }

    return sortedData;
  }, [ventas, periodo]);

  // --- 3. Estado del Tooltip Interactivo ---
  const [hoveredData, setHoveredData] = useState<{
    x: number;
    y: number;
    data: (typeof data)[0];
  } | null>(null);

  // --- 4. Renderizado Temprano si no hay datos o no hay ancho ---
  if (data.length === 0) {
    return (
      <div className="h-[320px] w-full flex items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border">
        No hay suficientes datos para generar el gráfico.
      </div>
    );
  }

  if (width === 0) {
    return <div ref={containerRef} className="h-[320px] w-full" />;
  }

  // --- 5. Matemáticas de D3.js (Escalas y Generadores) ---
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Escala X (Tiempo)
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.dateObj) as [Date, Date])
    .range([0, innerWidth]);

  // Escala Y (Dinero) - Le damos un 10% extra de altura al máximo para que la curva respire
  const maxTotal = d3.max(data, (d) => d.total) || 0;
  const yScale = d3
    .scaleLinear()
    .domain([0, maxTotal * 1.1])
    .range([innerHeight, 0]);

  // Generador de la Línea
  const lineGenerator = d3
    .line<(typeof data)[0]>()
    .x((d) => xScale(d.dateObj))
    .y((d) => yScale(d.total))
    .curve(d3.curveMonotoneX); // Esta es la curva suave estilo Rosencharts/Vercel

  // Generador del Área (Gradiente)
  const areaGenerator = d3
    .area<(typeof data)[0]>()
    .x((d) => xScale(d.dateObj))
    .y0(innerHeight)
    .y1((d) => yScale(d.total))
    .curve(d3.curveMonotoneX);

  const pathD = lineGenerator(data) || "";
  const areaD = areaGenerator(data) || "";

  // Ticks para los ejes (Calculamos cuántos mostrar según el ancho para no amontonarlos)
  const xTicks = xScale.ticks(width < 500 ? 4 : 6);
  const yTicks = yScale.ticks(5);

  // --- 6. Interacción: Detectar hover ---
  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    const [xPos] = d3.pointer(event);
    const dateOnX = xScale.invert(xPos);

    // Bisector para encontrar el punto de datos más cercano a la fecha donde está el mouse
    const bisectDate = d3.bisector<(typeof data)[0], Date>(
      (d) => d.dateObj,
    ).left;
    const index = bisectDate(data, dateOnX, 1);
    const d0 = data[index - 1];
    const d1 = data[index];

    // Calculamos si el mouse está más cerca del punto izquierdo o del derecho
    let closestData = d0;
    if (
      d1 &&
      dateOnX.getTime() - d0.dateObj.getTime() >
        d1.dateObj.getTime() - dateOnX.getTime()
    ) {
      closestData = d1;
    }

    setHoveredData({
      x: xScale(closestData.dateObj),
      y: yScale(closestData.total),
      data: closestData,
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] mt-4 select-none"
    >
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          {/* Gradiente estilo Rosencharts */}
          <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* EJE Y (Líneas horizontales sutiles de la grilla y Textos) */}
          {yTicks.map((tickValue) => (
            <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`}>
              <line
                x1={0}
                x2={innerWidth}
                stroke="#e5e7eb" // Tailwind gray-200
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={-10}
                y={4}
                textAnchor="end"
                className="text-xs fill-muted-foreground font-medium"
              >
                ${tickValue.toLocaleString("es-AR")}
              </text>
            </g>
          ))}

          {/* EJE X (Textos inferiores) */}
          {xTicks.map((tickValue) => (
            <g
              key={tickValue.getTime()}
              transform={`translate(${xScale(tickValue)}, ${innerHeight})`}
            >
              <text
                y={20}
                textAnchor="middle"
                className="text-xs fill-muted-foreground font-medium"
              >
                {/* Formateador dinámico según periodo */}
                {periodo === "hoy"
                  ? `${tickValue.getHours()}:00`
                  : tickValue.toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                    })}
              </text>
            </g>
          ))}

          {/* ÁREA Y LÍNEA PRINCIPAL */}
          <path
            d={areaD}
            fill="url(#gradient-area)"
            className="transition-all duration-300"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#10b981" // Tailwind emerald-500
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300 drop-shadow-sm"
          />

          {/* INTERACCIÓN: Capa invisible para atrapar el mouse */}
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredData(null)}
          />

          {/* ESTADO HOVER: Línea vertical y punto */}
          {hoveredData && (
            <g>
              <line
                x1={hoveredData.x}
                x2={hoveredData.x}
                y1={0}
                y2={innerHeight}
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                className="opacity-70 pointer-events-none"
              />
              <circle
                cx={hoveredData.x}
                cy={hoveredData.y}
                r={5}
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth={3}
                className="pointer-events-none shadow-sm"
              />
            </g>
          )}
        </g>
      </svg>

      {/* TOOLTIP HTML (Flotante y moderno) */}
      {hoveredData && (
        <div
          className="absolute pointer-events-none z-10 bg-white border border-border shadow-xl rounded-xl p-3 transform -translate-x-1/2 -translate-y-[120%]"
          style={{
            left: hoveredData.x + margin.left,
            top: hoveredData.y + margin.top,
          }}
        >
          <div className="text-xs text-muted-foreground font-semibold mb-1">
            {hoveredData.data.label}
          </div>
          <div className="text-lg font-bold text-emerald-600">
            ${hoveredData.data.total.toLocaleString("es-AR")}
          </div>
        </div>
      )}
    </div>
  );
}
