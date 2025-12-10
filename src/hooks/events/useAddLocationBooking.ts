"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addLocationBookingToEvent, initiateLocationBookingPayment, cancelLocationBooking, type AddLocationBookingPayload } from "@/api/events";

export function useAddLocationBooking(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddLocationBookingPayload) => {
      // Step 1: Create booking first (required for payment API)
      const booking = await addLocationBookingToEvent(eventId, payload);
      
      // Step 2: Immediately initiate payment
      try {
        await initiateLocationBookingPayment(eventId, booking.id);
        // Payment succeeded - return booking
        return booking;
      } catch (paymentError: any) {
        // Payment failed - cancel the booking
        try {
          await cancelLocationBooking(eventId, booking.id, {
            cancellationReason: "Payment failed during booking creation"
          });
        } catch (cancelError) {
          // If cancel fails, log but don't throw - payment error is more important
          console.error("Failed to cancel booking after payment failure:", cancelError);
        }
        
        // Throw payment error to prevent booking creation
        throw paymentError;
      }
    },
    onSuccess: (data) => {
      toast.success("Booking created and payment processed successfully");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventLocationBookings", eventId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ?? error?.message;
      
      // Provide user-friendly error messages
      let userMessage = "Payment failed. Booking was not created.";
      let description = "Please check your payment method and try again.";
      
      if (errorMessage) {
        if (errorMessage.toLowerCase().includes("insufficient") || errorMessage.toLowerCase().includes("balance")) {
          userMessage = "Insufficient funds";
          description = "Your account balance is not enough to complete this payment. Please add funds and try again.";
        } else if (errorMessage.toLowerCase().includes("payment") || errorMessage.toLowerCase().includes("transaction")) {
          userMessage = "Payment processing failed";
          description = errorMessage;
        } else {
          userMessage = "Booking failed";
          description = errorMessage;
        }
      }
      
      toast.error(userMessage, {
        description,
        duration: 6000,
      });
    },
  });
}

