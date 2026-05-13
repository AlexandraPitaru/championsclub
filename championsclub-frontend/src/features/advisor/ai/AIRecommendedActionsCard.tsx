import { ArrowUpRight, CheckCircle2, Clock, Target, X } from "lucide-react";
import { useMemo, useState } from "react";
import Card from "../../../components/ui/Card";
import { categoryChipClass, formatCategory, priorityChipClass } from "./chips";
import type { AIRecommendedAction } from "./types";

type Props = { items: AIRecommendedAction[] };
type ActionProgramStep = {
  title: string;
  body: string;
  meta: string;
};

const inferActionKind = (action: AIRecommendedAction) => {
  const text = `${action.title} ${action.description} ${action.reason}`.toLowerCase();

  if (text.includes("rank") || text.includes("points")) return "rank";
  if (text.includes("team") || text.includes("benchmark")) return "benchmark";
  if (text.includes("skill") || text.includes("practice") || action.category === "skills") {
    return "skill";
  }
  if (text.includes("follow") || action.category === "follow_up" || action.cta_target === "leads") {
    return "follow_up";
  }
  if (text.includes("conversion") || text.includes("deal") || text.includes("closed")) {
    return "conversion";
  }
  if (text.includes("rhythm") || text.includes("cadence") || action.category === "activity") {
    return "activity";
  }

  return "default";
};

const impactMeta = (action: AIRecommendedAction) =>
  action.expected_points_gain ? `Potential +${action.expected_points_gain} pts` : "Measure the result";

const timeMeta = (action: AIRecommendedAction, fallback = "10-15 min") =>
  action.time_estimate_minutes ? `${action.time_estimate_minutes} min` : fallback;

const buildActionProgram = (action: AIRecommendedAction): ActionProgramStep[] => {
  const kind = inferActionKind(action);

  switch (kind) {
    case "rank":
      return [
        {
          title: "Define the weekly points gap",
          body: action.description,
          meta: "Target",
        },
        {
          title: "Pick the two fastest point sources",
          body: "Choose the activities most likely to move this target: completed sales, qualified follow-ups, upsells, or product actions already visible in your pipeline.",
          meta: timeMeta(action, "15 min"),
        },
        {
          title: "Set a Friday checkpoint",
          body: action.reason,
          meta: "This week",
        },
        {
          title: "Adjust the target after results",
          body: action.expected_impact,
          meta: impactMeta(action),
        },
      ];
    case "benchmark":
      return [
        {
          title: "Choose one stronger teammate",
          body: "Pick someone above your current team average and focus on one observable habit, not their whole routine.",
          meta: "Compare",
        },
        {
          title: "Copy one specific behavior",
          body: action.description,
          meta: timeMeta(action, "20 min"),
        },
        {
          title: "Test it in one live customer flow",
          body: action.reason,
          meta: "Apply once",
        },
        {
          title: "Keep it only if it moves the metric",
          body: action.expected_impact,
          meta: impactMeta(action),
        },
      ];
    case "skill":
      return [
        {
          title: "Name the exact skill gap",
          body: action.description,
          meta: "Focus skill",
        },
        {
          title: "Create a short practice script",
          body: "Write one phrase, one question, and one response you can use in the next customer conversation for this skill.",
          meta: timeMeta(action, "15 min"),
        },
        {
          title: "Use it after every relevant interaction",
          body: action.reason,
          meta: "Practice loop",
        },
        {
          title: "Review the quality, not just completion",
          body: action.expected_impact,
          meta: impactMeta(action),
        },
      ];
    case "follow_up":
      return [
        {
          title: "List the warmest leads first",
          body: "Start with customers who recently interacted, asked for pricing, booked interest, or have an unfinished next step.",
          meta: "Prioritize",
        },
        {
          title: "Send a specific next-step message",
          body: action.description,
          meta: timeMeta(action, "10 min"),
        },
        {
          title: "Schedule the next touch before closing the task",
          body: action.reason,
          meta: "Cadence",
        },
        {
          title: "Track replies and booked actions",
          body: action.expected_impact,
          meta: impactMeta(action),
        },
      ];
    case "conversion":
      return [
        {
          title: "Pick one deal closest to closing",
          body: "Choose the customer with the clearest interest, budget signal, or next-step blocker.",
          meta: "Deal focus",
        },
        {
          title: "Identify the blocker",
          body: action.reason,
          meta: timeMeta(action, "10 min"),
        },
        {
          title: "Make one closing move",
          body: action.description,
          meta: "Customer action",
        },
        {
          title: "Record what changed",
          body: action.expected_impact,
          meta: impactMeta(action),
        },
      ];
    case "activity":
      return [
        {
          title: "Block the week into three work lanes",
          body: "Reserve separate slots for prospecting, follow-ups, and closing or check-in work.",
          meta: "Plan",
        },
        {
          title: "Attach one measurable output to each lane",
          body: action.description,
          meta: timeMeta(action, "15 min"),
        },
        {
          title: "Protect the same rhythm for five workdays",
          body: action.reason,
          meta: "Consistency",
        },
        {
          title: "Compare trend at the end of the week",
          body: action.expected_impact,
          meta: impactMeta(action),
        },
      ];
    default:
      return [
        {
          title: `Turn "${action.title}" into one task`,
          body: action.description,
          meta: formatCategory(action.category),
        },
        {
          title: "Do the smallest useful version first",
          body: action.reason,
          meta: timeMeta(action),
        },
        {
          title: "Capture the outcome",
          body: action.expected_impact,
          meta: impactMeta(action),
        },
      ];
  }
};

export default function AIRecommendedActionsCard({ items }: Props) {
  const [selectedAction, setSelectedAction] = useState<AIRecommendedAction | null>(null);

  const selectedProgram = useMemo(
    () => (selectedAction ? buildActionProgram(selectedAction) : []),
    [selectedAction],
  );

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
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryChipClass(a.category ?? 'uncategorized')}`}
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
              onClick={() => setSelectedAction(a)}
            >
              {a.cta_label?.trim() || "View action plan"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {selectedAction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-plan-title"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-300/25 bg-[#07111f] p-5 shadow-2xl shadow-cyan-950/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Step-by-step programme
                </p>
                <h4 id="action-plan-title" className="mt-1 text-lg font-semibold text-slate-50">
                  {selectedAction.title}
                </h4>
                <p className="mt-1 text-xs text-slate-400">{selectedAction.reason}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-500/50 p-2 text-slate-300 transition hover:border-cyan-300/60 hover:text-cyan-100"
                onClick={() => setSelectedAction(null)}
                aria-label="Close action plan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityChipClass(selectedAction.priority)}`}
              >
                {selectedAction.priority}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${categoryChipClass(selectedAction.category ?? "uncategorized")}`}
              >
                {formatCategory(selectedAction.category)}
              </span>
              {selectedAction.time_estimate_minutes != null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-400/40 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  <Clock className="h-3 w-3" />
                  {selectedAction.time_estimate_minutes} min
                </span>
              )}
              {selectedAction.expected_points_gain != null && (
                <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                  +{selectedAction.expected_points_gain} pts
                </span>
              )}
            </div>

            <ol className="mt-5 space-y-3">
              {selectedProgram.map((step, index) => (
                <li
                  key={`${step.title}-${index}`}
                  className="grid grid-cols-[auto_1fr] gap-3 rounded-xl border border-[#28415f] bg-[#0a1322] p-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/90 text-xs font-bold text-[#04101e]">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-50">{step.title}</p>
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                        <CheckCircle2 className="h-3 w-3" />
                        {step.meta}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

          </div>
        </div>
      )}
    </Card>
  );
}
