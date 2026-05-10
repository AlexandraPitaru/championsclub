import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RankProgressData = {
  label: string;
  current_points: number;
  start_points: number;
  target_points: number;
  progress_percentage: number;
  remaining_points: number;
};

type RankProgressChartProps = {
  data: RankProgressData;
};

const BAR_COLORS = {
  start_points: "#a78bfa",
  current_points: "#22d3ee",
  target_points: "#f59e0b",
};

const BAR_LABELS: Record<string, string> = {
  start_points: "Start",
  current_points: "Current",
  target_points: "Target",
};

export default function RankProgressChart({ data }: RankProgressChartProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No data available.
      </div>
    );
  }

  const chartData = [
    { name: "Start", value: data.start_points, key: "start_points" },
    { name: "Current", value: data.current_points, key: "current_points" },
    { name: "Target", value: data.target_points, key: "target_points" },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ left: 10, right: 10, top: 20, bottom: 10 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          stroke="#23364b"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="name"
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
          cursor={{ fill: "#22d3ee11" }}
          contentStyle={{
            backgroundColor: "#0c192b",
            border: "1px solid #2b445f",
            borderRadius: "12px",
            color: "#e2e8f0",
          }}
          itemStyle={{ color: "#cbd5e1" }}
          labelStyle={{ color: "#67e8f9" }}
          formatter={(value, _name, entry) => {
            const numericValue = typeof value === "number" ? value : Number(value ?? 0);
            const entryKey = entry?.payload?.key;

            return [numericValue, BAR_LABELS[entryKey] ?? entryKey ?? "Value"];
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
          {chartData.map((entry) => (
            <Cell
              key={entry.key}
              fill={BAR_COLORS[entry.key as keyof typeof BAR_COLORS]}
            />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            style={{ fill: "#94a3b8", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
