import { Sparkles } from "lucide-react";

type Props = {
  summary: string | null;
  isLoading: boolean;
  isError: boolean;
  isFallback: boolean;
};

export default function AdvisorAIActivitySummary({
  summary,
  isLoading,
  isError,
  isFallback,
}: Props) {
  if (isError && !isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[26px] border border-[#3d556f] bg-[linear-gradient(145deg,#0b1624_0%,#102033_100%)] p-6 shadow-[0_18px_38px_rgba(2,8,20,0.44)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(251,191,36,0.1),transparent_34%)]" />
        <div className="relative mb-5 flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/45 bg-amber-300/18 shadow-[0_0_20px_rgba(251,191,36,0.24)]">
            <Sparkles className="h-5 w-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Strategic Snapshot
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-50">
              Advisor Performance Narrative
            </h3>
          </div>
        </div>
        <p className="relative text-sm leading-6 text-amber-100">
          The advisor activity summary is unavailable right now. Please try again shortly.
        </p>
      </div>
    );
  }

  const showSkeleton = isLoading || summary === null;

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[#3d556f] bg-[linear-gradient(145deg,#0b1624_0%,#102033_100%)] p-6 shadow-[0_18px_38px_rgba(2,8,20,0.44)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(251,191,36,0.1),transparent_34%)]" />

      <div className="relative mb-5 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/45 bg-amber-300/18 shadow-[0_0_20px_rgba(251,191,36,0.24)]">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 text-amber-200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 14a8 8 0 1 1 16 0" />
            <path d="M7.5 13.2l-1.3 1" />
            <path d="M10.6 11.4l-.7-1.4" />
            <path d="M13.4 11.4l.7-1.4" />
            <path d="M16.5 13.2l1.3 1" />
            <path d="M12 14l4-3" />
            <circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
            Strategic Snapshot
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-50">
            Advisor Performance Narrative
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            A clear read on advisor momentum, pressure points, and where to coach next.
          </p>
        </div>
      </div>

      {showSkeleton ? (
        <div className="space-y-3">
          {[90, 98, 78, 66].map((w) => (
            <div
              key={w}
              className="h-3.5 animate-pulse rounded-full bg-slate-500/70"
              style={{ width: `${w}%` }}
            />
          ))}
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-300/80" />
            Building advisor briefing...
          </div>
        </div>
      ) : (
        <>
          <p className="text-[15px] leading-8 text-slate-100">{summary}</p>
          {isFallback ? (
            <p className="mt-3 text-sm text-slate-300">
              Limited KPI activity detected for this interval, so this summary is concise.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
