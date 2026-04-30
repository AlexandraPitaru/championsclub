import { useEffect, useMemo, useState } from "react";
import AppShell from "../app/layouts/AppShell";
import PerformanceTrendChart from "../components/charts/PerformanceTrendChart";
import AIExecutiveSummary from "../features/dashboard/AIExecutiveSummary";
import KPIStatCard from "../features/dashboard/KPIStatCard";
import LeaderboardPreview from "../features/dashboard/LeaderboardPreview";
import ManagerFilterDrawer from "../features/dashboard/ManagerFilterDrawer";
import PriorityAlertsPanel from "../features/dashboard/PriorityAlertsPanel";
import {
  mapTeamKpisToCards,
  mapUserKpisToCards,
  type DashboardKpiCard,
} from "../features/dashboard/kpiMapper";
import {
  getManagedUsers,
  getTeamKpis,
  getUserKpis,
  type AdvisorOption,
  type KpiInterval,
  type KpiScope,
} from "../services/api/managerStatisticsService";
import {
  alerts,
  leaderboard,
  performanceTrend,
} from "../services/mocks/demoData";

type StoredUser = {
  email: string;
  user_id: number;
  role: string;
};

function getCurrentUserFromStorage(): StoredUser | null {
  const currentUserRaw = localStorage.getItem("currentUser");

  if (!currentUserRaw) {
    return null;
  }

  try {
    return JSON.parse(currentUserRaw) as StoredUser;
  } catch {
    return null;
  }
}

export default function ManagerDashboardPage() {
  const [kpiScope, setKpiScope] = useState<KpiScope>("team");
  const [kpiInterval, setKpiInterval] = useState<KpiInterval>("week");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [advisorOptions, setAdvisorOptions] = useState<AdvisorOption[]>([]);
  const [isAdvisorsLoading, setIsAdvisorsLoading] = useState(false);

  const [kpiCards, setKpiCards] = useState<DashboardKpiCard[]>([]);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState("");

  const currentUser = useMemo(() => getCurrentUserFromStorage(), []);
  const managerId =
    currentUser?.role?.toLowerCase() === "manager"
      ? Number(currentUser.user_id)
      : null;

  useEffect(() => {
    async function loadManagedUsers() {
      if (!managerId) {
        return;
      }

      try {
        setIsAdvisorsLoading(true);

        const users = await getManagedUsers(managerId);

        const options = users.map((user) => ({
          id: user.user_id,
          name: `${user.first_name} ${user.last_name}`,
        }));

        setAdvisorOptions(options);

        if (!selectedUserId && options.length > 0) {
          setSelectedUserId(options[0].id);
        }
      } catch (error) {
        console.error(error);
        setAdvisorOptions([]);
      } finally {
        setIsAdvisorsLoading(false);
      }
    }

    loadManagedUsers();
  }, [managerId]);

  useEffect(() => {
    async function loadKpis() {
      if (!managerId) {
        setKpiError("No manager user found. Please login as manager.");
        setKpiCards([]);
        return;
      }

      setIsKpiLoading(true);
      setKpiError("");

      try {
        if (kpiScope === "team") {
          const response = await getTeamKpis(managerId, kpiInterval);
          setKpiCards(mapTeamKpisToCards(response.team_kpis));
          return;
        }

        if (kpiScope === "user") {
          if (!selectedUserId) {
            setKpiCards([]);
            setKpiError("Please select an advisor.");
            return;
          }

          const response = await getUserKpis(
            managerId,
            selectedUserId,
            kpiInterval
          );

          setKpiCards(mapUserKpisToCards(response));
        }
      } catch (error) {
        console.error(error);
        setKpiError("Could not load KPI data.");
        setKpiCards([]);
      } finally {
        setIsKpiLoading(false);
      }
    }

    loadKpis();
  }, [managerId, kpiScope, selectedUserId, kpiInterval]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Manager Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Overview of team performance, alerts, and coaching opportunities.
            </p>

            {isAdvisorsLoading && (
              <p className="mt-2 text-sm text-slate-500">
                Loading managed advisors...
              </p>
            )}
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

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isKpiLoading &&
            [1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}

          {kpiError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:col-span-2 xl:col-span-4">
              {kpiError}
            </div>
          )}

          {!isKpiLoading &&
            !kpiError &&
            kpiCards.map((kpi) => (
              <KPIStatCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                delta={kpi.delta}
                status={kpi.status}
              />
            ))}
        </section>

        <section className="grid grid-cols-1 gap-6">
          <PerformanceTrendChart data={performanceTrend} />
          <PriorityAlertsPanel alerts={alerts} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <LeaderboardPreview items={leaderboard} />
          <AIExecutiveSummary />
        </section>
      </div>
    </AppShell>
  );
}