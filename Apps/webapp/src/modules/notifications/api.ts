import { http } from "@/services/http";
import type { NotificationItem, NotificationsResponse } from "@/types/notification";

interface ListNotificationsQuery {
  unread?: boolean;
  page?: number;
}

export const listNotifications = async ({ unread = false, page = 1 }: ListNotificationsQuery) => {
  const response = await http.get<NotificationsResponse>("/notifications/", {
    params: {
      unread: unread ? "true" : undefined,
      page,
    },
  });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await http.get<{ unread_count: number }>("/notifications/unread-count/");
  return response.data;
};

export const markNotificationRead = async (notificationId: string) => {
  const response = await http.post<NotificationItem>(`/notifications/${notificationId}/read/`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await http.post<{ updated: number }>("/notifications/mark-all-read/");
  return response.data;
};
