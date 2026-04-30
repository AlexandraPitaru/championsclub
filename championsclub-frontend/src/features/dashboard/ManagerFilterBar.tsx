// In this file we will create a filter bar that lets us select a user or a team and it shows us the kpi's that are also filtered by time: day, week, month
type KpiScope = "user" | "team";
type KpiInterval = "day" | "week" | "month";

type AdvisorOption = {
  id: number;
  name: string;
};

type ManagerKpiFilterBarProps = {
  scope: KpiScope;
  interval: KpiInterval;
  selectedUserId: number | null;
  advisors: AdvisorOption[];
  onScopeChange: (scope: KpiScope) => void;
  onIntervalChange: (interval: KpiInterval) => void;
  onUserChange: (userId: number) => void;
};

export default function ManagerKpiFilterBar({
  scope,
  interval,
  selectedUserId,
  advisors,
  onScopeChange,
  onIntervalChange,
  onUserChange,
}: ManagerKpiFilterBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            KPI Filters
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Select whether to view team or advisor performance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[620px]">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Scope
            </label>
            <select
              value={scope}
              onChange={(event) => onScopeChange(event.target.value as KpiScope)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="team">Team performance</option>
              <option value="user">Advisor performance</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Advisor
            </label>
            <select
              value={selectedUserId ?? ""}
              disabled={scope !== "user"}
              onChange={(event) => onUserChange(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-900"
            >
              <option value="" disabled>
                Select advisor
              </option>

              {advisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {advisor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Interval
            </label>
            <select
              value={interval}
              onChange={(event) =>
                onIntervalChange(event.target.value as KpiInterval)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}