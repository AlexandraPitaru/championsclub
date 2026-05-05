import { useQuery } from "@tanstack/react-query";

import { getAdvisorActivitySummary } from "../api/advisorActivitySummaryService";
import type { KpiInterval } from "../api/managerStatisticsService";

type UseAdvisorActivitySummaryParams = {
  managerId: number | null;
  advisorId: number;
  interval: KpiInterval;
  enabled: boolean;
};

export function useAdvisorActivitySummary({
  managerId,
  advisorId,
  interval,
  enabled,
}: UseAdvisorActivitySummaryParams) {
  return useQuery({
    queryKey: ["advisor-activity-summary", managerId, advisorId, interval],
    queryFn: () => getAdvisorActivitySummary(managerId as number, advisorId, interval),
    enabled,
    retry: false,
  });
}
