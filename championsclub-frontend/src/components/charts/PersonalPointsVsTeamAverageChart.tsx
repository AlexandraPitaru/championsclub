import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DataPoint = { label: string; points: number };

type PersonalPointsVsTeamAverageChartProps = {
  data: DataPoint[];
};

export default function PersonalPointsVsTeamAverageChart({
  data,
}: PersonalPointsVsTeamAverageChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={data}
        margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <CartesianGrid
          stroke="#23364b"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
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
          dataKey="points"
          stroke="#22d3ee"
          fill="#22d3ee33"
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
