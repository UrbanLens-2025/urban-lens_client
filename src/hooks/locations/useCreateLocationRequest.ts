"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLocationRequest } from "@/api/locations";
import { CreateLocationPayload } from "@/types";

export function useCreateLocationRequest() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateLocationPayload) => createLocationRequest(payload),
    
    onSuccess: () => {
      toast.success("Location request submitted successfully for review!");
      queryClient.invalidateQueries({ queryKey: ['myLocationRequests'] });
      // Go to top-level Location Requests page (not nested under Locations)
      router.push('/dashboard/business/location-requests');
    },

    onError: (err) => {
      toast.error(err.message || "Failed to submit location request.");
    },
  });
}