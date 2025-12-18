"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { forceCancelLocationBooking } from "@/api/locations";
import { toast } from "sonner";

export function useForceCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      bookingId, 
      payload 
    }: { 
      bookingId: string; 
      payload: { cancellationReason: string } 
    }) => forceCancelLocationBooking(bookingId, payload),
    
    onSuccess: (_, variables) => {
      toast.success("Booking has been cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["location-booking", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["location-bookings"] });
    },
    
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Không thể hủy đơn: ${msg}`);
    },
  });
}