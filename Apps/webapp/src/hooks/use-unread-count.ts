import { useMemo } from "react";
import { useConversations } from "@/modules/communication/hooks";
import { useAuthStore } from "@/store/auth-store";

export function useUnreadCount() {
  const user = useAuthStore((state) => state.user);
  const { data: conversations, isLoading, isError } = useConversations(!!user);

  const count = useMemo(() => {
    if (!conversations) return 0;
    return conversations.reduce((sum, conv) =>
      sum + (user?.role === "OWNER" ? conv.owner_unread_count : conv.tenant_unread_count),
      0
    );
  }, [conversations, user?.role]);

  return { count, isLoading, isError };
}
