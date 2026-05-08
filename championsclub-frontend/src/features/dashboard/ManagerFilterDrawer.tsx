import { ListFilter, X } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  AdvisorOption,
  KpiInterval,
  KpiScope,
} from "../../services/api/managerStatisticsService";
import { formatFriendlyCustomRangeLabel } from "../../utils/dateFormatting";

type ManagerFilterDrawerProps = {
  scope: KpiScope;
  interval: KpiInterval;
  startDate?: string;
  endDate?: string;
  selectedUserId: number | null;
  advisors: AdvisorOption[];
  onScopeChange: (scope: KpiScope) => void;
  onIntervalChange: (interval: KpiInterval) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onUserChange: (userId: number | null) => void;
};

export default function ManagerFilterDrawer({
  scope,
  interval,
  startDate,
  endDate,
  selectedUserId,
  advisors,
  onScopeChange,
  onIntervalChange,
  onStartDateChange,
  onEndDateChange,
  onUserChange,
}: ManagerFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [advisorSearch, setAdvisorSearch] = useState("");

  const scopeOptions: Array<{ value: KpiScope; label: string }> = [
    { value: "team", label: "Team performance" },
    { value: "user", label: "Advisor performance" },
  ];

  const intervalOptions: KpiInterval[] = ["day", "week", "month", "all", "custom"];

  const filteredAdvisors = useMemo(() => {
    const normalizedQuery = advisorSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return advisors;
    }

    return advisors.filter((advisor) =>
      advisor.name.toLowerCase().includes(normalizedQuery)
    );
  }, [advisorSearch, advisors]);

  const customRangeLabel = useMemo(
    () => formatFriendlyCustomRangeLabel(startDate, endDate),
    [startDate, endDate]
  );

  const optionClass = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-medium transition ${
      active
        ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
        : "text-slate-200"
    }`;

  return (
    <>
      <style>{`.scrollbar-hidden::-webkit-scrollbar { display: none; }`}</style>
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
          className={`absolute inset-0 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "color-mix(in srgb, var(--bg) 8%, transparent)" }}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l p-6 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            borderColor: "var(--panel-border-strong)",
            background: "color-mix(in srgb, var(--panel-input-bg) 18%, transparent)",
          }}
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
              className="rounded-lg p-2 text-slate-400 transition hover:text-cyan-100"
              style={{ background: "transparent" }}
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
                    style={
                      scope === option.value
                        ? undefined
                        : { borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }
                    }
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
                  <p
                    className="rounded-xl border px-3 py-2 text-sm text-slate-400"
                    style={{ borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }}
                  >
                    No advisors available for this manager.
                  </p>
                ) : (
                  <>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                      Search advisor by name
                    </label>
                    <input
                      type="text"
                      value={advisorSearch}
                      onChange={(event) => setAdvisorSearch(event.target.value)}
                      placeholder="Type an advisor name..."
                      className="mb-3 w-full rounded-xl border px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/60"
                      style={{ borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }}
                    />

                    {filteredAdvisors.length === 0 ? (
                      <p
                        className="rounded-xl border px-3 py-2 text-sm text-slate-400"
                        style={{ borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }}
                      >
                        No advisors found for "{advisorSearch.trim()}".
                      </p>
                    ) : (
                      <div
                        className="max-h-36 overflow-y-auto space-y-2 scrollbar-hidden"
                        style={{
                          scrollbarWidth: "none" as const,
                          msOverflowStyle: "none" as const,
                        } as React.CSSProperties & { scrollbarWidth: string; msOverflowStyle: string }}
                      >
                        {filteredAdvisors.map((advisor) => (
                          <button
                            key={advisor.id}
                            type="button"
                            aria-pressed={selectedUserId === advisor.id}
                            onClick={() => onUserChange(advisor.id)}
                            className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                              selectedUserId === advisor.id
                                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100"
                                : "text-slate-200"
                            }`}
                            style={
                              selectedUserId === advisor.id
                                ? undefined
                                : { borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }
                            }
                          >
                            {advisor.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
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
                    onClick={() => {
                      onIntervalChange(value);
                      if (value !== "custom") {
                        onStartDateChange("");
                        onEndDateChange("");
                      }
                    }}
                    className={`${optionClass(interval === value)} min-h-10 ${
                      value === "custom" ? "col-span-2" : ""
                    } ${value === "custom" && interval === "custom" ? "normal-case" : "capitalize"}`}
                    style={
                      interval === value
                        ? undefined
                        : { borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }
                    }
                  >
                    {value === "custom"
                      ? interval === "custom"
                        ? customRangeLabel
                        : "Custom Date"
                      : value}
                  </button>
                ))}
              </div>
            </section>

            {interval === "custom" ? (
            <section>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                      From
                    </label>
                    <input
                      type="date"
                      value={startDate ?? ""}
                      max={endDate || undefined}
                      onChange={(event) => onStartDateChange(event.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
                      style={{ borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                      To
                    </label>
                    <input
                      type="date"
                      value={endDate ?? ""}
                      min={startDate || undefined}
                      onChange={(event) => onEndDateChange(event.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
                      style={{ borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }}
                    />
                  </div>

                  <p className="sm:col-span-2 text-xs text-slate-400">
                    Pick the exact date window for the custom interval.
                  </p>
                </div>
            </section>
            ) : null}
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
                onStartDateChange("");
                onEndDateChange("");
                onUserChange(null);
                setAdvisorSearch("");
                setIsOpen(false);
              }}
              className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-200 transition"
              style={{ borderColor: "var(--panel-border-strong)", background: "var(--panel-bg)" }}
            >
              Reset
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}