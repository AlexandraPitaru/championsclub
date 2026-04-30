import { useQuery } from "@tanstack/react-query";
import {
  getManagerNotifications,
  type NotificationPriority,
} from "../../services/api/managerNotificationService";

type UseManagerNotificationsParams = {
  managerId: number | null;
  priority?: NotificationPriority;
  isRead?: boolean;
  limit?: number;
  offset?: number;
};

export function useManagerNotifications({
  managerId,
  priority,
  isRead,
  limit = 10,
  offset = 0,
}: UseManagerNotificationsParams) {
  return useQuery({
    queryKey: [
      "manager-notifications",
      managerId,
      priority,
      isRead,
      limit,
      offset,
    ],
    queryFn: () =>
      getManagerNotifications({
        managerId: managerId!,
        priority,
        isRead,
        limit,
        offset,
      }),
    enabled: Boolean(managerId),
  });
}