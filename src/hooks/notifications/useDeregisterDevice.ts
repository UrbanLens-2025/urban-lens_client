"use client";

import { useMutation } from "@tanstack/react-query";
import { deregisterDevice } from "@/api/notifications";
import { RegisterDevicePayload } from "@/types";

/**
 * Hook to deregister the FCM device token on logout.
 * This should be called before clearing the auth token.
 */
export function useDeregisterDevice() {
  return useMutation({
    mutationFn: (payload: RegisterDevicePayload) => {
      return deregisterDevice(payload);
    },
    // Silent failure - don't block logout if deregistration fails
    onError: (error: Error) => {
      console.error("Failed to deregister device:", error.message);
    },
  });
}

