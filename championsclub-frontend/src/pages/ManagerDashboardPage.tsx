import { User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../app/layouts/AppShell";
import PerformanceTrendChart from "../components/charts/PerformanceTrendChart";
import KPIStatCard from "../features/dashboard/KPIStatCard";
import LeaderboardPreview from "../features/dashboard/LeaderboardPreview";
import ManagerFilterDrawer from "../features/dashboard/ManagerFilterDrawer";
import PriorityAlertsPanel from "../features/dashboard/PriorityAlertsPanel";
import { usePerformanceTrendHook } from "../services/hooks/usePerformanceTrendHook";

import AIExecutiveSummary from "../features/dashboard/AIExecutiveSummary";
import {
  mapTeamKpisToCards,
  mapUserKpisToCards,
  type DashboardKpiCard,
} from "../features/dashboard/kpiMapper";
import type { TeamKpisData } from "../services/api/managerStatisticsService";
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
import { compareManagerNotifications } from "../services/api/managerNotificationService";
import { useManagerNotifications } from "../services/hooks/useManagerNotifications";

const DASHBOARD_FILTERS_STORAGE_KEY = "manager_dashboard_filters";

interface DashboardFilters {
  kpiScope: KpiScope;
  kpiInterval: KpiInterval;
  selectedUserId: number | null;
}

function loadFiltersFromStorage(): DashboardFilters {
  try {
    const saved = localStorage.getItem(DASHBOARD_FILTERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<DashboardFilters>;

      return {
        kpiScope: parsed.kpiScope === "user" ? "user" : "team",
        kpiInterval:
          parsed.kpiInterval === "day" ||
          parsed.kpiInterval === "week" ||
          parsed.kpiInterval === "month" ||
          parsed.kpiInterval === "all"
            ? parsed.kpiInterval
            : "week",
        selectedUserId:
          typeof parsed.selectedUserId === "number" ? parsed.selectedUserId : null,
      };
    }
  } catch (error) {
    console.error("Failed to load dashboard filters from storage:", error);
  }
  return {
    kpiScope: "team",
    kpiInterval: "week",
    selectedUserId: null,
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

export default function ManagerDashboardPage() {
  const initialFilters = loadFiltersFromStorage();

  const [kpiScope, setKpiScope] = useState<KpiScope>(initialFilters.kpiScope);
  const [kpiInterval, setKpiInterval] = useState<KpiInterval>(initialFilters.kpiInterval);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialFilters.selectedUserId);

  const [advisorOptions, setAdvisorOptions] = useState<AdvisorOption[]>([]);
  const [isAdvisorsLoading, setIsAdvisorsLoading] = useState(false);

  const [kpiCards, setKpiCards] = useState<DashboardKpiCard[]>([]);
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState("");

  const [summaryTeamKpis, setSummaryTeamKpis] = useState<TeamKpisData | null>(null);

  const [leaderboardPreview, setLeaderboardPreview] = useState<
    Array<{
      id: string;
      name: string;
      dealership: string;
      points: number;
      tier: string;
      position?: number;
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

    const filtered =
      kpiScope === "user" && selectedUserId !== null
        ? notifications.filter((n) => n.user_id === selectedUserId)
        : notifications;

    return [...filtered]
      .sort(compareManagerNotifications)
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
  }, [notificationsData, kpiScope, selectedUserId]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage({
      kpiScope,
      kpiInterval,
      selectedUserId,
    });
  }, [kpiScope, kpiInterval, selectedUserId]);

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

        const hasPersistedSelection = options.some(
          (option) => option.id === selectedUserId
        );

        if (selectedUserId !== null && !hasPersistedSelection) {
          setSelectedUserId(options[0]?.id ?? null);
          return;
        }

        if (kpiScope === "user" && selectedUserId === null && options.length > 0) {
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
  }, [managerId, kpiScope, selectedUserId]);

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
    async function loadTeamKpisForSummary() {
      if (!managerId) return;
      try {
        const response = await getTeamKpis(managerId, kpiInterval);
        setSummaryTeamKpis(response.team_kpis);
      } catch {
        setSummaryTeamKpis(null);
      }
    }
    loadTeamKpisForSummary();
  }, [managerId, kpiInterval]);

  useEffect(() => {
    async function loadLeaderboardPreview() {
      try {
        if (kpiScope === "team" || selectedUserId === null) {
          const response = await getLeaderboard({
            interval: kpiInterval,
            sortBy: "points",
            sortDir: "desc",
            page: 1,
            pageSize: 10,
          });

          const transformedData = response.items.slice(0, 5).map((item) => ({
            id: String(item.user_id),
            name: `${item.first_name} ${item.last_name}`,
            dealership: "Team",
            points: item.points,
            tier: item.tier,
            position: item.position,
          }));

          setLeaderboardPreview(transformedData);
          return;
        }

        const firstPage = await getLeaderboard({
          interval: kpiInterval,
          sortBy: "points",
          sortDir: "desc",
          page: 1,
          pageSize: 50,
        });

        const allItems = [...firstPage.items];
        const totalPages = firstPage.pagination.total_pages;

        for (let page = 2; page <= totalPages; page += 1) {
          const pageResponse = await getLeaderboard({
            interval: kpiInterval,
            sortBy: "points",
            sortDir: "desc",
            page,
            pageSize: 50,
          });

          allItems.push(...pageResponse.items);
        }

        const selectedIndex = allItems.findIndex(
          (item) => item.user_id === selectedUserId
        );

        if (selectedIndex === -1) {
          setLeaderboardPreview([]);
          return;
        }

        const selectedTopFive = allItems.slice(selectedIndex, selectedIndex + 5);

        setLeaderboardPreview(
          selectedTopFive.map((item) => ({
            id: String(item.user_id),
            name: `${item.first_name} ${item.last_name}`,
            dealership: "Team",
            points: item.points,
            tier: item.tier,
            position: item.position,
          }))
        );
      } catch (error) {
        console.error("Failed to load leaderboard preview:", error);
        setLeaderboardPreview([]);
      }
    }

    loadLeaderboardPreview();
  }, [kpiInterval, kpiScope, selectedUserId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-100 md:text-3xl">
              Manager Dashboard: Where the Wins Get Loud
            </h1>
            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Track hot streaks, catch red flags before they bite, and spot the next coaching moment before your coffee gets cold.
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

        {kpiScope === "user" && selectedUserId !== null && (() => {
          const selectedAdvisor = advisorOptions.find((a) => a.id === selectedUserId);
          return selectedAdvisor ? (
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/20 text-cyan-300">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-cyan-400">Viewing advisor data</p>
                <p className="text-sm font-semibold text-cyan-100">{selectedAdvisor.name}</p>
              </div>
              <p className="ml-auto text-xs text-slate-400 hidden sm:block">KPI cards and trend below reflect this advisor only</p>
            </div>
          ) : null;
        })()}

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
          <LeaderboardPreview
            items={leaderboardPreview}
            subtitle={
              kpiScope === "user" && selectedUserId !== null
                ? "Selected advisor and next 4 positions"
                : "Top performing advisors"
            }
          />
          <AIExecutiveSummary
            teamKpis={summaryTeamKpis}
            interval={kpiInterval}
            managerId={managerId}
          />
        </section>
      </div>
    </AppShell>
  );
}