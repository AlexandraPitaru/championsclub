import { Check } from "lucide-react";

export type AIJourneyStep = {
  id: string;
  label: string;
  shortLabel: string;
};

type Props = {
  steps: AIJourneyStep[];
  currentStepId: string;
  completedStepIds: string[];
  onSelect: (stepId: string) => void;
};

export default function AIJourneyStepper({
  steps,
  currentStepId,
  completedStepIds,
  onSelect,
}: Props) {
  return (
    <nav className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((step, idx) => {
          const isCurrent = step.id === currentStepId;
          const isDone = completedStepIds.includes(step.id);
          const isClickable = isDone || isCurrent;

          return (
            <li key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && onSelect(step.id)}
                disabled={!isClickable}
                className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isCurrent
                    ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                    : isDone
                      ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
                      : "border-[#28415f] bg-[#0d1a2b] text-slate-500"
                } ${!isClickable ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? "bg-cyan-400 text-[#04101e]"
                      : isDone
                        ? "bg-emerald-400 text-[#04101e]"
                        : "bg-[#1f3045] text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </button>
              {idx < steps.length - 1 && (
                <span
                  className={`mx-1 h-px w-6 ${
                    isDone ? "bg-emerald-400/40" : "bg-[#28415f]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
