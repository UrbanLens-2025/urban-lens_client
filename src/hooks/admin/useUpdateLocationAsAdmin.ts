"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLocationAsAdmin } from "@/api/admin";
import { UpdateLocationPayload } from "@/types";
import { useRouter } from "next/navigation";

export function useUpdateLocationAsAdmin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      locationId: string;
      payload: UpdateLocationPayload;
    }) => updateLocationAsAdmin(locationId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allLocations"] });
      router.back();
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update location.");
    },
  });
}
