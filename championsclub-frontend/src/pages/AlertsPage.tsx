import { useNavigate } from "react-router-dom";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import { alerts } from "../services/mocks/demoData";

const getSeverityClasses = (severity: string) => {
  if (severity === "high") {
    return "border border-rose-400/30 bg-rose-500/10 text-rose-300";
  }

  if (severity === "medium") {
    return "border border-amber-400/30 bg-amber-500/10 text-amber-300";
  }

  return "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
};

export default function AlertsPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-cyan-100">Alerts</h1>
          <p className="mt-2 text-slate-400">
            Review dealership and advisor issues that need manager attention.
          </p>
        </section>

        <section>
          <Card className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-[#22354d] bg-[#0c192b] p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      {alert.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">{alert.summary}</p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityClasses(
                      alert.severity
                    )}`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-400 md:grid-cols-2">
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
          </Card>
        </section>
      </div>
    </AppShell>
  );
}