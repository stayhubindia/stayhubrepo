import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./api";

export const useNotifications = (page: number, unreadOnly: boolean, enabled = true) =>
  useQuery({
    queryKey: ["notifications", { page, unreadOnly }],
    queryFn: () => listNotifications({ page, unread: unreadOnly }),
    enabled,
  });

export const useUnreadNotificationCount = (enabled = true) =>
  useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationCount,
    enabled,
  });

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return { markReadMutation, markAllReadMutation };
};
