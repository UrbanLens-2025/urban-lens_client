"use client";

import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/notifications/useNotifications";

export function NotificationBadge() {
  const { data } = useNotifications({
    page: 1,
    limit: 1,
    sortBy: "createdAt:DESC",
    status: "UNSEEN",
  });

  const unreadCount = data?.meta?.totalItems || 0;

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="ml-auto h-5 min-w-5 rounded-full px-1.5 text-xs font-semibold"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}

