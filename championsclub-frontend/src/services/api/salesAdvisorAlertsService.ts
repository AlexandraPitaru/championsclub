const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
  const searchParams = new URLSearchParams();

  if (params.priority) {
    searchParams.append("priority", params.priority);
  }

  if (params.isRead !== undefined) {
    searchParams.append("is_read", String(params.isRead));
  }

  if (params.alertType) {
    searchParams.append("alert_type", params.alertType);
  }

  if (params.limit !== undefined) {
    searchParams.append("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.append("offset", String(params.offset));
  }

  const url = new URL(`${API_BASE_URL}/api/sales-advisor/alerts`);
  url.search = searchParams.toString();

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": String(params.userId),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sales advisor alerts: ${response.statusText}`
    );
  }

  return response.json();
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
