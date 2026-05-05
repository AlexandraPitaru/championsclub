import type {
  KpiInterval,
  TeamKpisData,
} from "./managerStatisticsService";

const API_BASE_URL = "http://localhost:8000";

export type ManagerTeamSummaryRequest = {
  interval: KpiInterval;
  total_employees: number;
  total_points: number;
  average_points: number;
  total_credit: number;
  total_transactions: number;
  total_sales_amount: number;
  total_points_earned: number;
  total_products_sold: number;
  last_transaction_date: string | null;
};

export type ManagerTeamSummaryResponse = {
  is_ai_generated: boolean;
  summary: string;
  fallback: boolean;
};

export function mapTeamKpisToSummaryPayload(
  teamKpis: TeamKpisData,
  interval: KpiInterval
): ManagerTeamSummaryRequest {
  return {
    interval,
    total_employees: teamKpis.total_employees,
    total_points: teamKpis.total_points,
    average_points: teamKpis.average_points,
    total_credit: teamKpis.total_credit,
    total_transactions: teamKpis.total_transactions,
    total_sales_amount: teamKpis.total_sales_amount,
    total_points_earned: teamKpis.total_points_earned,
    total_products_sold: teamKpis.total_products_sold,
    last_transaction_date: teamKpis.last_transaction_date,
  };
}

export async function generateManagerTeamSummary(
  payload: ManagerTeamSummaryRequest
): Promise<ManagerTeamSummaryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/manager/dashboard/summary`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate manager team summary");
  }

  return response.json();
}