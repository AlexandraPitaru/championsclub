import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import Card from "../../../components/ui/Card";
import { priorityChipClass } from "./chips";
import type { AIRiskArea } from "./types";

type Props = { items: AIRiskArea[] };

export default function AIRiskAreasCard({ items }: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-rose-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-200">
          Risk areas
        </h3>
      </div>
      <ul className="space-y-3">
        {items.map((r) => (
          <li
            key={r.title}
            className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] p-4"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
              <p className="text-sm font-semibold" style={{ color: "var(--text-h)" }}>{r.title}</p>
              <span
                className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityChipClass(r.severity)}`}
              >
                {r.severity}
              </span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text)" }}>{r.description}</p>
            <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>{r.reason}</p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-cyan-200">
              <ArrowRight className="h-3 w-3" />
              <span>{r.mitigation_action}</span>
            </div>
            {r.expected_points_loss != null && (
              <p className="mt-2 text-[11px] font-semibold text-rose-300">
                Estimated loss: −{r.expected_points_loss} pts
              </p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
