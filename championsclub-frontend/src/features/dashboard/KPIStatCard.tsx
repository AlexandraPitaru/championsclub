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
    <Card>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <div className="mt-3 flex items-end justify-between">
        <h3 className="text-3xl font-bold text-cyan-100">{value}</h3>
        <span className={`text-sm font-semibold ${deltaColor}`}>{delta}</span>
      </div>
    </Card>
  );
}