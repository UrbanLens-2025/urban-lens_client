"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createEvent, CreateEventPayload, addLocationBookingToEvent, initiateLocationBookingPayment, cancelLocationBooking } from "@/api/events";
import { useRouter } from "next/navigation";

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      // Create the event first
      const event = await createEvent(payload);
      
      // If location and date ranges are provided, create location booking and initiate payment
      if (payload.locationId && payload.dateRanges && payload.dateRanges.length > 0) {
        try {
          // Step 1: Create booking first (required for payment API)
          const booking = await addLocationBookingToEvent(event.id, {
            locationId: payload.locationId,
            dates: payload.dateRanges.map(range => ({
              startDateTime: range.startDateTime,
              endDateTime: range.endDateTime,
            })),
          });
          
          // Step 2: Immediately initiate payment right after booking creation
          try {
            await initiateLocationBookingPayment(event.id, booking.id);
            // Payment succeeded - booking is complete
          } catch (paymentError: any) {
            // Payment failed - cancel the booking
            try {
              await cancelLocationBooking(event.id, booking.id, {
                cancellationReason: "Payment failed during event creation"
              });
            } catch (cancelError) {
              // If cancel fails, log but don't throw - payment error is more important
              console.error("Failed to cancel booking after payment failure:", cancelError);
            }
            
            // Throw payment error to prevent event creation with unpaid booking
            throw paymentError;
          }
        } catch (error: any) {
          // If location booking or payment fails, fail the entire event creation
          const errorMessage = error?.response?.data?.message ?? error?.message ?? "Failed to create location booking and process payment";
          throw new Error(errorMessage);
        }
      }
      
      return event;
    },
    
    onSuccess: (event) => {
      toast.success("Event created and payment processed successfully!");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['eventDetail', event.id] });
      queryClient.invalidateQueries({ queryKey: ['eventLocationBookings', event.id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      router.push(`/dashboard/creator/events/${event.id}`);
    },
    onError: (err: Error) => {
      const errorMessage = err?.message ?? "Failed to create event.";
      
      // Provide user-friendly error messages
      let userMessage = "Failed to create event";
      let description = errorMessage;
      
      if (errorMessage.toLowerCase().includes("insufficient") || errorMessage.toLowerCase().includes("balance")) {
        userMessage = "Insufficient funds";
        description = "Your account balance is not enough to complete the location booking payment. Please add funds and try again.";
      } else if (errorMessage.toLowerCase().includes("payment") || errorMessage.toLowerCase().includes("transaction")) {
        userMessage = "Payment processing failed";
        description = errorMessage;
      } else if (errorMessage.toLowerCase().includes("booking")) {
        userMessage = "Booking creation failed";
        description = errorMessage;
      }
      
      toast.error(userMessage, {
        description,
        duration: 6000,
      });
    },
  });
}

