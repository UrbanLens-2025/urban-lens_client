"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLocation } from "@/api/locations";
import { useRouter } from "next/navigation";
import { UpdateLocationPayload } from "@/types";

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      locationId: string;
      payload: UpdateLocationPayload;
    }) => updateLocation(locationId, payload),

    onSuccess: (_, variables) => {
      toast.success("Location updated successfully!");

      queryClient.invalidateQueries({ queryKey: ["myLocations"] });
      queryClient.invalidateQueries({ queryKey: ["location"] });
      queryClient.invalidateQueries({ queryKey: ["location", variables.locationId] });

      // Navigate to location detail page instead of going back
      router.push(`/dashboard/business/locations/${variables.locationId}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update location.");
    },
  });
}
