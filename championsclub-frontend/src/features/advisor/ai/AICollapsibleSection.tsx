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
      className={`rounded-[26px] border backdrop-blur transition ${accentMap[accent]}`}
      style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-4 rounded-[26px] px-5 py-4 text-left transition hover:bg-white/[0.02]"
      >
        {icon && <div className="shrink-0">{icon}</div>}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-h)" }}>{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
          )}
        </div>

        {badge && <div className="shrink-0">{badge}</div>}

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180 text-cyan-200" : ""
          }`}
          style={!open ? { color: "var(--text-muted)" } : undefined}
        />
      </button>

      {open && (
        <div className="border-t px-5 py-5 animate-[fadeIn_0.18s_ease-out]" style={{ borderColor: "var(--panel-border)" }}>
          {children}
        </div>
      )}
    </section>
  );
}
