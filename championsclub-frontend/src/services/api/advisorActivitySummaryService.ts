import type { KpiInterval } from "./managerStatisticsService";



export type AdvisorActivitySummaryResponse = {
  advisor_id: number;
  interval: KpiInterval;
  is_ai_generated: boolean;
  summary: string;
  fallback: boolean;
};

export async function getAdvisorActivitySummary(
  managerId: number,
  advisorId: number,
  interval: KpiInterval
): Promise<AdvisorActivitySummaryResponse> {
  const response = await fetch(
    `/api/manager/profile/users/${advisorId}/activity-summary?interval=${interval}`,
    {
      headers: {
        "x-user-id": String(managerId),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch advisor activity summary");
  }

  return response.json();
}
