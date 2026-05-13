import { TrendingUp } from "lucide-react";
import Card from "../../../components/ui/Card";
import { impactDotClass, priorityChipClass } from "./chips";
import type { AIForecast } from "./types";

type Props = { forecast: AIForecast };

export default function AIForecastCard({ forecast }: Props) {
  const progressPct = Math.min(
    100,
    Math.round(
      (forecast.projected_points_in_window / forecast.projected_points_target) * 100,
    ),
  );

  return (
    <Card className="space-y-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            AI Forecast
          </h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityChipClass(forecast.confidence_label)}`}
        >
          Confidence {forecast.confidence_pct}% · {forecast.confidence_label}
        </span>
      </div>

      <p className="text-sm" style={{ color: "var(--text)" }}>{forecast.forecast_summary}</p>

      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>Projected in {forecast.days_window} days</span>
          <span>
            Target: {typeof forecast.projected_points_target === 'number' ? forecast.projected_points_target.toLocaleString() : 'N/A'} pts
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--panel-subtle-bg)" }}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-cyan-200">
            {typeof forecast.projected_points_in_window === 'number' ? forecast.projected_points_in_window.toLocaleString() : 'N/A'} pts projected
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            Next rank likelihood {forecast.next_rank_likelihood.probability_pct}% ·{" "}
            {forecast.next_rank_likelihood.label}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text)" }}>
          Why this forecast
        </p>
        <ul className="mt-3 space-y-2">
          {forecast.main_factors.map((f, idx) => (
            <li
              key={f.title + '-' + f.weight + '-' + idx}
              className="flex items-start gap-3 rounded-xl border p-3"
              style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
            >
              <span
                className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${impactDotClass(f.impact)}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-h)" }}>{f.title}</p>
                  {f.weight && f.weight !== 'none' && (
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ borderColor: "var(--panel-border)", background: "var(--panel-subtle-bg)", color: "var(--text)" }}>
                      Impact: {f.weight === 'high' ? 'Mare' : f.weight === 'medium' ? 'Mediu' : f.weight === 'low' ? 'Scăzut' : f.weight}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{f.explanation}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
