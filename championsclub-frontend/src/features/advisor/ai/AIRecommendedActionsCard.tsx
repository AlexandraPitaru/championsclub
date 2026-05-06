import { ArrowUpRight, Clock, Target } from "lucide-react";
import Card from "../../../components/ui/Card";
import { categoryChipClass, formatCategory, priorityChipClass } from "./chips";
import type { AIRecommendedAction } from "./types";

type Props = { items: AIRecommendedAction[] };

export default function AIRecommendedActionsCard({ items }: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Top recommended actions
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Ordered by priority · max {items.length} items
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((a, idx) => (
          <li
            key={a.title}
            className="flex flex-col rounded-2xl border border-[#28415f] bg-[#0a1322] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                #{idx + 1}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityChipClass(a.priority)}`}
              >
                {a.priority}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-50">{a.title}</p>
            <p className="mt-1 text-xs text-slate-300">{a.description}</p>
            <p className="mt-1 text-[11px] text-slate-400">{a.reason}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryChipClass(a.category)}`}
              >
                {formatCategory(a.category)}
              </span>
              {a.expected_points_gain != null && (
                <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                  +{a.expected_points_gain} pts
                </span>
              )}
              {a.time_estimate_minutes != null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-400/40 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  <Clock className="h-3 w-3" />
                  {a.time_estimate_minutes} min
                </span>
              )}
            </div>

            <p className="mt-3 text-[11px] text-emerald-300">{a.expected_impact}</p>

            <button
              type="button"
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-cyan-400/90 px-3 py-1.5 text-xs font-semibold text-[#04101e] shadow-[0_0_18px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
            >
              {a.cta_label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
