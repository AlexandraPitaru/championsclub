import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  generateManagerTeamSummary,
  mapTeamKpisToSummaryPayload,
} from "../../services/api/managerSummaryService";
import type { TeamKpisData, KpiInterval } from "../../services/api/managerStatisticsService";

const TYPING_SPEED_MS = 18;

interface Props {
  teamKpis: TeamKpisData | null;
  interval: KpiInterval;
  managerId: number | null;
}

export default function AIExecutiveSummary({ teamKpis, interval, managerId }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cacheKey = `ai_summary_${managerId ?? "unknown"}_${interval}`;

  useEffect(() => {
    if (!teamKpis) return;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { summary: string; fallback: boolean };
        setSummary(parsed.summary);
        setIsFallback(parsed.fallback);
        return;
      } catch {
        // ignore corrupt cache
      }
    }

    setIsLoading(true);
    setSummary(null);

    const payload = mapTeamKpisToSummaryPayload(teamKpis, interval);

    generateManagerTeamSummary(payload)
      .then((result) => {
        setSummary(result.summary);
        setIsFallback(result.fallback);
        localStorage.setItem(cacheKey, JSON.stringify({ summary: result.summary, fallback: result.fallback }));
      })
      .catch(() => {
        setSummary("Unable to generate summary at this time.");
        setIsFallback(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [teamKpis, interval, cacheKey]);

  // Typewriter effect — runs whenever a new full summary lands (cache or API)
  useEffect(() => {
    if (!summary) {
      setDisplayedText("");
      return;
    }

    setDisplayedText("");
    setIsTyping(true);

    let index = 0;

    function typeNextChar() {
      index += 1;
      setDisplayedText(summary!.slice(0, index));

      if (index < summary!.length) {
        typingRef.current = setTimeout(typeNextChar, TYPING_SPEED_MS);
      } else {
        setIsTyping(false);
      }
    }

    typingRef.current = setTimeout(typeNextChar, TYPING_SPEED_MS);

    return () => {
      if (typingRef.current !== null) {
        clearTimeout(typingRef.current);
      }
    };
  }, [summary]);

  const showSkeleton = isLoading || teamKpis === null;

  return (
    <div
      className="relative overflow-hidden rounded-[26px] border p-6"
      style={{
        borderColor: "var(--summary-border)",
        background: "var(--summary-bg)",
        boxShadow: "var(--summary-shadow)",
      }}
    >
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
          <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--summary-text)" }}>
            Team Performance Narrative
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--summary-muted)" }}>
            A clear read on momentum, pressure points, and where to coach next.
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
          <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--summary-muted)" }}>
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-300/80" />
            Building your team briefing...
          </div>
        </div>
      ) : (
        <>
          <p className="text-[15px] leading-8" style={{ color: "var(--summary-text)" }}>
            {displayedText}
            {isTyping && (
              <span className="ml-0.5 inline-block w-[2px] animate-[blink_0.75s_step-end_infinite] rounded-sm bg-amber-300 align-middle"
                style={{ height: "1.1em" }}
                aria-hidden="true"
              />
            )}
          </p>
          {isFallback ? (
            <p className="mt-3 text-sm" style={{ color: "var(--summary-muted)" }}>
              Limited KPI activity detected for this interval, so this summary is concise.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}