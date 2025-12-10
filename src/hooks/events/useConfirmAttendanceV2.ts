"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAttendanceV2, ConfirmAttendanceV2Payload } from "@/api/events";
import { toast } from "sonner";

export function useConfirmAttendanceV2(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmAttendanceV2Payload) =>
      confirmAttendanceV2(eventId, payload),
    onSuccess: () => {
      toast.success("Attendance confirmed successfully!");
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['eventAttendance', eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['eventOrder', eventId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Failed to confirm attendance. Please try again.";
      toast.error(message);
    },
  });
}

