import Card from "../../components/ui/Card";

type KPIStatCardProps = {
  title: string;
  value: string;
  delta: string;
  status: "positive" | "negative" | "neutral";
};

export default function KPIStatCard({
  title,
  value,
  delta,
  status,
}: KPIStatCardProps) {
  const deltaColor =
    status === "positive"
      ? "text-emerald-400"
      : status === "negative"
      ? "text-rose-400"
      : "text-slate-400";

  return (
    <Card className="overflow-hidden">
      <p className="truncate text-sm font-medium" style={{ color: "var(--kpi-title)" }}>{title}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <h3 className="text-2xl font-bold" style={{ color: "var(--kpi-value)" }}>{value}</h3>
        <span className={`text-sm font-semibold ${deltaColor} whitespace-nowrap`}>{delta}</span>
      </div>
    </Card>
  );
}