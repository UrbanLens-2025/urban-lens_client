"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLocation } from "@/api/locations";
import { useRouter } from "next/navigation";
import { Location, PaginatedData, UpdateLocationPayload } from "@/types";

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

    onSuccess: (updatedLocation) => {
      toast.success("Location updated successfully!");

      queryClient.setQueryData(
        ["myLocations"],
        (oldData: PaginatedData<Location> | undefined) => {
          if (!oldData) return oldData;
          const updatedData = oldData.data.map((location) =>
            location.id === updatedLocation.id ? updatedLocation : location
          );
          return { ...oldData, data: updatedData };
        }
      );

      queryClient.setQueryData(
        ["location", updatedLocation.id],
        updatedLocation
      );

      router.back();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update location.");
    },
  });
}
