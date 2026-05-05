import Card from "../../components/ui/Card";

export default function AIExecutiveSummary() {
  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          AI Executive Summary
        </h3>
        <p className="text-sm text-slate-500">
          Data-driven highlights for this period
        </p>
      </div>

      <div className="space-y-3 text-sm leading-6 text-slate-700">
        <p>
          Team performance remains stable overall, but one dealership is showing
          a decline in financing conversion and may miss its monthly target.
        </p>
        <p>
          The strongest opportunity is service bundle attachment, where top
          advisors are outperforming the rest of the network.
        </p>
        <p>
          Recommended action: focus coaching on low-performing advisors and
          replicate best practices from top Silver and Gold performers.
        </p>
      </div>
    </Card>
  );
}