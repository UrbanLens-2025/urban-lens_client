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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { useCancelEvent } from "@/hooks/events/useCancelEvent";
import { useRouter } from "next/navigation";

export interface CancelEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onCancelled?: () => void;
}

export function CancelEventDialog({
  open,
  onOpenChange,
  eventId,
  onCancelled,
}: CancelEventDialogProps) {
  const { mutate: cancelEvent, isPending } = useCancelEvent();
  const [cancellationReason, setCancellationReason] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setCancellationReason("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!cancellationReason.trim()) {
      return;
    }

    cancelEvent(
      {
        eventId,
        payload: {
          cancellationReason: cancellationReason.trim(),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onCancelled?.();
          router.refresh();
          // Navigate to events list or dashboard
          router.push("/dashboard/creator/events");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Event
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please review what will happen when you cancel this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What happens section */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-destructive">What happens when you cancel:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>All ticket sales will be cancelled</li>
              <li>All attendees will be notified of the cancellation</li>
              <li>All location bookings associated with this event will be cancelled</li>
              <li>Refunds will be processed according to your refund policy</li>
              <li>The event will be removed from public listings</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          {/* Cancellation reason */}
          <div className="space-y-2">
            <label htmlFor="cancellation-reason" className="text-sm font-medium">
              Cancellation Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="cancellation-reason"
              placeholder="Please provide a reason for cancelling this event..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {!cancellationReason.trim() && (
              <p className="text-xs text-destructive">Please provide a cancellation reason to continue.</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Back
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !cancellationReason.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

