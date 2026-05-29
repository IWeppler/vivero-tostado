"use client";

import { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  totalIngresos: number;
  margen: number;
}

export function DonutChart({
  data,
  totalIngresos,
  margen,
}: Readonly<DonutChartProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = 280;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const [hoveredData, setHoveredData] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
  } | null>(null);

  // Verificamos si hay ingresos. Si no, mostramos empty state.
  if (totalIngresos <= 0) {
    return (
      <div className="h-[280px] w-full flex flex-col items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed border-border p-6 text-center">
        <div className="w-32 h-32 rounded-full border-8 border-muted mb-4" />
        No hay ingresos registrados en este período para analizar.
      </div>
    );
  }

  if (width === 0)
    return <div ref={containerRef} className="h-[280px] w-full" />;

  const radius = Math.min(width, height) / 2 - 20;
  const strokeWidth = 28; // Grosor del anillo

  // Generadores de D3
  const pie = d3
    .pie<(typeof data)[0]>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(0.03); // Espacio entre rebanadas

  const arc = d3
    .arc<d3.PieArcDatum<(typeof data)[0]>>()
    .innerRadius(radius - strokeWidth)
    .outerRadius(radius)
    .cornerRadius(8); // Bordes redondeados

  const arcs = pie(data);
  const isEnPerdida = margen < 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[280px] select-none flex flex-col items-center justify-center"
    >
      <svg width={width} height={height} className="overflow-visible">
        <g transform={`translate(${width / 2},${height / 2})`}>
          {/* Anillos del Donut */}
          {arcs.map((d, i) => (
            <path
              key={i}
              d={arc(d) || ""}
              fill={d.data.color}
              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              onMouseMove={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  setHoveredData({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    label: d.data.label,
                    value: d.data.value,
                  });
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            />
          ))}

          {/* Texto Central (El KPI gigante de Rentabilidad) */}
          <text
            textAnchor="middle"
            dy="-5"
            className="fill-foreground font-black text-4xl"
          >
            {Math.abs(margen).toFixed(0)}%
          </text>
          <text
            textAnchor="middle"
            dy="20"
            className={`text-xs font-bold tracking-widest ${isEnPerdida ? "fill-rose-500" : "fill-emerald-600"}`}
          >
            {isEnPerdida ? "EN PÉRDIDA" : "DE MARGEN NETO"}
          </text>
        </g>
      </svg>

      {/* Leyenda Inferior */}
      <div className="absolute bottom-0 w-full flex justify-center gap-4 flex-wrap px-2">
        {data
          .filter((d) => d.value > 0)
          .map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground font-medium">
                {item.label} ({((item.value / totalIngresos) * 100).toFixed(0)}
                %)
              </span>
            </div>
          ))}
      </div>

      {/* Tooltip Hover */}
      {hoveredData && (
        <div
          className="absolute pointer-events-none z-10 bg-white border border-border shadow-xl rounded-xl p-3 transform -translate-x-1/2 -translate-y-[120%]"
          style={{ left: hoveredData.x, top: hoveredData.y }}
        >
          <div className="text-xs text-muted-foreground font-semibold mb-1">
            {hoveredData.label}
          </div>
          <div className="text-sm font-bold text-foreground">
            ${hoveredData.value.toLocaleString("es-AR")}
          </div>
        </div>
      )}
    </div>
  );
}
