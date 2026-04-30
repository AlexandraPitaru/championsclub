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

type PerformanceTrendChartProps = {
  data: PerformanceTrendDataPoint[];
  chartIdSuffix?: string;
};

export default function PerformanceTrendChart({
  data,
  chartIdSuffix = "main",
}: PerformanceTrendChartProps) {
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

        <div className="flex h-[260px] items-center justify-center rounded-xl border border-[#29405b] bg-[#0d1a2b] text-sm text-slate-400">
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
              stroke="#23364b"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="period"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "#28415f" }}
              tickLine={{ stroke: "#28415f" }}
            />

            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "#28415f" }}
              tickLine={{ stroke: "#28415f" }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0c192b",
                border: "1px solid #2b445f",
                borderRadius: "12px",
                color: "#e2e8f0",
              }}
              itemStyle={{ color: "#cbd5e1" }}
              labelStyle={{ color: "#67e8f9" }}
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