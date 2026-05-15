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
import { formatFriendlyDate, formatFriendlyDateShort } from "../../utils/dateFormatting";

type PerformanceTrendChartProps = {
  data: PerformanceTrendDataPoint[];
  chartIdSuffix?: string;
  filterLabel?: string;
};

const compactCurrencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullCurrencyFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatChartCurrency(value: number | string): string {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return compactCurrencyFormatter.format(numericValue);
}

function formatTooltipCurrency(value: number | string): string {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return fullCurrencyFormatter.format(numericValue);
}

function formatSeriesName(seriesKey: string): string {
  if (seriesKey === "sales") {
    return "Sales";
  }

  if (seriesKey === "points") {
    return "Points";
  }

  if (seriesKey === "target") {
    return "Target";
  }

  return seriesKey;
}

export default function PerformanceTrendChart({
  data,
  chartIdSuffix = "main",
  filterLabel,
}: PerformanceTrendChartProps) {
  const { isLight } = useTheme();
  const gradientId = `salesGradient-${chartIdSuffix}`;

  if (!data.length) {
    return (
      <Card className="h-[360px] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-cyan-100">
            Performance Trend
          </h3>
          <p className="text-sm text-slate-400">
            Sales and points performance based on selected filters
            {filterLabel ? ` (${filterLabel})` : ""}
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
    <Card className="h-[360px] min-w-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-cyan-100">
          Performance Trend
        </h3>
        <p className="text-sm text-slate-400">
          Sales and points performance based on selected filters
          {filterLabel ? ` (${filterLabel})` : ""}
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
              tickFormatter={(value) => formatFriendlyDateShort(String(value))}
              tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
              tickLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
            />

            <YAxis
              yAxisId="currency"
              tickFormatter={(value) => formatChartCurrency(value)}
              tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
              tickLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
            />

            <YAxis
              yAxisId="points"
              orientation="right"
              tick={{ fill: isLight ? "#475569" : "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
              tickLine={{ stroke: isLight ? "#b8ccdf" : "#28415f" }}
            />

            <Tooltip
              labelFormatter={(value) => formatFriendlyDate(String(value))}
              formatter={(value, name) => {
                const seriesName = String(name);
                if (seriesName === "points") {
                  const numericValue = typeof value === "number" ? value : Number(value);
                  const formattedPoints = Number.isNaN(numericValue)
                    ? String(value)
                    : numericValue.toLocaleString();
                  return [formattedPoints, formatSeriesName(seriesName)];
                }

                return [
                  formatTooltipCurrency(value as number | string),
                  formatSeriesName(seriesName),
                ];
              }}
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
              yAxisId="currency"
              stroke="#22d3ee"
              fill={`url(#${gradientId})`}
              strokeWidth={3}
            />

            <Line
              type="monotone"
              dataKey="points"
              yAxisId="points"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
            />
            
            <Line
              type="monotone"
              dataKey="target"
              yAxisId="currency"
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