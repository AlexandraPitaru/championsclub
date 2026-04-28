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

type PerformanceTrendChartProps = {
  data: {
    week: string;
    sales: number;
    target: number;
  }[];
  chartIdSuffix?: string;
};

export default function PerformanceTrendChart({
  data,
  chartIdSuffix = "main",
}: PerformanceTrendChartProps) {
  const gradientId = `salesGradient-${chartIdSuffix}`;

  return (
    <Card className="h-[360px]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Team Performance Trend
        </h3>
        <p className="text-sm text-slate-500">
          Weekly sales performance compared with target
        </p>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />

            <Area
              type="monotone"
              dataKey="sales"
              stroke="#0f172a"
              fill={`url(#${gradientId})`}
              strokeWidth={3}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}