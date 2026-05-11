import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
};

export default function AIStepNavigation({
  onPrev,
  onNext,
  prevLabel = "Back",
  nextLabel = "Next",
  isFirstStep = false,
  isLastStep = false,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep}
        className="inline-flex items-center gap-2 rounded-full border border-[#28415f] bg-[#0d1a2b] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {prevLabel}
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={isLastStep}
        className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2 text-xs font-bold text-[#04101e] shadow-[0_0_18px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
