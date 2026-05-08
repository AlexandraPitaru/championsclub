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
    <Card className="flex h-full min-h-32 flex-col overflow-hidden">
      <p className="truncate text-sm font-medium" style={{ color: "var(--kpi-title)" }}>{title}</p>
      <h3 className="mt-3 text-2xl font-bold" style={{ color: "var(--kpi-value)" }}>{value}</h3>
      <p className={`mt-2 text-sm font-semibold ${deltaColor}`}>{delta}</p>
    </Card>
  );
}