import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Info, TrendingDown } from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import { useManagerNotifications } from "../services/hooks/useManagerNotifications";

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

const getSeverityButtonClasses = (severity: string) => {
  if (severity === "high") {
    return "border border-rose-500/50 text-rose-300 hover:bg-rose-500/10";
  }
  if (severity === "medium") {
    return "border border-amber-500/50 text-amber-300 hover:bg-amber-500/10";
  }
  return "border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10";
};

const getSeverityRank = (severity: string) => {
  if (severity === "high") return 0;
  if (severity === "medium") return 1;
  if (severity === "low") return 2;
  return 99;
};


export default function AlertsPage() {
  const navigate = useNavigate();

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
const unreadAlertsCount = notificationsData?.unread_alerts ?? 0;

  const sortedAlerts = useMemo(
    () =>
      [...alerts].sort(
        (a, b) => getSeverityRank(a.priority) - getSeverityRank(b.priority)
      ),
    [alerts]
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
              {unreadAlertsCount > 0 ? (
                <span className="rounded-full border border-rose-500/50 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
                  {unreadAlertsCount} unread
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-slate-400">
              Review dealership and advisor issues that need manager attention.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="flex items-center justify-between gap-4 border-l-4 border-l-rose-500 bg-[#0c192b]">
            <div>
              <p className="text-3xl font-bold text-slate-100">{highPriorityCount}</p>
              <p className="text-sm text-slate-400">High Priority</p>
            </div>
            <div className="flex-shrink-0 rounded-lg bg-rose-500/20 p-3">
              <img
                src="/alert-icons/high-priority-warning.svg"
                alt="High priority warning"
                className="h-5 w-5"
              />
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-4 border-l-4 border-l-amber-500 bg-[#0c192b]">
            <div>
              <p className="text-3xl font-bold text-slate-100">{mediumPriorityCount}</p>
              <p className="text-sm text-slate-400">Medium Priority</p>
            </div>
            <div className="flex-shrink-0 rounded-lg bg-amber-500/20 p-3">
              <img
                src="/alert-icons/medium-priority-warning.svg"
                alt="Medium priority warning"
                className="h-5 w-5"
              />
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-4 border-l-4 border-l-cyan-500 bg-[#0c192b]">
            <div>
              <p className="text-3xl font-bold text-slate-100">{lowPriorityCount}</p>
              <p className="text-sm text-slate-400">Low Priority</p>
            </div>
            <div className="flex-shrink-0 rounded-lg bg-cyan-500/20 p-3">
              <img
                src="/alert-icons/low-priority-warning.svg"
                alt="Low priority warning"
                className="h-5 w-5"
              />
            </div>
          </Card>
        </section>

         {isLoading && (
          <Card className="bg-[#0c192b]">
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
          <Card className="bg-[#0c192b]">
            <p className="text-sm text-slate-400">
              No notifications available.
            </p>
          </Card>
        )}

        <section className="space-y-4">
          {!isLoading &&
            !isError &&
            sortedAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={`rounded-xl border border-[#28415f] ${getSeverityBorder(
                  alert.priority
                )} bg-[#0c192b] p-6 transition hover:bg-[#0f2139]`}
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
                      <div className="flex items-center gap-2 text-sm">
                        <img
                          src="/alert-icons/advisor-small.svg"
                          alt="Advisor"
                          className="h-4 w-4"
                        />
                        <span className="text-slate-400">Advisor</span>
                        <span className="font-medium text-slate-200">
                          {alert.employee_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <img
                          src="/alert-icons/email-small.svg"
                          alt="Employee email"
                          className="h-4 w-4"
                        />
                        <span className="text-slate-400">Email</span>
                        <span className="font-medium text-slate-200">
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

                    <button
                      onClick={() => navigate(`/advisor/${alert.user_id}`)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${getSeverityButtonClasses(
                        alert.priority
                      )}`}
                    >
                      View advisor
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </section>
      </div>
    </AppShell>
  );
}