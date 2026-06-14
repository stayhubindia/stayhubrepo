"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { TrendData } from "@/types/analytics";

interface TrendChartProps {
  /** Array of trend data points */
  data: TrendData[];
  /** Whether the trend is positive (green) or negative (red) */
  isPositive?: boolean;
  /** Width of the chart in pixels */
  width?: number;
  /** Height of the chart in pixels */
  height?: number;
  /** Accessible label for the chart */
  ariaLabel?: string;
}

/**
 * TrendChart Component
 *
 * A lightweight SVG-based sparkline chart for displaying metric trends.
 * Shows tooltip on hover with date and value.
 * Uses emerald green for positive trends and red for negative trends.
 * Animates on mount.
 */
export function TrendChart({
  data,
  isPositive = true,
  width = 120,
  height = 40,
  ariaLabel = "Trend chart",
}: TrendChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    value: number;
  } | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);

  const color = isPositive ? "#16A34A" : "#DC2626";
  const fillColor = isPositive ? "#DCFCE7" : "#FEE2E2";

  // Compute path from data
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding + chartHeight - ((d.value - minVal) / range) * chartHeight,
    date: d.date,
    value: d.value,
  }));

  const linePath =
    points.length > 1
      ? points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(" ")
      : "";

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(height - padding).toFixed(2)} L ${points[0].x.toFixed(2)} ${(height - padding).toFixed(2)} Z`
      : "";

  // Measure path length for animation
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center rounded bg-slate-100"
        aria-label={ariaLabel}
      >
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }} aria-label={ariaLabel} role="img">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill={fillColor} opacity={0.5} />
        )}

        {/* Line */}
        {linePath && (
          <motion.path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={
              pathLength > 0
                ? { strokeDasharray: pathLength, strokeDashoffset: pathLength }
                : {}
            }
            animate={
              pathLength > 0 ? { strokeDashoffset: 0 } : {}
            }
            transition={{ duration: 1, ease: "easeOut" }}
          />
        )}

        {/* Hover points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="white"
            stroke={color}
            strokeWidth={2}
            className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
            onMouseEnter={() =>
              setTooltip({ x: p.x, y: p.y, date: p.date, value: p.value })
            }
          />
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-lg text-xs"
          style={{
            left: Math.min(tooltip.x, width - 80),
            top: tooltip.y - 36,
          }}
        >
          <p className="font-semibold text-slate-900">{tooltip.value.toLocaleString()}</p>
          <p className="text-slate-500">
            {new Date(tooltip.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
