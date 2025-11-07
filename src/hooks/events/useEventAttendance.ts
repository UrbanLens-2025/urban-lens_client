"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventAttendance } from "@/api/events";
import type { GetEventAttendanceParams } from "@/types";

export function useEventAttendance(
  eventId: string | null,
  params?: GetEventAttendanceParams
) {
  return useQuery({
    queryKey: ['eventAttendance', eventId, params],
    queryFn: () => getEventAttendance(eventId!, params),
    enabled: !!eventId,
  });
}
