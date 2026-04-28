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
      ? "text-emerald-600"
      : status === "negative"
      ? "text-red-600"
      : "text-slate-500";

  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-3 flex items-end justify-between">
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        <span className={`text-sm font-semibold ${deltaColor}`}>{delta}</span>
      </div>
    </Card>
  );
}