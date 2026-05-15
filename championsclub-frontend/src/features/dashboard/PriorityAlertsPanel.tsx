import { AlertCircle, Info, TrendingDown } from "lucide-react";
import Card from "../../components/ui/Card";

type AlertItem = {
  id: string;
  title: string;
  advisorId: string;
  advisorName: string;
  email: string;
  summary: string;
  severity: string;
};

type PriorityAlertsPanelProps = {
  alerts: AlertItem[];
};

export default function PriorityAlertsPanel({
  alerts,
}: PriorityAlertsPanelProps) {
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

  return (
    <Card className="h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-cyan-100">Priority Alerts</h3>
        <p className="text-sm text-slate-400">
          Issues that require manager attention
        </p>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div
            className="rounded-xl border p-4 text-sm text-slate-400"
            style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
          >
            No alerts available.
          </div>
        ) : null}

        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl border ${getSeverityBorder(
              alert.severity
            )} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
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
                  <span className={getSeverityColor(alert.severity)}>
                    {getSeverityIcon(alert.severity)}
                  </span>

                  <h4 className="text-lg font-semibold text-slate-100">{alert.title}</h4>
                </div>

                <p className="mt-2 text-sm text-slate-400">{alert.summary}</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <img
                      src="/alert-icons/advisor-small.svg"
                      alt="Manager"
                      className="h-4 w-4 flex-shrink-0"
                    />
                    <span className="flex-shrink-0 text-slate-400">Manager</span>
                    <span className="min-w-0 truncate font-medium text-slate-200">{alert.advisorName}</span>
                  </div>

                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <img
                      src="/alert-icons/email-small.svg"
                      alt="Email"
                      className="h-4 w-4 flex-shrink-0"
                    />
                    <span className="flex-shrink-0 text-slate-400">Email</span>
                    <span className="min-w-0 truncate font-medium text-slate-200">{alert.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 md:gap-4">
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize ${getSeverityBadgeClasses(
                    alert.severity
                  )}`}
                >
                  {alert.severity}
                </span>


              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}