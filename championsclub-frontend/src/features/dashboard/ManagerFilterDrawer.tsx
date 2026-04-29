import { ListFilter, X } from "lucide-react";
import { useState } from "react";
import type {
  AdvisorOption,
  KpiInterval,
  KpiScope,
} from "../../services/api/managerStatisticsService";

type ManagerFilterDrawerProps = {
  scope: KpiScope;
  interval: KpiInterval;
  selectedUserId: number | null;
  advisors: AdvisorOption[];
  onScopeChange: (scope: KpiScope) => void;
  onIntervalChange: (interval: KpiInterval) => void;
  onUserChange: (userId: number | null) => void;
};

export default function ManagerFilterDrawer({
  scope,
  interval,
  selectedUserId,
  advisors,
  onScopeChange,
  onIntervalChange,
  onUserChange,
}: ManagerFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const scopeOptions: Array<{ value: KpiScope; label: string }> = [
    { value: "team", label: "Team performance" },
    { value: "user", label: "Advisor performance" },
  ];

  const intervalOptions: KpiInterval[] = ["day", "week", "month", "all"];

  const optionClass = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-medium transition ${
      active
        ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
        : "border-[#29405b] bg-[#0d1a2b] text-slate-200 hover:bg-[#112238]"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open filters"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/15 text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.18)] transition-all duration-150 hover:bg-cyan-500/20 hover:shadow-[0_0_24px_rgba(6,182,212,0.26)] active:scale-95"
      >
        <ListFilter className="h-5 w-5" />
      </button>

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close filters overlay"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-[#02060d]/70 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l border-[#29405b] bg-[#081322] p-6 shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-cyan-100">Filters</h2>
              <p className="mt-1 text-sm text-slate-400">
                Choose KPI scope and time interval.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-[#112238] hover:text-cyan-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-8">
            <section>
              <p className="mb-3 text-sm font-semibold text-slate-100">
                KPI Scope
              </p>

              <div className="grid grid-cols-1 gap-3">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={scope === option.value}
                    onClick={() => {
                      onScopeChange(option.value);

                      if (option.value === "team") {
                        onUserChange(null);
                      }
                    }}
                    className={optionClass(scope === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {scope === "user" && (
              <section>
                <p className="mb-3 text-sm font-semibold text-slate-100">
                  Advisor
                </p>

                {advisors.length === 0 ? (
                  <p className="rounded-xl border border-[#29405b] bg-[#0d1a2b] px-3 py-2 text-sm text-slate-400">
                    No advisors available for this manager.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {advisors.map((advisor) => (
                      <button
                        key={advisor.id}
                        type="button"
                        aria-pressed={selectedUserId === advisor.id}
                        onClick={() => onUserChange(advisor.id)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                          selectedUserId === advisor.id
                            ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                            : "border-[#29405b] bg-[#0d1a2b] text-slate-200 hover:bg-[#112238]"
                        }`}
                      >
                        {advisor.name}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section>
              <p className="mb-3 text-sm font-semibold text-slate-100">
                Time Interval
              </p>

              <div className="grid grid-cols-2 gap-2">
                {intervalOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={interval === value}
                    onClick={() => onIntervalChange(value)}
                    className={`${optionClass(interval === value)} capitalize`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-xl border border-cyan-500/50 bg-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
            >
              Apply filters
            </button>

            <button
              type="button"
              onClick={() => {
                onScopeChange("team");
                onIntervalChange("week");
                onUserChange(null);
                setIsOpen(false);
              }}
              className="rounded-xl border border-[#29405b] bg-[#0d1a2b] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-[#112238]"
            >
              Reset
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}