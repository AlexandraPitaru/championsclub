

export type NotificationPriority = "high" | "medium" | "low";

export type ManagerNotificationItem = {
  alert_id: number;
  user_id: number;
  employee_name: string;
  employee_email: string;
  employee_number: string;
  rank: string;
  points: number;
  alert_type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string | null;
};

export type ManagerNotificationsResponse = {
  manager_id: number;
  total_alerts: number;
  unread_alerts: number;
  limit: number;
  offset: number;
  has_more: boolean;
  next_offset: number | null;
  notifications: ManagerNotificationItem[];
};

function getNotificationPriorityRank(priority: NotificationPriority): number {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  if (priority === "low") return 2;
  return 99;
}

function getNotificationTimestamp(value: string | null): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function compareManagerNotifications(
  left: ManagerNotificationItem,
  right: ManagerNotificationItem
): number {
  const priorityDifference =
    getNotificationPriorityRank(left.priority) -
    getNotificationPriorityRank(right.priority);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return getNotificationTimestamp(right.created_at) - getNotificationTimestamp(left.created_at);
}

type GetManagerNotificationsParams = {
  managerId: number;
  priority?: NotificationPriority;
  isRead?: boolean;
  limit?: number;
  offset?: number;
};

export async function getManagerNotifications({
  managerId,
  priority,
  isRead,
  limit = 10,
  offset = 0,
}: GetManagerNotificationsParams): Promise<ManagerNotificationsResponse> {
  const params = new URLSearchParams();

  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (priority) {
    params.set("priority", priority);
  }

  if (isRead !== undefined) {
    params.set("is_read", String(isRead));
  }

  const response = await fetch(
    `/api/manager/dashboard/notifications?${params.toString()}`,
    {
      headers: {
        "x-user-id": String(managerId),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch manager notifications");
  }

  return response.json();
}