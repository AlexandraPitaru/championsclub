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

export function mapTeamKpisToCards(kpis: TeamKpisData): DashboardKpiCard[] {
  return [
    {
      title: "Total Employees",
      value: String(kpis.total_employees),
      delta: "Managed advisors",
      status: "neutral",
    },
    {
      title: "Total Points",
      value: Number(kpis.total_points).toLocaleString(),
      delta: "Current team points",
      status: "positive",
    },
    {
      title: "Sales Amount",
      value: formatCurrency(kpis.total_sales_amount),
      delta: `${kpis.interval} interval`,
      status: "positive",
    },
    {
      title: "Products Sold",
      value: String(kpis.total_products_sold),
      delta: `${kpis.total_transactions} transactions`,
      status: "positive",
    },
  ];
}

export function mapUserKpisToCards(kpis: UserKpiResponse): DashboardKpiCard[] {
  return [
    {
      title: "Advisor Points",
      value: Number(kpis.total_points).toLocaleString(),
      delta: kpis.current_rank,
      status: "positive",
    },
    {
      title: "Credit",
      value: Number(kpis.credit).toLocaleString(),
      delta: "Redeemable balance",
      status: "neutral",
    },
    {
      title: "Sales Amount",
      value: formatCurrency(kpis.total_sales_amount),
      delta: `${kpis.interval} interval`,
      status: "positive",
    },
    {
      title: "Products Sold",
      value: String(kpis.total_products_sold),
      delta: `${kpis.total_transactions} transactions`,
      status: "positive",
    },
  ];
}