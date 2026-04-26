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
      return "bg-red-100 text-red-700";
    }

    if (severity === "medium") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <Card className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Priority Alerts</h3>
        <p className="text-sm text-slate-500">
          Issues that require manager attention
        </p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="font-semibold text-slate-900">{alert.title}</h4>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(
                  alert.severity
                )}`}
              >
                {alert.severity}
              </span>
            </div>

            <p className="text-sm text-slate-600">{alert.summary}</p>

            <div className="mt-3 text-sm text-slate-500">
              <p>
                <span className="font-medium text-slate-700">Advisor:</span>{" "}
                {alert.advisorName}
              </p>
              <p>
                <span className="font-medium text-slate-700">Dealership:</span>{" "}
                {alert.dealership}
              </p>
            </div>

            <button
              onClick={() => navigate(`/advisor/${alert.advisorId}`)}
              className="mt-4 text-sm font-semibold text-slate-900 hover:underline"
            >
              View advisor
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}