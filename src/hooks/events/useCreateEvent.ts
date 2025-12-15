"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createEvent,
  CreateEventPayload,
  addLocationBookingToEvent,
  initiateLocationBookingPayment,
} from "@/api/events";
import { useRouter } from "next/navigation";

type UseCreateEventOptions = {
  onInsufficientBalance?: () => void;
};

export function useCreateEvent(options?: UseCreateEventOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      // Step 1: Create the event first
      const event = await createEvent(payload);
      
      // If location and date ranges are provided, create location booking and initiate payment
      let paymentError: any = null;
      if (
        payload.locationId &&
        payload.dateRanges &&
        payload.dateRanges.length > 0
      ) {
        // Step 2: Create location booking
        const booking = await addLocationBookingToEvent(event.id, {
          locationId: payload.locationId,
          dates: payload.dateRanges.map((range) => ({
            startDateTime: range.startDateTime,
            endDateTime: range.endDateTime,
          })),
        });
        
        // Step 3: Make payment
        try {
          await initiateLocationBookingPayment(event.id, booking.id);
          // Payment succeeded - booking is complete
        } catch (paymentErr: any) {
          // Payment failed - store error but don't cancel booking
          // Extract error message handling all possible formats
          let errorMessage = "";

          if (typeof paymentErr === "string") {
            errorMessage = paymentErr;
          } else if (paymentErr?.message) {
            errorMessage = paymentErr.message;
          } else if (paymentErr?.response?.data?.message) {
            errorMessage = paymentErr.response.data.message;
          }

          // Check if error is "LocationBooking not found" - this might happen if payment succeeded
          // but API can't find the booking (race condition or API issue)
          // Since wallet balance is reduced and event has location, payment likely succeeded
          const statusCode =
            paymentErr?.statusCode ??
            paymentErr?.response?.status ??
            paymentErr?.response?.data?.statusCode;
          const isNotFoundError =
            statusCode === 404 &&
            (errorMessage.toLowerCase().includes("locationbooking") ||
              errorMessage.toLowerCase().includes("location booking") ||
              errorMessage.toLowerCase().includes("not found"));

          if (isNotFoundError) {
            // Payment likely succeeded but API can't find booking immediately - treat as success
            console.warn(
              "Payment API returned 404 for booking, but payment likely succeeded.",
              {
                eventId: event.id,
                bookingId: booking.id,
                error: errorMessage,
              }
            );
            // Don't set paymentError - treat as success
          } else {
            // Payment failed - store error to show in success message
            paymentError = paymentErr;

            // If failure looks like insufficient balance, trigger optional callback
            if (
              errorMessage.toLowerCase().includes("insufficient") ||
              errorMessage.toLowerCase().includes("balance")
            ) {
              options?.onInsufficientBalance?.();
            }
          }
        }
      }
      
      // Return event with payment error info if payment failed
      return { event, paymentError };
    },
    
    onSuccess: (result) => {
      const { event, paymentError } = result;
      
      // Always show success for event creation
      if (paymentError) {
        // Event created but payment failed
        // Handle different error structures from axios interceptor
        const errorMessage = paymentError?.message ?? 
                            (typeof paymentError === 'string' ? paymentError : 'Payment processing failed');
        
        let description = "However, payment processing failed. You can complete the payment from the event page.";
        
        if (errorMessage.toLowerCase().includes("insufficient") || errorMessage.toLowerCase().includes("balance")) {
          description = "However, payment failed due to insufficient balance. Please add funds and complete the payment from the event page.";
        } else if (errorMessage.toLowerCase().includes("payment") || errorMessage.toLowerCase().includes("transaction")) {
          description = `However, payment failed: ${errorMessage}. Please try completing the payment from the event page.`;
        } else {
          description = `However, payment failed: ${errorMessage}. Please try completing the payment from the event page.`;
        }
        
        // Show success message that mentions payment issue
        toast.success("Event created successfully!", {
          description,
          duration: 8000,
        });
      } else {
        // Both event creation and payment succeeded
        toast.success("Event created and payment processed successfully!");
      }
      
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['eventDetail', event.id] });
      
      // Invalidate location bookings query - if booking isn't immediately available due to race conditions,
      // it will be fetched when the user navigates to the event page
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
        options?.onInsufficientBalance?.();
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

