import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";



type AlertItem = {
  id: string;
  title: string;
  advisorId: string;
  advisorName: string;
  dealership: string;
  summary: string;
  severity: string;
};

type PriorityAlertsPanelProps = {
  alerts: AlertItem[];
};

export default function PriorityAlertsPanel({
  alerts,
}: PriorityAlertsPanelProps) {
  const navigate = useNavigate();

  const getSeverityClasses = (severity: string) => {
    if (severity === "high") {
      return "border border-rose-400/30 bg-rose-500/10 text-rose-300";
    }

    if (severity === "medium") {
      return "border border-amber-400/30 bg-amber-500/10 text-amber-300";
    }

    return "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
  };

  return (
    <Card className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-cyan-100">Priority Alerts</h3>
        <p className="text-sm text-slate-400">
          Issues that require manager attention
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-[#22354d] bg-[#0c192b] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="font-semibold text-slate-100">{alert.title}</h4>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(
                  alert.severity
                )}`}
              >
                {alert.severity}
              </span>
            </div>

            <p className="text-sm text-slate-300">{alert.summary}</p>

            <div className="mt-3 text-sm text-slate-400">
              <p>
                <span className="font-medium text-slate-200">Advisor:</span>{" "}
                {alert.advisorName}
              </p>
              <p>
                <span className="font-medium text-slate-200">Dealership:</span>{" "}
                {alert.dealership}
              </p>
            </div>

            <button
              onClick={() => navigate(`/advisor/${alert.advisorId}`)}
              className="mt-4 text-[clamp(0.9rem,0.9vw,1rem)] font-semibold text-cyan-300 transition hover:text-cyan-200 hover:underline"
            >
              View advisor
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}