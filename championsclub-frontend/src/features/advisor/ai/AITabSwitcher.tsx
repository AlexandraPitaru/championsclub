import { Brain, TrendingUp } from "lucide-react";

export type AITab = "analysis" | "forecast";

type Props = {
  active: AITab;
  onChange: (tab: AITab) => void;
};

const tabs: { value: AITab; label: string; icon: typeof Brain }[] = [
  { value: "analysis", label: "Performance Analysis", icon: Brain },
  { value: "forecast", label: "Forecast & Recommendations", icon: TrendingUp },
];

export default function AITabSwitcher({ active, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[#28415f] bg-[#0d1a2b] p-1">
      {tabs.map(({ value, label, icon: Icon }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              isActive
                ? "bg-cyan-400/90 text-[#04101e] shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                : "text-slate-300 hover:text-cyan-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
