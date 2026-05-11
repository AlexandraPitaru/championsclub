import { Sparkles } from "lucide-react";

type Props = {
  motivationalSummary: string;
  recommendationSummary: string;
};

export default function AICoachNote({
  motivationalSummary,
  recommendationSummary,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-amber-300/30 bg-[linear-gradient(145deg,#1a1304_0%,#10202f_100%)] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.18),transparent_45%)]" />
      <div className="relative flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 text-amber-200" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            Coach note
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-100">{motivationalSummary}</p>
          <p className="mt-3 text-xs text-slate-400">{recommendationSummary}</p>
        </div>
      </div>
    </section>
  );
}
