import type {
  TeamKpisData,
  UserKpiResponse,
} from "../../services/api/managerStatisticsService";

export type DashboardKpiCard = {
  title: string;
  value: string;
  delta: string;
  status: "positive" | "negative" | "neutral";
};

function formatCurrency(value: number) {
  return `€${Number(value).toLocaleString()}`;
}

function getIntervalContextLabel(interval: TeamKpisData["interval"]): string {
  switch (interval) {
    case "day":
      return "today";
    case "week":
      return "this week";
    case "month":
      return "this month";
    case "all":
      return "all time";
    case "custom":
      return "the selected period";
    default:
      return "the selected period";
  }
}

export function mapTeamKpisToCards(kpis: TeamKpisData): DashboardKpiCard[] {
  const intervalContext = getIntervalContextLabel(kpis.interval);
  const hasPointsProgress = kpis.total_points > 0;
  const hasSalesProgress = kpis.total_sales_amount > 0;
  const hasProductsProgress = kpis.total_products_sold > 0;

  return [
    {
      title: "Total Employees",
      value: String(kpis.total_employees),
      delta: "Active advisors on your team",
      status: "neutral",
    },
    {
      title: "Sales Amount",
      value: formatCurrency(kpis.total_sales_amount),
      delta: `Sales generated ${intervalContext}`,
      status: hasSalesProgress ? "positive" : "negative",
    },
    {
      title: "Products Sold",
      value: String(kpis.total_products_sold),
      delta: `${kpis.total_transactions} transactions`,
      status: hasProductsProgress ? "positive" : "negative",
    },
    {
      title: "Reward Points",
      value: Number(kpis.total_points).toLocaleString(),
      delta: `Reward points earned ${intervalContext}`,
      status: hasPointsProgress ? "positive" : "negative",
    },
  ];
}

export function mapUserKpisToCards(kpis: UserKpiResponse): DashboardKpiCard[] {
  const intervalContext = getIntervalContextLabel(kpis.interval);
  const hasPointsProgress = kpis.total_points > 0;
  const hasSalesProgress = kpis.total_sales_amount > 0;
  const hasProductsProgress = kpis.total_products_sold > 0;

  return [
    {
      title: "Sales Amount",
      value: formatCurrency(kpis.total_sales_amount),
      delta: `Sales generated ${intervalContext}`,
      status: hasSalesProgress ? "positive" : "negative",
    },
    {
      title: "Products Sold",
      value: String(kpis.total_products_sold),
      delta: `${kpis.total_transactions} transactions`,
      status: hasProductsProgress ? "positive" : "negative",
    },
    {
      title: "Reward Points",
      value: Number(kpis.total_points).toLocaleString(),
      delta: `Reward points earned ${intervalContext}`,
      status: hasPointsProgress ? "positive" : "negative",
    },
    {
      title: "Credit",
      value: Number(kpis.credit).toLocaleString(),
      delta: "Redeemable balance",
      status: "neutral",
    },
  ];
}