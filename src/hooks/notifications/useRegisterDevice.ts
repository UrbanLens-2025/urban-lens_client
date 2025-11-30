"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerDevice } from "@/api/notifications";
import { RegisterDevicePayload } from "@/types";

export function useRegisterDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterDevicePayload) => {
      return registerDevice(payload);
    },
    onSuccess: () => {
      toast.success("Device registered successfully!");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to register device");
    },
  });
}

