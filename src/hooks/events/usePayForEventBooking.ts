"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { payForEventBooking } from "@/api/events";
import { useRouter } from "next/navigation";

export function usePayForEventBooking() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (eventRequestId: string) => payForEventBooking(eventRequestId),
    
    onSuccess: (data) => {
      toast.success("Payment successful! Your event is confirmed.");
      
      queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
      
      queryClient.setQueryData(['eventRequestDetail', data.id], data);

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });

      router.push('/dashboard/creator/request');
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Payment failed. Please try again.");
    },
  });
}