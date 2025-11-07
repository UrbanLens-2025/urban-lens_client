"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAttendance } from "@/api/events";
import { toast } from "sonner";
import type { ConfirmAttendancePayload } from "@/types";

export function useConfirmAttendance(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmAttendancePayload) =>
      confirmAttendance(eventId, payload),
    onSuccess: () => {
      toast.success("Attendance confirmed successfully!");
      // Invalidate attendance query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['eventAttendance', eventId],
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
