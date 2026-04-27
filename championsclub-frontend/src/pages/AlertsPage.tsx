import { useNavigate } from "react-router-dom";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import { alerts } from "../services/mocks/demoData";

const getSeverityClasses = (severity: string) => {
  if (severity === "high") {
    return "bg-red-100 text-red-700";
  }

  if (severity === "medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
};

export default function AlertsPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Alerts</h1>
          <p className="mt-2 text-slate-600">
            Review dealership and advisor issues that need manager attention.
          </p>
        </section>

        <section>
          <Card className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {alert.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{alert.summary}</p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(
                      alert.severity
                    )}`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
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
                  className="mt-4 text-[clamp(0.9rem,0.9vw,1rem)] font-semibold text-slate-900 transition hover:underline"
                >
                  View advisor
                </button>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </AppShell>
  );
}