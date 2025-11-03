"use client";

import { useQuery } from "@tanstack/react-query";
import { getEventRequests } from "@/api/events";
import { GetEventRequestsParams } from "@/types";

export function useEventRequests(params: GetEventRequestsParams) {
  return useQuery({
    queryKey: ['eventRequests', params],
    queryFn: () => getEventRequests(params),
    placeholderData: (previousData) => previousData,
  });
}