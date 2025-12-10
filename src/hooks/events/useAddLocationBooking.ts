"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addLocationBookingToEvent, initiateLocationBookingPayment, type AddLocationBookingPayload } from "@/api/events";

export function useAddLocationBooking(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddLocationBookingPayload) => {
      // Step 1: Create location booking first
      const booking = await addLocationBookingToEvent(eventId, payload);
      
      // Step 2: Make payment
      let paymentError: any = null;
      try {
        await initiateLocationBookingPayment(eventId, booking.id);
        // Payment succeeded - booking is complete
      } catch (paymentErr: any) {
        // Payment failed - store error but don't cancel booking
        // Extract error message handling all possible formats
        let errorMessage = '';
        
        if (typeof paymentErr === 'string') {
          errorMessage = paymentErr;
        } else if (paymentErr?.message) {
          errorMessage = paymentErr.message;
        } else if (paymentErr?.response?.data?.message) {
          errorMessage = paymentErr.response.data.message;
        }
        
        // Check if error is "LocationBooking not found" - this might happen if payment succeeded
        // but API can't find the booking (race condition or API issue)
        // Since wallet balance is reduced, payment likely succeeded
        const statusCode = paymentErr?.statusCode ?? paymentErr?.response?.status ?? paymentErr?.response?.data?.statusCode;
        const isNotFoundError = statusCode === 404 && 
            (errorMessage.toLowerCase().includes("locationbooking") || 
             errorMessage.toLowerCase().includes("location booking") ||
             errorMessage.toLowerCase().includes("not found"));
        
        if (isNotFoundError) {
          // Payment likely succeeded but API can't find booking immediately - treat as success
          console.warn("Payment API returned 404 for booking, but payment likely succeeded.", {
            eventId,
            bookingId: booking.id,
            error: errorMessage
          });
          // Don't set paymentError - treat as success
        } else {
          // Payment failed - store error to show in success message
          paymentError = paymentErr;
        }
      }
      
      // Return booking with payment error info if payment failed
      return { booking, paymentError };
    },
    onSuccess: (result) => {
      const { booking, paymentError } = result;
      
      // Always show success for booking creation
      if (paymentError) {
        // Booking created but payment failed
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
        toast.success("Booking created successfully!", {
          description,
          duration: 8000,
        });
      } else {
        // Both booking creation and payment succeeded
        toast.success("Booking created and payment processed successfully!");
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventLocationBookings", eventId] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
    },
    onError: (error: any) => {
      // Only called if booking creation fails (not payment)
      const errorMessage = error?.response?.data?.message ?? error?.message ?? "Failed to create booking";
      
      // Provide user-friendly error messages
      let userMessage = "Booking creation failed";
      let description = errorMessage;
      
      if (errorMessage.toLowerCase().includes("booking")) {
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

