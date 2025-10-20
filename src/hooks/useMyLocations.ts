"use client";

import { getLocationRequests, getMyLocations } from "@/api/locations";
import { useQuery } from "@tanstack/react-query";

export function useMyLocations() {
  return useQuery({
    queryKey: ['myLocations'],
    queryFn: getMyLocations,
  });
}

export function useLocationRequests() {
  return useQuery({
    queryKey: ['locationRequests'],
    queryFn: getLocationRequests,
  });
}