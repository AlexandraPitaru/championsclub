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
    <section className="relative overflow-hidden rounded-[26px] border border-amber-300/30 p-6" style={{ background: "var(--panel-bg)" }}>
      <div className="relative flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 text-amber-200" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            Coach note
          </p>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-h)" }}>{motivationalSummary}</p>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>{recommendationSummary}</p>
        </div>
      </div>
    </section>
  );
}
