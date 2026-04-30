//Creating the api service that lets me conect and fetch the data for the manager dashboard, this will be used in the managerDashboardServicece.ts file, and will have functions like getManagerDashboardData, getManagerAlerts, getManagerKpis, etc. For now we will just create the functions and return mock data, but in the future we will connect it to the backend api.

export type KpiInterval = "day" | "week" | "month" | "all";
export type KpiScope = "team" | "user";

export type TeamKpisData ={
    total_employees: number;
    total_points: number;
    average_points: number;
    total_credit: number;
    interval: KpiInterval;
    total_transactions: number;
    total_sales_amount: number;
    total_points_earned: number;
    total_products_sold: number;
    last_transaction_date: string | null;
};

export type TeamKpisResponse = {
    manager_id: number;
    team_kpis: TeamKpisData;
};

export type UserKpiResponse = {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    current_rank: string;
    total_points: number;
    credit: number;
    status: string;
    interval: KpiInterval;
    total_transactions: number;
    total_sales_amount: number;
    total_points_earned: number;
    total_products_sold: number;
    last_transaction_date: string | null;
};

export type ManagedUserResponse = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  current_rank: string;
  total_points: number;
  credit: number;
  status: string;
};

export type AdvisorOption ={
  id: number;
  name: string;
}

const API_BASE_URL = "http://localhost:8000";

export async function getManagedUsers(
  managerId: number
): Promise<ManagedUserResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/manager/dashboard/users`, {
    headers: {
      "x-user-id": String(managerId),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch managed users");
  }

  return response.json();
}



export async function getTeamKpis(managerId: number, interval: KpiInterval): Promise<TeamKpisResponse>
 {
    const response = await fetch(
    `${API_BASE_URL}/api/manager/dashboard/team/kpis?interval=${interval}`,
    {
      headers: {
        "x-user-id": String(managerId),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch team KPIs");
  }

  return response.json();
}

export async function getUserKpis(
  managerId: number,
  userId: number,
  interval: KpiInterval
): Promise<UserKpiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/manager/dashboard/users/${userId}/kpis?interval=${interval}`,
    {
      headers: {
        "x-user-id": String(managerId),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user KPIs");
  }

  return response.json();
}