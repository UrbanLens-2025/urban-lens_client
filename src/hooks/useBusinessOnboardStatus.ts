"use client";

import { useQuery } from "@tanstack/react-query";
import { getBusinessOnboardingStatus } from "@/api/onboarding";

export function useBusinessOnboardStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: ['businessOnboardStatus'],
    queryFn: getBusinessOnboardingStatus,
    enabled: enabled,
    retry: false,
  });
}