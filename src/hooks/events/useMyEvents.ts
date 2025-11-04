"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyEvents } from "@/api/events";
import { GetEventsParams } from "@/types";

export function useMyEvents(params: GetEventsParams) {
  return useQuery({
    queryKey: ['myEvents', params],
    queryFn: () => getMyEvents(params),
    placeholderData: (previousData) => previousData,
  });
}