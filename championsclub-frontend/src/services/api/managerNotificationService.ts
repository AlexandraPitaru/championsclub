const API_BASE_URL = "http://localhost:8000";

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
    `${API_BASE_URL}/api/manager/dashboard/notifications?${params.toString()}`,
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