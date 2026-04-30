import { useQuery } from "@tanstack/react-query";
import type {KpiInterval,KpiScope,} from "../api/managerStatisticsService";
import { getPerformanceTrend, getUserPerformanceTrend } from "../api/performanceTrendService";

export function usePerformanceTrendHook(managerId: number | null, kpiScope: KpiScope, interval: KpiInterval, selectedUserId: number | null) 

    {
  return useQuery({
    queryKey: [
      "performance-trend",
      managerId,
      kpiScope,
      selectedUserId,
      interval,
    ],
    queryFn: () => {
      if (!managerId) {
        throw new Error("Missing manager id");
      }

      if (kpiScope === "team") {
        return getPerformanceTrend(managerId, interval);
      }

      if (!selectedUserId) {
        throw new Error("Missing selected advisor");
      }

      return getUserPerformanceTrend(managerId, selectedUserId, interval);
    },
    enabled:
      Boolean(managerId) &&
      (kpiScope === "team" || Boolean(selectedUserId)),
  });
}