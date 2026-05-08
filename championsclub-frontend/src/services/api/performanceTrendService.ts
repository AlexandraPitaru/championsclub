import type { KpiInterval } from "./managerStatisticsService";
const API_BASE_URL = "http://localhost:8000";

function toApiInterval(interval: KpiInterval): Exclude<KpiInterval, "custom"> {
    return interval === "custom" ? "all" : interval;
}

type DateRangeFilter = {
    startDate?: string;
    endDate?: string;
};

export type PerformanceTrendDataPoint = {
    period: string;
    sales: number;
    points: number;
    target?: number;
};

export async function getPerformanceTrend(
    managerId: number,
    interval: KpiInterval,
    dateRange?: DateRangeFilter
): Promise<PerformanceTrendDataPoint[]> {
    const params = new URLSearchParams({ interval: toApiInterval(interval) });
    if (dateRange?.startDate) params.set("start_date", dateRange.startDate);
    if (dateRange?.endDate) params.set("end_date", dateRange.endDate);

    const response = await fetch(
        `${API_BASE_URL}/api/manager/dashboard/team/performance-trend?${params.toString()}`,
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
            interval: KpiInterval,
            dateRange?: DateRangeFilter
): Promise<PerformanceTrendDataPoint[]> {
            const params = new URLSearchParams({ interval: toApiInterval(interval) });
            if (dateRange?.startDate) params.set("start_date", dateRange.startDate);
            if (dateRange?.endDate) params.set("end_date", dateRange.endDate);

    const response = await fetch(
                `${API_BASE_URL}/api/manager/dashboard/users/${userId}/performance-trend?${params.toString()}`,
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