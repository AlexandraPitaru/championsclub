import { TrendingUp } from "lucide-react";
import Card from "../../../components/ui/Card";
import type { AIStrength } from "./types";

type Props = { strengths: AIStrength[] };

export default function AIStrengthsList({ strengths }: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-emerald-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Top strengths
        </h3>
      </div>
      <ul className="space-y-3">
        {strengths.map((s) => (
          <li
            key={s.title}
            className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--text-h)" }}>{s.title}</p>
              {s.metric_evidence && (
                <span className="shrink-0 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                  {s.metric_evidence}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text)" }}>{s.description}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{s.supporting_reason}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
