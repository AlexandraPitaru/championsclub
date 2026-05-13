import { useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

type Props = {
  title: string;
  hint: string;
  icon?: ReactNode;
  children: ReactNode;
};

export default function AIExplainerCard({ title, hint, icon, children }: Props) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && <div className="shrink-0">{icon}</div>}
          <h3 className="text-base font-semibold" style={{ color: "var(--text-h)" }}>{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowHint((p) => !p)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
            showHint
              ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-200"
              : "hover:text-cyan-200"
          }`}
          style={!showHint ? { borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)", color: "var(--text-muted)" } : undefined}
        >
          <HelpCircle className="h-3 w-3" />
          {showHint ? "Hide help" : "What is this?"}
        </button>
      </div>

      {showHint && (
        <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.05] p-3 text-xs text-cyan-100">
          {hint}
        </div>
      )}

      <div className="mt-4">{children}</div>
    </div>
  );
}
