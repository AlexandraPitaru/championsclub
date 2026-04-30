import type { KpiInterval } from "./managerStatisticsService";
const API_BASE_URL = "http://localhost:8000";

export type PerformanceTrendDataPoint = {
    period: string;
    sales: number;
    points: number;
    target?: number;
};

export async function getPerformanceTrend(
    managerId: number,
    interval: KpiInterval    
): Promise<PerformanceTrendDataPoint[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/manager/dashboard/team/performance-trend?interval=${interval}`,
        {
            headers: {
                "x-user-id": String(managerId),
            },
        }
    );
     if (!response.ok) {
    throw new Error("Failed to fetch team performance trend");
  }

  return response.json();
        }

        export async function getUserPerformanceTrend(
    managerId: number,
    userId: number,
    interval: KpiInterval    
): Promise<PerformanceTrendDataPoint[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/manager/dashboard/users/${userId}/performance-trend?interval=${interval}`,
        {
            headers: {
                "x-user-id": String(managerId),
            },
        }
    );
    if (!response.ok) {
        throw new Error("Failed to fetch user performance trend");
    }

    return response.json();
}