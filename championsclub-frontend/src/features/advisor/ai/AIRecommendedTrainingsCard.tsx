import { BookOpen, ChevronRight, Clock } from "lucide-react";
import Card from "../../../components/ui/Card";
import { priorityChipClass } from "./chips";
import type { AIRecommendedTraining } from "./types";


type Props = { items: AIRecommendedTraining[] };


const handleTrainingClick = (training: AIRecommendedTraining) => {
  if (training.cta_target === "training_external_url" && training.external_url) {
    window.open(training.external_url, "_blank", "noopener,noreferrer");
  } else if (training.cta_target === "training_internal") {
    window.location.href = "/trainings";
  } else {
    // eslint-disable-next-line no-alert
    alert(`Navigating to training: ${training.title}`);
  }
};

function AIRecommendedTrainingsCard({ items }: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-200">
            Recommended trainings
          </h3>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Aligned with your skill gaps</p>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((t) => (
          <li
            key={t.title}
            className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.04] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-h)" }}>{t.title}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text)" }}>{t.description}</p>
              </div>
              {t.is_recommended_now && (
                <span className="shrink-0 rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                  Recommended now
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-violet-300/40 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                {t.related_skill}
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ borderColor: "var(--panel-border)", background: "var(--panel-subtle-bg)", color: "var(--text)" }}>
                {t.level}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: "var(--panel-border)", background: "var(--panel-subtle-bg)", color: "var(--text)" }}>
                <Clock className="h-3 w-3" />
                {t.duration_minutes} min
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityChipClass(t.priority)}`}
              >
                {t.priority}
              </span>
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>{t.reason}</p>
            <p className="mt-1 text-[11px] text-emerald-300">{t.expected_benefit}</p>

            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100"
              onClick={() => handleTrainingClick(t)}
            >
              Start training
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default AIRecommendedTrainingsCard;
