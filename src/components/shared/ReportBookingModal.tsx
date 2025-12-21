"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { useReportReasons } from "@/hooks/reports/useReportReasons";
import { useReportBooking } from "@/hooks/reports/useReportBooking";
import { Loader2, AlertCircle } from "lucide-react";

interface ReportBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
}

export function ReportBookingModal({
  open,
  onOpenChange,
  bookingId,
}: ReportBookingModalProps) {
  const [reportedReason, setReportedReason] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attachedImageUrls, setAttachedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);

  const { data: reportReasons, isLoading: isLoadingReasons } =
    useReportReasons();
  const reportBookingMutation = useReportBooking();

  // Filter report reasons for location bookings (forLocation: true)
  const locationReportReasons = reportReasons?.filter(
    (reason) => reason.forLocation && reason.isActive
  ) || [];

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setReportedReason("");
      setTitle("");
      setDescription("");
      setAttachedImageUrls([]);
      setIsUploadingImages(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!reportedReason || !title.trim() || !description.trim()) {
      return;
    }

    try {
      await reportBookingMutation.mutateAsync({
        bookingId,
        reportedReason,
        title: title.trim(),
        description: description.trim(),
        attachedImageUrls: attachedImageUrls.length > 0 ? attachedImageUrls : undefined,
      });
      onOpenChange(false);
    } catch {
      // Error is handled by the mutation hook
    }
  };

  const isFormValid = reportedReason && title.trim() && description.trim();
  const isSubmitting = reportBookingMutation.isPending;
  const isFormDisabled = isSubmitting || isUploadingImages;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Report Booking
          </DialogTitle>
          <DialogDescription>
            Please provide details about the issue with this booking. Your report
            will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Reason */}
          <div className="space-y-2">
            <Label htmlFor="report-reason">
              Report Reason <span className="text-destructive">*</span>
            </Label>
            <Select
              value={reportedReason}
              onValueChange={setReportedReason}
              disabled={isLoadingReasons || isFormDisabled}
            >
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingReasons ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : locationReportReasons.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No report reasons available
                  </div>
                ) : (
                  locationReportReasons.map((reason) => (
                    <SelectItem key={reason.key} value={reason.key}>
                      {reason.displayName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="report-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="report-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              disabled={isFormDisabled}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="report-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the issue..."
              rows={5}
              disabled={isFormDisabled}
            />
          </div>

          {/* Attached Images */}
          <div className="space-y-2">
            <Label>Attached Images (Optional)</Label>
            <FileUpload
              value={attachedImageUrls}
              onChange={setAttachedImageUrls}
              disabled={isSubmitting}
              maxFiles={4}
              onUploadingChange={setIsUploadingImages}
            />
            <p className="text-xs text-muted-foreground">
              Upload images that support your report (screenshots, photos, etc.). Maximum 4 images.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isFormDisabled}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isFormDisabled}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

