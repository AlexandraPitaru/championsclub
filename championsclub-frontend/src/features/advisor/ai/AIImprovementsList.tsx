import { ArrowRight, Target } from "lucide-react";
import Card from "../../../components/ui/Card";
import { categoryChipClass, formatCategory, priorityChipClass } from "./chips";
import type { AIImprovementArea } from "./types";

type Props = { items: AIImprovementArea[] };

export default function AIImprovementsList({ items }: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-amber-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
          Improvement areas
        </h3>
      </div>
      <ul className="space-y-3">
        {items.map((imp) => (
          <li
            key={imp.title}
            className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--text-h)" }}>{imp.title}</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityChipClass(imp.priority)}`}
              >
                {imp.priority}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${categoryChipClass(imp.category)}`}
              >
                {formatCategory(imp.category)}
              </span>
              {imp.expected_points_gain != null && (
                <span className="ml-auto text-[11px] font-semibold text-emerald-300">
                  +{imp.expected_points_gain} pts
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text)" }}>{imp.description}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{imp.reason}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-cyan-200">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>{imp.suggested_next_step}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
