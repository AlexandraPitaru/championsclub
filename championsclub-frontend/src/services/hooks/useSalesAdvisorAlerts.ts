import { useQuery } from "@tanstack/react-query";
import {
  getSalesAdvisorAlerts,
  type AlertPriority,
} from "../../services/api/salesAdvisorAlertsService";

type UseSalesAdvisorAlertsParams = {
  userId: number | null;
  priority?: string;
  isRead?: boolean;
  alertType?: string;
  limit?: number;
  offset?: number;
};

export function useSalesAdvisorAlerts({
  userId,
  priority,
  isRead,
  alertType,
  limit = 10,
  offset = 0,
}: UseSalesAdvisorAlertsParams) {
  return useQuery({
    queryKey: [
      "sales-advisor-alerts",
      userId,
      priority,
      isRead,
      alertType,
      limit,
      offset,
    ],
    queryFn: () =>
      getSalesAdvisorAlerts({
        userId: userId!,
        priority,
        isRead,
        alertType,
        limit,
        offset,
      }),
    enabled: Boolean(userId),
  });
}
