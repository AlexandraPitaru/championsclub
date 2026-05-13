import axiosInstance from "./axiosInstance";

export type AlertPriority = "high" | "medium" | "low";

export type SalesAdvisorAlertItem = {
  alert_id: number;
  alert_type: string;
  title: string;
  message: string;
  priority: AlertPriority;
  is_read: boolean;
  created_at: string | null;
};

export type SalesAdvisorAlertsResponse = {
  user_id: number;
  total_alerts: number;
  unread_alerts: number;
  limit: number;
  offset: number;
  has_more: boolean;
  next_offset: number | null;
  alerts: SalesAdvisorAlertItem[];
};

type GetSalesAdvisorAlertsParams = {
  userId: number;
  priority?: string;
  isRead?: boolean;
  alertType?: string;
  limit?: number;
  offset?: number;
};

export async function getSalesAdvisorAlerts(
  params: GetSalesAdvisorAlertsParams
): Promise<SalesAdvisorAlertsResponse> {
  const response = await axiosInstance.get<SalesAdvisorAlertsResponse>(
    "/api/sales-advisor/alerts",
    {
      headers: { "X-User-Id": String(params.userId) },
      params: {
        ...(params.priority !== undefined && { priority: params.priority }),
        ...(params.isRead !== undefined && { is_read: params.isRead }),
        ...(params.alertType !== undefined && { alert_type: params.alertType }),
        ...(params.limit !== undefined && { limit: params.limit }),
        ...(params.offset !== undefined && { offset: params.offset }),
      },
    }
  );

  return response.data;
}

function getAlertPriorityRank(priority: AlertPriority): number {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  if (priority === "low") return 2;
  return 99;
}

function getAlertTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function compareSalesAdvisorAlerts(
  left: SalesAdvisorAlertItem,
  right: SalesAdvisorAlertItem
): number {
  const priorityDifference =
    getAlertPriorityRank(left.priority) - getAlertPriorityRank(right.priority);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return getAlertTimestamp(right.created_at) - getAlertTimestamp(left.created_at);
}
