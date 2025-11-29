"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCancelLocationBooking } from "@/hooks/events/useCancelLocationBooking";
import { useRouter } from "next/navigation";

const REASON_OPTIONS = [
  { value: "SCHEDULING_CONFLICT", label: "Scheduling conflict" },
  { value: "BUDGET_CHANGES", label: "Budget changes" },
  { value: "FOUND_ANOTHER_VENUE", label: "Secured another venue" },
  { value: "EVENT_RESCHEDULED", label: "Event rescheduled" },
  { value: "OTHER", label: "Other" },
];

export interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  bookingId?: string;
  onCancelled?: () => void;
}

import { useEventLocationBookings } from "@/hooks/events/useEventLocationBookings";

export function CancelBookingDialog({
  open,
  onOpenChange,
  eventId,
  bookingId,
  onCancelled,
}: CancelBookingDialogProps) {
  const { mutate: cancelBooking, isPending } = useCancelLocationBooking();
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const router = useRouter();
  const { refetch } = useEventLocationBookings(eventId);

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setDetails("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedReason || !bookingId) {
      return;
    }

    const formattedReason = `${selectedReason}:${details.trim() || "No additional details provided"}`;
    cancelBooking(
      {
        eventId,
        locationBookingId: bookingId,
        payload: {
          cancellationReason: formattedReason,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onCancelled?.();
          router.refresh();
          refetch();
          // Force a reload of the window as a fallback to ensure all server components refresh
          // window.location.reload();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            If you cancel your booking you will be refunded 100% of the booking fee if you have already paid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Select a cancellation reason</p>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedReason && (
              <p className="text-xs text-destructive">Please select a reason to continue.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Additional details (optional)</p>
            <Textarea
              placeholder="Share more context about why you're cancelling..."
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Back
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !selectedReason}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

