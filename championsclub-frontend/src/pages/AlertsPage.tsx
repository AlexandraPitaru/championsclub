import { useMemo, useState } from "react";
import { AlertCircle, Info, TrendingDown } from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import { useManagerNotifications } from "../services/hooks/useManagerNotifications";
import { compareManagerNotifications } from "../services/api/managerNotificationService";

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

const getSeverityIcon = (severity: string) => {
  if (severity === "high") return <AlertCircle className="h-6 w-6" />;
  if (severity === "medium") return <Info className="h-6 w-6" />;
  return <TrendingDown className="h-6 w-6" />;
};

const getSeverityColor = (severity: string) => {
  if (severity === "high") return "text-rose-400";
  if (severity === "medium") return "text-amber-400";
  return "text-cyan-400";
};

const getSeverityBorder = (severity: string) => {
  if (severity === "high") return "border-l-4 border-l-rose-500";
  if (severity === "medium") return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-cyan-500";
};

const getSeverityBadgeClasses = (severity: string) => {
  if (severity === "high") {
    return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
  }
  if (severity === "medium") {
    return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
  }
  return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
};

export default function AlertsPage() {

  const currentUser = useMemo(() => getCurrentUserFromStorage(), []);

const managerId =
  currentUser?.role?.toLowerCase() === "manager"
    ? Number(currentUser.user_id)
    : null;

const {
  data: notificationsData,
  isLoading,
  isError,
} = useManagerNotifications({
  managerId,
  limit: 10,
});

const alerts = notificationsData?.notifications ?? [];

  const [priorityFilter, setPriorityFilter] = useState<"high" | "medium" | "low" | null>(null);

  const sortedAlerts = useMemo(
    () => [...alerts].sort(compareManagerNotifications),
    [alerts]
  );

  const filteredAlerts = useMemo(
    () =>
      priorityFilter === null
        ? sortedAlerts
        : sortedAlerts.filter((a) => a.priority === priorityFilter),
    [sortedAlerts, priorityFilter]
  );

  const unreadAlertsCount = useMemo(
    () => filteredAlerts.length,
    [filteredAlerts]
  );

   const highPriorityCount = alerts.filter(
    (a) => a.priority === "high"
  ).length;

  const mediumPriorityCount = alerts.filter(
    (a) => a.priority === "medium"
  ).length;

  const lowPriorityCount = alerts.filter(
    (a) => a.priority === "low"
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-cyan-100">Alerts</h1>
              <span className="rounded-full border border-rose-500/50 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
                {unreadAlertsCount} unread
              </span>
            </div>
            <p className="mt-2 text-slate-400">
              Review dealership and advisor issues that need manager attention.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setPriorityFilter(priorityFilter === "high" ? null : "high")}
            className={`w-full text-left rounded-2xl border border-l-4 border-l-rose-500 p-4 transition-all duration-150 focus:outline-none ${
              priorityFilter === "high"
                ? "ring-2 ring-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.25)]"
                : "ring-1"
            }`}
            style={{
              background: "var(--panel-soft-bg)",
              borderColor: "var(--panel-border)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold" style={{ color: "var(--summary-text)" }}>{highPriorityCount}</p>
                <p className="text-sm text-slate-400">High Priority</p>
                {priorityFilter === "high" && (
                  <p className="mt-1 text-xs font-medium text-rose-400">Filtering active — click to clear</p>
                )}
              </div>
              <div className="flex-shrink-0 rounded-lg bg-rose-500/20 p-3">
                <img src="/alert-icons/high-priority-warning.svg" alt="High priority warning" className="h-5 w-5" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter(priorityFilter === "medium" ? null : "medium")}
            className={`w-full text-left rounded-2xl border border-l-4 border-l-amber-500 p-4 transition-all duration-150 focus:outline-none ${
              priorityFilter === "medium"
                ? "ring-2 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                : "ring-1"
            }`}
            style={{
              background: "var(--panel-soft-bg)",
              borderColor: "var(--panel-border)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold" style={{ color: "var(--summary-text)" }}>{mediumPriorityCount}</p>
                <p className="text-sm text-slate-400">Medium Priority</p>
                {priorityFilter === "medium" && (
                  <p className="mt-1 text-xs font-medium text-amber-400">Filtering active — click to clear</p>
                )}
              </div>
              <div className="flex-shrink-0 rounded-lg bg-amber-500/20 p-3">
                <img src="/alert-icons/medium-priority-warning.svg" alt="Medium priority warning" className="h-5 w-5" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter(priorityFilter === "low" ? null : "low")}
            className={`w-full text-left rounded-2xl border border-l-4 border-l-cyan-500 p-4 transition-all duration-150 focus:outline-none ${
              priorityFilter === "low"
                ? "ring-2 ring-cyan-500/60 shadow-[0_0_16px_rgba(6,182,212,0.25)]"
                : "ring-1"
            }`}
            style={{
              background: "var(--panel-soft-bg)",
              borderColor: "var(--panel-border)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold" style={{ color: "var(--summary-text)" }}>{lowPriorityCount}</p>
                <p className="text-sm text-slate-400">Low Priority</p>
                {priorityFilter === "low" && (
                  <p className="mt-1 text-xs font-medium text-cyan-400">Filtering active — click to clear</p>
                )}
              </div>
              <div className="flex-shrink-0 rounded-lg bg-cyan-500/20 p-3">
                <img src="/alert-icons/low-priority-warning.svg" alt="Low priority warning" className="h-5 w-5" />
              </div>
            </div>
          </button>
        </section>

         {isLoading && (
          <Card style={{ background: "var(--panel-soft-bg)", borderColor: "var(--panel-border)" }}>
            <p className="text-sm text-slate-400">
              Loading notifications...
            </p>
          </Card>
        )}

        
        {isError && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <p className="text-sm text-rose-300">
              Could not load notifications.
            </p>
          </Card>
        )}

        {!isLoading && !isError && alerts.length === 0 && (
          <Card style={{ background: "var(--panel-soft-bg)", borderColor: "var(--panel-border)" }}>
            <p className="text-sm text-slate-400">
              No notifications available.
            </p>
          </Card>
        )}

        {!isLoading && !isError && alerts.length > 0 && filteredAlerts.length === 0 && (
          <Card style={{ background: "var(--panel-soft-bg)", borderColor: "var(--panel-border)" }}>
            <p className="text-sm text-slate-400">
              No {priorityFilter} priority alerts found.
            </p>
          </Card>
        )}

        <section className="space-y-4">
          {!isLoading &&
            !isError &&
            filteredAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={`rounded-xl border ${getSeverityBorder(
                  alert.priority
                )} p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg`}
                style={{
                  borderTopColor: "var(--panel-border)",
                  borderRightColor: "var(--panel-border)",
                  borderBottomColor: "var(--panel-border)",
                  background: "var(--panel-soft-bg)",
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={getSeverityColor(alert.priority)}>
                        {getSeverityIcon(alert.priority)}
                      </span>

                      <h2 className="text-lg font-semibold text-slate-100">
                        {alert.title}
                      </h2>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {alert.message}
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <img
                          src="/alert-icons/advisor-small.svg"
                          alt="Manager"
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <span className="flex-shrink-0 text-slate-400">Manager</span>
                        <span className="min-w-0 truncate font-medium text-slate-200">
                          {alert.employee_name}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <img
                          src="/alert-icons/email-small.svg"
                          alt="Employee email"
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <span className="flex-shrink-0 text-slate-400">Email</span>
                        <span className="min-w-0 truncate font-medium text-slate-200">
                          {alert.employee_email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 md:gap-4">
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize ${getSeverityBadgeClasses(
                        alert.priority
                      )}`}
                    >
                      {alert.priority}
                    </span>


                  </div>
                </div>
              </div>
            ))}
        </section>
      </div>
    </AppShell>
  );
}