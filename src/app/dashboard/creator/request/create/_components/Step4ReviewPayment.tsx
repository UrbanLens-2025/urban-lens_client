"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { 
  Globe, 
  Star, 
  Calendar, 
  Users,
  FileText,
  Edit,
  CheckCircle2,
  Image as ImageIcon,
  FileCheck,
  ArrowLeft,
  Loader2,
  Building2,
  AlertCircle,
  MapPin
} from "lucide-react";
import { CreateEventRequestForm } from "../page";
import Link from "next/link";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import { cn } from "@/lib/utils";

interface Step4ReviewPaymentProps {
  form: UseFormReturn<CreateEventRequestForm>;
  onSubmit: () => void;
  isSubmitting: boolean;
  onEditStep?: (step: number) => void;
  onBack?: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  EVENT_PERMIT: "Event Permit",
  TAX_REGISTRATION: "Tax Registration",
  HEALTH_PERMIT: "Health Permit",
  LIABILITY_INSURANCE: "Liability Insurance",
  ORGANIZER_ID: "Organizer ID",
  BUSINESS_LICENSE: "Business License",
  OTHER: "Other",
};

function LocationReviewSection({ locationId }: { locationId: string }) {
  const { data: locationsData } = useBookableLocations({ page: 1, limit: 100 });
  const location = locationsData?.data?.find((loc) => loc.id === locationId);

  if (!location) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading location details...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base">{location.name}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {location.addressLine}, {location.addressLevel1}
          </p>
          {location.description && (
            <p className="text-sm text-muted-foreground mt-2">{location.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Step4ReviewPayment({
  form,
  onSubmit,
  isSubmitting,
  onEditStep,
  onBack,
}: Step4ReviewPaymentProps) {
  const formValues = form.getValues();
  const { resolvedTags: tags } = useResolvedTags(formValues.tagIds);

  const handleEditStep = (step: number) => {
    if (onEditStep) {
      onEditStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 pb-2 border-b border-primary/10">
        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-1">Review & Submit</h2>
          <p className="text-muted-foreground text-sm">
            Review your event details before submitting your request
          </p>
        </div>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Event Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(2)}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Event Name</p>
              <p className="text-base font-semibold">{formValues.eventName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Expected Participants
              </p>
              <p className="text-base font-semibold">{formValues.expectedNumberOfParticipants}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-base whitespace-pre-wrap">{formValues.eventDescription}</p>
          </div>

          {(formValues.startDate || formValues.endDate) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formValues.startDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Start Date
                  </p>
                  <p className="text-base font-semibold">
                    {format(formValues.startDate, "PPP 'at' h:mm a")}
                  </p>
                </div>
              )}
              {formValues.endDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    End Date
                  </p>
                  <p className="text-base font-semibold">
                    {format(formValues.endDate, "PPP 'at' h:mm a")}
                  </p>
                </div>
              )}
            </div>
          )}

          {(formValues.coverUrl || formValues.avatarUrl) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formValues.coverUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Cover Image
                  </p>
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={formValues.coverUrl}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              {formValues.avatarUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Avatar Image
                  </p>
                  <div className="relative aspect-square w-32 rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={formValues.avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {tags && tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
              <DisplayTags tags={tags} maxCount={10} />
            </div>
          )}

          {formValues.social && formValues.social.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Social Media Links
              </p>
              <div className="space-y-2">
                {formValues.social.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{link.platform}</span>
                        {link.isMain && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Main
                          </Badge>
                        )}
                      </div>
                      <Link
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block"
                      >
                        {link.url}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location & Booking */}
      <Card className={cn(
        formValues.locationId && formValues.dateRanges && formValues.dateRanges.length > 0
          ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/20"
          : "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Location & Booking
              {formValues.locationId && formValues.dateRanges && formValues.dateRanges.length > 0 ? (
                <Badge variant="default" className="ml-2 bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  Optional
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(1)}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              {formValues.locationId ? "Edit" : "Add"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formValues.locationId ? (
            <>
              <LocationReviewSection locationId={formValues.locationId} />
              {formValues.dateRanges && formValues.dateRanges.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Booked Times
                  </p>
                  {(() => {
                    // First, sort all slots globally by start time
                    const sortedSlots = [...formValues.dateRanges].sort((a, b) => 
                      a.startDateTime.getTime() - b.startDateTime.getTime()
                    );
                    
                    // Merge consecutive time slots across all dates
                    const mergedRanges: Array<{ 
                      startDateTime: Date; 
                      endDateTime: Date;
                      id: string; // Unique ID for tracking continued ranges
                    }> = [];
                    
                    if (sortedSlots.length === 0) {
                      // No slots to process
                    } else {
                      let currentRange: { startDateTime: Date; endDateTime: Date } = { 
                        startDateTime: sortedSlots[0].startDateTime, 
                        endDateTime: sortedSlots[0].endDateTime 
                      };
                      let rangeIdCounter = 0;
                      
                      for (let i = 1; i < sortedSlots.length; i++) {
                        const slot = sortedSlots[i];
                        // Check if this slot starts exactly when the current range ends (can be across dates)
                        if (currentRange.endDateTime.getTime() === slot.startDateTime.getTime()) {
                          // Merge: extend the end time
                          currentRange.endDateTime = slot.endDateTime;
                        } else {
                          // Not consecutive, save current range and start a new one
                          mergedRanges.push({
                            startDateTime: currentRange.startDateTime,
                            endDateTime: currentRange.endDateTime,
                            id: `range-${rangeIdCounter++}`,
                          });
                          currentRange = { 
                            startDateTime: slot.startDateTime, 
                            endDateTime: slot.endDateTime 
                          };
                        }
                      }
                      
                      // Don't forget to add the last range
                      mergedRanges.push({
                        startDateTime: currentRange.startDateTime,
                        endDateTime: currentRange.endDateTime,
                        id: `range-${rangeIdCounter++}`,
                      });
                    }
                    
                    // Create a structure to track which ranges span multiple dates
                    type RangeDisplayItem = {
                      rangeId: string;
                      startDateTime: Date;
                      endDateTime: Date;
                      fullRange?: { startDateTime: Date; endDateTime: Date }; // Full range for continued ranges
                      isStart: boolean;
                      isEnd: boolean;
                      isContinuation: boolean;
                    };
                    
                    const displayItems: Array<{ dateKey: string; items: RangeDisplayItem[] }> = [];
                    
                    mergedRanges.forEach((range) => {
                      const startDateKey = format(range.startDateTime, "yyyy-MM-dd");
                      const endDateKey = format(range.endDateTime, "yyyy-MM-dd");
                      
                      if (startDateKey === endDateKey) {
                        // Range is on a single date
                        const existingDateIndex = displayItems.findIndex(item => item.dateKey === startDateKey);
                        if (existingDateIndex >= 0) {
                          displayItems[existingDateIndex].items.push({
                            rangeId: range.id,
                            startDateTime: range.startDateTime,
                            endDateTime: range.endDateTime,
                            isStart: true,
                            isEnd: true,
                            isContinuation: false,
                          });
                        } else {
                          displayItems.push({
                            dateKey: startDateKey,
                            items: [{
                              rangeId: range.id,
                              startDateTime: range.startDateTime,
                              endDateTime: range.endDateTime,
                              isStart: true,
                              isEnd: true,
                              isContinuation: false,
                            }],
                          });
                        }
                      } else {
                        // Range spans multiple dates - only show on start date with full range
                        const existingDateIndex = displayItems.findIndex(item => item.dateKey === startDateKey);
                        const item: RangeDisplayItem = {
                          rangeId: range.id,
                          startDateTime: range.startDateTime,
                          endDateTime: range.endDateTime,
                          fullRange: { startDateTime: range.startDateTime, endDateTime: range.endDateTime },
                          isStart: true,
                          isEnd: false,
                          isContinuation: false,
                        };
                        
                        if (existingDateIndex >= 0) {
                          displayItems[existingDateIndex].items.push(item);
                        } else {
                          displayItems.push({
                            dateKey: startDateKey,
                            items: [item],
                          });
                        }
                      }
                    });
                    
                    // Sort dates
                    displayItems.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

                    return (
                      <div className="space-y-2.5">
                        {displayItems.map(({ dateKey, items }) => {
                          const date = new Date(dateKey + "T00:00:00");
                          
                          return (
                            <div key={dateKey} className="p-2.5 border rounded-lg bg-muted/30">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 pt-0.5">
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {format(date, "MMM dd")}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {format(date, "yyyy")}
                                  </div>
                                </div>
                                <div className="flex-1 flex flex-wrap gap-1.5">
                                  {items.map((item, idx) => {
                                    // Check if this is a multi-date range
                                    if (item.fullRange) {
                                      const startDateKey = format(item.fullRange.startDateTime, "yyyy-MM-dd");
                                      const endDateKey = format(item.fullRange.endDateTime, "yyyy-MM-dd");
                                      
                                      if (startDateKey !== endDateKey) {
                                        // Multi-date range - show full range with both dates
                                        const startDate = format(new Date(startDateKey + "T00:00:00"), "MMM dd");
                                        const endDate = format(new Date(endDateKey + "T00:00:00"), "MMM dd");
                                        const fullStartTime = format(item.fullRange.startDateTime, "h:mm a");
                                        const fullEndTime = format(item.fullRange.endDateTime, "h:mm a");
                                        
                                        return (
                                          <Badge
                                            key={`${item.rangeId}-${idx}`}
                                            variant="secondary"
                                            className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                                          >
                                            {startDate} {fullStartTime} → {endDate} {fullEndTime}
                                          </Badge>
                                        );
                                      }
                                    }
                                    
                                    // Single date range
                                    const startTime = format(item.startDateTime, "h:mm a");
                                    const endTime = format(item.endDateTime, "h:mm a");
                                    return (
                                      <Badge
                                        key={`${item.rangeId}-${idx}`}
                                        variant="secondary"
                                        className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                                      >
                                        {startTime} - {endTime}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
                    Location selected but no time slots booked yet. You can add time slots when editing your event.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
                <strong>No location selected.</strong> Your event will be created without a specific venue. You can add a location later when editing your event.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      {formValues.eventValidationDocuments && formValues.eventValidationDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Documents
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditStep(3)}
                className="text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formValues.eventValidationDocuments.map((doc, index) => {
              const documentsLength = formValues.eventValidationDocuments?.length || 0;
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Document Type</p>
                    <Badge variant="secondary">
                      {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </Badge>
                  </div>
                  {doc.documentImageUrls && doc.documentImageUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Images ({doc.documentImageUrls.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {doc.documentImageUrls.map((url, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="relative aspect-video rounded-lg overflow-hidden border bg-muted"
                          >
                            <Image
                              src={url}
                              alt={`Document ${index + 1} - Image ${imgIndex + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {index < documentsLength - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          className="flex-1"
          size="lg"
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Event Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}