import { useEffect, useMemo, useState } from "react";
import AppShell from "../app/layouts/AppShell";
import PerformanceTrendChart from "../components/charts/PerformanceTrendChart";
import AIExecutiveSummary from "../features/dashboard/AIExecutiveSummary";
import KPIStatCard from "../features/dashboard/KPIStatCard";
import LeaderboardPreview from "../features/dashboard/LeaderboardPreview";
import ManagerFilterDrawer from "../features/dashboard/ManagerFilterDrawer";
import PriorityAlertsPanel from "../features/dashboard/PriorityAlertsPanel";
import { usePerformanceTrendHook } from "../services/hooks/usePerformanceTrendHook";

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
  getLeaderboard,
} from "../services/api/dashboardService";
import { useManagerNotifications } from "../services/hooks/useManagerNotifications";

const DASHBOARD_FILTERS_STORAGE_KEY = "manager_dashboard_filters";

interface DashboardFilters {
  kpiScope: KpiScope;
  kpiInterval: KpiInterval;
}

function loadFiltersFromStorage(): DashboardFilters {
  try {
    const saved = localStorage.getItem(DASHBOARD_FILTERS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load dashboard filters from storage:", error);
  }
  return {
    kpiScope: "team",
    kpiInterval: "week",
  };
}

function saveFiltersToStorage(filters: DashboardFilters) {
  try {
    localStorage.setItem(DASHBOARD_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error("Failed to save dashboard filters to storage:", error);
  }
}

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

function getPriorityRank(priority: string): number {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  if (priority === "low") return 2;
  return 99;
}

export default function ManagerDashboardPage() {
  const initialFilters = loadFiltersFromStorage();

  const [kpiScope, setKpiScope] = useState<KpiScope>(initialFilters.kpiScope);
  const [kpiInterval, setKpiInterval] = useState<KpiInterval>(initialFilters.kpiInterval);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [advisorOptions, setAdvisorOptions] = useState<AdvisorOption[]>([]);
  const [isAdvisorsLoading, setIsAdvisorsLoading] = useState(false);

  const [kpiCards, setKpiCards] = useState<DashboardKpiCard[]>([]);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState("");

  const [leaderboardPreview, setLeaderboardPreview] = useState<
    Array<{
      id: string;
      name: string;
      dealership: string;
      points: number;
      tier: string;
    }>
  >([]);

  const currentUser = useMemo(() => getCurrentUserFromStorage(), []);
  
  const managerId =
    currentUser?.role?.toLowerCase() === "manager"
      ? Number(currentUser.user_id)
      : null;

  const {
  data: performanceTrend = [],
  isLoading: isTrendLoading,
  isError: isTrendError,
} = usePerformanceTrendHook(
  managerId,
  kpiScope,
  kpiInterval,
  selectedUserId
);

  const { data: notificationsData } = useManagerNotifications({
    managerId,
    limit: 10,
  });

  const dashboardAlerts = useMemo(() => {
    const notifications = notificationsData?.notifications ?? [];

    return [...notifications]
      .sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority))
      .slice(0, 5)
      .map((alert) => ({
        id: String(alert.alert_id),
        title: alert.title,
        advisorId: String(alert.user_id),
        advisorName: alert.employee_name,
        email: alert.employee_email,
        summary: alert.message,
        severity: alert.priority,
      }));
  }, [notificationsData]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage({
      kpiScope,
      kpiInterval,
    });
  }, [kpiScope, kpiInterval]);

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

  useEffect(() => {
    async function loadLeaderboardPreview() {
      try {
        const response = await getLeaderboard({
          interval: kpiInterval,
          sortBy: "points",
          sortDir: "desc",
          page: 1,
          pageSize: 10,
        });

        // Transform API data to LeaderboardPreview format
        const transformedData = response.items.slice(0, 5).map((item) => ({
          id: String(item.user_id),
          name: `${item.first_name} ${item.last_name}`,
          dealership: "Team", // API doesn't provide dealership, so using default
          points: item.points,
          tier: item.tier,
        }));

        setLeaderboardPreview(transformedData);
      } catch (error) {
        console.error("Failed to load leaderboard preview:", error);
        setLeaderboardPreview([]);
      }
    }

    loadLeaderboardPreview();
  }, [kpiInterval]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-100 md:text-3xl">
              Manager Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Overview of team performance, alerts, and coaching opportunities.
            </p>

            {isAdvisorsLoading && (
              <p className="mt-2 text-sm text-slate-400">
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
          {isTrendLoading && (
  <div className="h-[360px] animate-pulse rounded-2xl border border-[#29405b] bg-[#0d1a2b]" />
)}

{isTrendError && (
  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-300">
    Could not load performance trend.
  </div>
)}

{!isTrendLoading && !isTrendError && (
  <PerformanceTrendChart data={performanceTrend} />
)}
          <PriorityAlertsPanel alerts={dashboardAlerts} />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <LeaderboardPreview items={leaderboardPreview} />
          <AIExecutiveSummary />
        </section>
      </div>
    </AppShell>
  );
}