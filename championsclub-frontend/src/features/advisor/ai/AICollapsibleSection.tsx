import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  defaultOpen?: boolean;
  accent?: "cyan" | "amber" | "rose" | "emerald" | "violet";
  children: ReactNode;
};

const accentMap: Record<NonNullable<Props["accent"]>, string> = {
  cyan: "border-cyan-300/30 hover:border-cyan-300/60",
  amber: "border-amber-300/30 hover:border-amber-300/60",
  rose: "border-rose-300/30 hover:border-rose-300/60",
  emerald: "border-emerald-300/30 hover:border-emerald-300/60",
  violet: "border-violet-300/30 hover:border-violet-300/60",
};

export default function AICollapsibleSection({
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = false,
  accent = "cyan",
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-[26px] border bg-[#0b1524]/90 shadow-[0_12px_30px_rgba(2,8,20,0.35)] backdrop-blur transition ${accentMap[accent]}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-4 rounded-[26px] px-5 py-4 text-left transition hover:bg-white/[0.02]"
      >
        {icon && <div className="shrink-0">{icon}</div>}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-50">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{subtitle}</p>
          )}
        </div>

        {badge && <div className="shrink-0">{badge}</div>}

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180 text-cyan-200" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-[#1f3045] px-5 py-5 animate-[fadeIn_0.18s_ease-out]">
          {children}
        </div>
      )}
    </section>
  );
}
