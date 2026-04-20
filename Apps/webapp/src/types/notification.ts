export interface NotificationItem {
  id: string;
  notification_type: "PROPERTY_APPROVED" | "PROPERTY_REJECTED" | "NEW_CONTACT" | "NEW_FAVORITE" | "NEW_MESSAGE" | "SYSTEM";
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
}
