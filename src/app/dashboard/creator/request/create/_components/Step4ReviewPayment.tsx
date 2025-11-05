"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";
import { useLocationBookingConfig } from "@/hooks/locations/useLocationBookingConfig";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Star, DollarSign, Calendar } from "lucide-react";
import { CreateEventRequestForm } from "../page";
import Link from "next/link";

interface Step4ReviewPaymentProps {
  form: UseFormReturn<CreateEventRequestForm>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function Step4ReviewPayment({
  form,
  onSubmit,
  isSubmitting,
}: Step4ReviewPaymentProps) {
  const formValues = form.getValues();
  const { resolvedTags: tags } = useResolvedTags(formValues.tagIds);
  const { data: bookingConfig, isLoading: isLoadingConfig } = useLocationBookingConfig(
    formValues.locationId
  );

  // Calculate booking cost based on selected time slots
  const calculateBookingCost = () => {
    if (!bookingConfig || !formValues.dateRanges || formValues.dateRanges.length === 0) {
      return { totalMinutes: 0, totalCost: 0, currency: "VND" };
    }

    let totalMinutes = 0;
    formValues.dateRanges.forEach((range: { startDateTime: Date; endDateTime: Date }) => {
      const duration = (range.endDateTime.getTime() - range.startDateTime.getTime()) / (1000 * 60);
      totalMinutes += duration;
    });

    const basePrice = parseFloat(bookingConfig.baseBookingPrice);
    // Base price is for minBookingDurationMinutes, calculate proportional cost
    // Each time slot is charged based on its duration relative to the minimum duration
    let totalCost = 0;
    formValues.dateRanges.forEach((range: { startDateTime: Date; endDateTime: Date }) => {
      const slotMinutes = (range.endDateTime.getTime() - range.startDateTime.getTime()) / (1000 * 60);
      // Calculate cost for this slot: basePrice * (slotDuration / minDuration)
      const slotCost = basePrice * (slotMinutes / bookingConfig.minBookingDurationMinutes);
      totalCost += slotCost;
    });

    return {
      totalMinutes: Math.round(totalMinutes),
      totalCost: Math.round(totalCost),
      currency: bookingConfig.currency,
    };
  };

  const { totalMinutes, totalCost, currency } = calculateBookingCost();

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getVenueTypeLabel = (type: string) => {
    switch (type) {
      case "business":
        return "Business-Owned Venue";
      case "public":
        return "Public Location";
      case "custom":
        return "Custom Venue";
      default:
        return "Not Selected";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Payment</h2>
        <p className="text-muted-foreground">
          Review your event details and submit your request
        </p>
      </div>

      {/* Event Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Event Name</p>
            <p className="text-base">{formValues.eventName}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-base">{formValues.eventDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expected Participants
              </p>
              <p className="text-base">{formValues.expectedNumberOfParticipants}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Allow Ticketing
              </p>
              <Badge variant={formValues.allowTickets ? "default" : "secondary"}>
                {formValues.allowTickets ? "Yes" : "No"}
              </Badge>
            </div>
          </div>

          {formValues.specialRequirements && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Special Requirements
              </p>
              <p className="text-base">{formValues.specialRequirements}</p>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
              <DisplayTags tags={tags} maxCount={10} />
            </div>
          )}

          {formValues.eventValidationDocuments &&
            formValues.eventValidationDocuments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Event Permit Documents
                </p>
                <p className="text-sm text-muted-foreground">
                  {formValues.eventValidationDocuments[0]?.documentImageUrls?.length || 0}{" "}
                  document(s) uploaded
                </p>
              </div>
            )}

          {formValues.social && formValues.social.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Social Media Links
              </p>
              <div className="space-y-2">
                {formValues.social.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
                  >
                    <div className="flex-1">
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
                        className="text-xs text-blue-600 hover:underline truncate block"
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

      {/* Venue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Venue Type</p>
            <Badge>{getVenueTypeLabel(formValues.venueType || "")}</Badge>
          </div>

          {formValues.venueType === "custom" && formValues.customVenueDetails && (
            <>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venue Name</p>
                <p className="text-base">{formValues.customVenueDetails.venueName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-base">
                  {formValues.customVenueDetails.addressLine}
                  {formValues.customVenueDetails.addressLevel1 &&
                    `, ${formValues.customVenueDetails.addressLevel1}`}
                  {formValues.customVenueDetails.addressLevel2 &&
                    `, ${formValues.customVenueDetails.addressLevel2}`}
                </p>
              </div>
            </>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Event Time Slots</p>
            {formValues.dateRanges && formValues.dateRanges.length > 0 ? (
              <div className="space-y-2">
                {formValues.dateRanges.map((range, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-muted/30">
                    <p className="text-sm font-medium">Slot {index + 1}</p>
                    <p className="text-sm">
                      {format(range.startDateTime, "PPP 'at' HH:mm")} →{" "}
                      {format(range.endDateTime, "HH:mm")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No time slots selected</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
          <CardDescription>
            Payment will be processed after your event request is approved
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bookingConfig && formValues.dateRanges && formValues.dateRanges.length > 0 ? (
            <div className="space-y-4">
              {/* Booking Details */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Booking Details</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Duration</p>
                    <p className="font-semibold">{totalMinutes} minutes</p>
                    <p className="text-xs text-muted-foreground">
                      ({formValues.dateRanges.length} time slot{formValues.dateRanges.length !== 1 ? 's' : ''})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Base Price</p>
                    <p className="font-semibold">
                      {formatCurrency(parseFloat(bookingConfig.baseBookingPrice), bookingConfig.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      per {bookingConfig.minBookingDurationMinutes} min
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Venue Booking Fee
                  </span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(totalCost, currency)}
                  </span>
                </div>
                
                {bookingConfig && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    <p>• Min booking duration: {bookingConfig.minBookingDurationMinutes} minutes</p>
                    <p>• Max booking duration: {bookingConfig.maxBookingDurationMinutes} minutes</p>
                    <p>• Min gap between bookings: {bookingConfig.minGapBetweenBookingsMinutes} minutes</p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Estimated Total</span>
                  <span className="font-bold text-2xl text-primary">
                    {formatCurrency(totalCost, currency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  Final amount may vary based on approval
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {!formValues.locationId ? (
                <p className="text-sm">Please select a venue to view booking costs</p>
              ) : !formValues.dateRanges || formValues.dateRanges.length === 0 ? (
                <p className="text-sm">Please select event time slots to calculate booking costs</p>
              ) : (
                <p className="text-sm">Unable to load booking configuration</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        className="w-full"
        size="lg"
        disabled={isSubmitting || !form.formState.isValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Event Request"
        )}
      </Button>
    </div>
  );
}

