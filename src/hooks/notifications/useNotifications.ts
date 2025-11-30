"use client";

import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/api/notifications";
import { GetNotificationsParams } from "@/types";
import { useUser } from "@/hooks/user/useUser";

export function useNotifications(params: GetNotificationsParams) {
  const { user } = useUser();

  return useQuery({
    queryKey: ["notifications", user?.role, params],
    queryFn: () => getNotifications(params),
    enabled: !!user && (user.role === "BUSINESS_OWNER" || user.role === "EVENT_CREATOR"),
    placeholderData: (previousData) => previousData,
  });
}

