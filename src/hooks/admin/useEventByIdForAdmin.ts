"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventByIdForAdmin } from "@/api/admin";

export function useEventByIdForAdmin(eventId: string) {
  return useQuery({
    queryKey: ["eventByIdForAdmin", eventId],
    queryFn: () => getEventByIdForAdmin(eventId),
    enabled: !!eventId,
  });
}

