import { RefreshCw } from "lucide-react";
import type { AIInterval } from "./types";

const intervalOptions: { value: AIInterval; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All time" },
];

type Props = {
  interval: AIInterval;
  onIntervalChange: (next: AIInterval) => void;
  onRefresh: () => void;
  refreshing: boolean;
  refreshCooldownSeconds: number;
};

export default function AIRefreshControls({
  interval,
  onIntervalChange,
  onRefresh,
  refreshing,
  refreshCooldownSeconds,
}: Props) {
  const isCoolingDown = refreshCooldownSeconds > 0;

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex items-center gap-1 rounded-full border border-[#28415f] bg-[#0d1a2b] p-1">
        {intervalOptions.map((opt) => {
          const active = interval === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onIntervalChange(opt.value)}
              className={`min-w-[68px] rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-cyan-400/90 text-[#04101e] shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                  : "text-slate-300 hover:text-cyan-100"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing || isCoolingDown}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing
          ? "Regenerating…"
          : isCoolingDown
            ? `Available in ${Math.ceil(refreshCooldownSeconds / 60)}m`
            : "Regenerate insights"}
      </button>
    </div>
  );
}
