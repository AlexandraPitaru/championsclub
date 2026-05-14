import { RefreshCw } from "lucide-react";

type Props = {
  onRefresh: () => void;
  refreshing: boolean;
  refreshCooldownSeconds: number;
};

export default function AIRefreshControls({
  onRefresh,
  refreshing,
  refreshCooldownSeconds,
}: Props) {
  const isCoolingDown = refreshCooldownSeconds > 0;

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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
