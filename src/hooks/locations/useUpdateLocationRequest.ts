"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLocationRequest } from "@/api/locations";
import { CreateLocationPayload } from "@/types";
import { useRouter } from "next/navigation";

export function useUpdateLocationRequest() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ locationRequestId, payload }: { locationRequestId: string, payload: CreateLocationPayload }) => 
      updateLocationRequest({ locationRequestId, payload }),
    onSuccess: () => {
      toast.success("Location request updated!");
      queryClient.invalidateQueries({ queryKey: ['myLocationRequests'] });
      router.push('/dashboard/business/locations');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}