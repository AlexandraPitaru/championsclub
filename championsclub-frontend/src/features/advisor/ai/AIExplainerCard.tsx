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
    <div className="rounded-2xl border border-[#28415f] bg-[#0a1322] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && <div className="shrink-0">{icon}</div>}
          <h3 className="text-base font-semibold text-slate-50">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowHint((p) => !p)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
            showHint
              ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-200"
              : "border-[#28415f] bg-[#0d1a2b] text-slate-400 hover:text-cyan-200"
          }`}
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
