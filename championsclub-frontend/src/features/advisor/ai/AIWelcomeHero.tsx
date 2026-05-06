import { ArrowRight } from "lucide-react";
import { Sparkles } from "lucide-react";
import { formatRelative } from "./chips";

type Props = {
  summary: string;
  generatedAt: string;
  modelVersion: string;
  onStart: () => void;
};

/**
 * Friendly hero that introduces the AI Coach in plain language and invites
 * the user to start the guided journey.
 */
export default function AIWelcomeHero({
  summary,
  generatedAt,
  modelVersion,
  onStart,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-amber-300/30 bg-[linear-gradient(145deg,#0b1624_0%,#102033_60%,#1a1304_100%)] p-7 shadow-[0_24px_48px_rgba(2,8,20,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.18),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_85%,rgba(34,211,238,0.12),transparent_50%)]" />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[auto,1fr,auto] lg:items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/45 bg-amber-300/15 shadow-[0_0_28px_rgba(251,191,36,0.32)]">
          <Sparkles className="h-7 w-7 text-amber-200" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            Hi, I'm your AI Coach
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-50">
            Let's look at your performance together
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{summary}</p>
          <p className="mt-3 text-[11px] text-slate-500">
            Updated {formatRelative(generatedAt)} · {modelVersion}
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-[#04101e] shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:bg-cyan-300"
        >
          Start the tour
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
