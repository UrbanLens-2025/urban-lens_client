"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createLocationBookingConfig, updateLocationBookingConfig } from "@/api/locations";
import type { CreateLocationBookingConfigPayload, UpdateLocationBookingConfigPayload } from "@/types";

export function useCreateLocationBookingConfig() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateLocationBookingConfigPayload) =>
      createLocationBookingConfig(payload),
    onSuccess: (data) => {
      toast.success("Booking configuration created successfully!");
      queryClient.invalidateQueries({ queryKey: ['ownerLocationBookingConfig', data.locationId] });
      queryClient.invalidateQueries({ queryKey: ['locationBookingConfig', data.locationId] });
      queryClient.invalidateQueries({ queryKey: ['myLocations'] });
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create booking configuration. Please try again.");
    },
  });
}

export function useUpdateLocationBookingConfig() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ configId, locationId, payload }: { configId: string; locationId: string; payload: UpdateLocationBookingConfigPayload }) =>
      updateLocationBookingConfig(configId, payload),
    onSuccess: (_, variables) => {
      toast.success("Booking configuration updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['ownerLocationBookingConfig', variables.locationId] });
      queryClient.invalidateQueries({ queryKey: ['locationBookingConfig', variables.locationId] });
      queryClient.invalidateQueries({ queryKey: ['myLocations'] });
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update booking configuration. Please try again.");
    },
  });
}

