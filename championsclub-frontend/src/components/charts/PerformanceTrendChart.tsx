import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
} from "recharts";
import Card from "../ui/Card";
import type { PerformanceTrendDataPoint } from "../../services/api/performanceTrendService";
import { useTheme } from "../../app/theme/ThemeProvider";

type PerformanceTrendChartProps = {
  data: PerformanceTrendDataPoint[];
  chartIdSuffix?: string;
};

export default function PerformanceTrendChart({
  data,
  chartIdSuffix = "main",
}: PerformanceTrendChartProps) {
  const { isLight } = useTheme();
  const gradientId = `salesGradient-${chartIdSuffix}`;

  if (!data.length) {
    return (
      <Card className="h-[360px]">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-cyan-100">
            Performance Trend
          </h3>
          <p className="text-sm text-slate-400">
            Sales and points performance based on selected filters
          </p>
        </div>

        <div
          className="flex h-[260px] items-center justify-center rounded-xl border text-sm text-slate-400"
          style={{ borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }}
        >
          No performance data available.
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[360px] min-w-0">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-cyan-100">
          Performance Trend
        </h3>
        <p className="text-sm text-slate-400">
          Sales and points performance based on selected filters
        </p>
      </div>

      <div className="h-[260px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={isLight ? "#c8d8e8" : "#23364b"}
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="period"
              tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
              tickLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
            />

            <YAxis
              tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
              tickLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: isLight ? "#ffffff" : "#0c192b",
                border: `1px solid ${isLight ? "#b8ccdf" : "#2b445f"}`,
                borderRadius: "12px",
                color: isLight ? "#0f172a" : "#e2e8f0",
              }}
              itemStyle={{ color: isLight ? "#334155" : "#cbd5e1" }}
              labelStyle={{ color: isLight ? "#0e7490" : "#67e8f9" }}
            />

            <Area
              type="monotone"
              dataKey="sales"
              stroke="#22d3ee"
              fill={`url(#${gradientId})`}
              strokeWidth={3}
            />

            {/*
            <Line
              type="monotone"
              dataKey="points"
              stroke="#a78bfa"
              strokeWidth={2}
            />
            */}
            
            <Line
              type="monotone"
              dataKey="target"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}