import AppShell from "../app/layouts/AppShell";
import PerformanceTrendChart from "../components/charts/PerformanceTrendChart";
import AIExecutiveSummary from "../features/dashboard/AIExecutiveSummary";
import KPIStatCard from "../features/dashboard/KPIStatCard";
import LeaderboardPreview from "../features/dashboard/LeaderboardPreview";
import PriorityAlertsPanel from "../features/dashboard/PriorityAlertsPanel";
import { useState } from "react";
import { advisorOptions } from "../services/mocks/demoData";
import ManagerFilterDrawer from "../features/dashboard/ManagerFilterDrawer";

import {
  alerts,
  dashboardKpis,
  leaderboard,
  performanceTrend,
} from "../services/mocks/demoData";

export default function ManagerDashboardPage() {
   const [kpiScope, setKpiScope] = useState<"team" | "user">("team");
  const [kpiInterval, setKpiInterval] = useState<"day" | "week" | "month">("week");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(101);

  return (
    <AppShell showTopbar={false}>
      <div className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-cyan-100">
              Manager Dashboard
            </h1>
            <p className="mt-2 text-slate-400">
              Overview of team performance, alerts, and coaching opportunities.
            </p>
          </div>

          <ManagerFilterDrawer
            scope={kpiScope}
            interval={kpiInterval}
            selectedUserId={selectedUserId}
            advisors={advisorOptions}
            onScopeChange={setKpiScope}
            onIntervalChange={setKpiInterval}
            onUserChange={setSelectedUserId}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardKpis.map((kpi) => (
            <KPIStatCard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              delta={kpi.delta}
              status={kpi.status as "positive" | "negative" | "neutral"}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <PerformanceTrendChart data={performanceTrend} chartIdSuffix="primary" />
            <PerformanceTrendChart data={performanceTrend} chartIdSuffix="secondary" />
          </div>
          <PriorityAlertsPanel alerts={alerts} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <LeaderboardPreview items={leaderboard} />
          <AIExecutiveSummary />
        </section>
      </div>
    </AppShell>
  );
}