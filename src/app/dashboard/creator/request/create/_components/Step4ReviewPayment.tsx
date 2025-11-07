"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, differenceInHours, differenceInMinutes, startOfDay, isSameDay, parseISO } from "date-fns";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";
import { useLocationBookingConfig } from "@/hooks/locations/useLocationBookingConfig";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { 
  Loader2, 
  Globe, 
  Star, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Clock,
  Users,
  FileText,
  Edit,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import { CreateEventRequestForm } from "../page";
import Link from "next/link";
import Image from "next/image";

interface Step4ReviewPaymentProps {
  form: UseFormReturn<CreateEventRequestForm>;
  onSubmit: () => void;
  isSubmitting: boolean;
  onEditStep?: (step: number) => void;
}

export function Step4ReviewPayment({
  form,
  onSubmit,
  isSubmitting,
  onEditStep,
}: Step4ReviewPaymentProps) {
  const formValues = form.getValues();
  const { resolvedTags: tags } = useResolvedTags(formValues.tagIds);
  const { data: bookingConfig, isLoading: isLoadingConfig } = useLocationBookingConfig(
    formValues.locationId
  );
  const { data: location, isLoading: isLoadingLocation } = useBookableLocationById(
    formValues.locationId
  );

  const [expandedDateGroups, setExpandedDateGroups] = useState<Set<string>>(new Set());
  const [showAllSlots, setShowAllSlots] = useState(false);

  // Group time slots by date
  const groupedTimeSlots = useMemo(() => {
    if (!formValues.dateRanges || formValues.dateRanges.length === 0) {
      return [];
    }

    const grouped = new Map<string, Array<{ startDateTime: Date; endDateTime: Date; index: number }>>();
    
    formValues.dateRanges.forEach((range, index) => {
      const dateKey = format(startOfDay(range.startDateTime), "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push({ ...range, index });
    });

    // Sort dates
    return Array.from(grouped.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([dateKey, slots]) => ({
        dateKey,
        date: parseISO(dateKey),
        slots: slots.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()),
      }));
  }, [formValues.dateRanges]);

  const totalSlots = formValues.dateRanges?.length || 0;
  const INITIAL_VISIBLE_GROUPS = 3;
  const INITIAL_VISIBLE_SLOTS_PER_GROUP = 3;

  // Format duration helper
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}m`;
  };

  // Calculate booking cost based on selected time slots
  const calculateBookingCost = () => {
    if (!bookingConfig || !formValues.dateRanges || formValues.dateRanges.length === 0) {
      return { totalMinutes: 0, totalCost: 0, currency: "VND", totalHours: 0 };
    }

    let totalMinutes = 0;
    formValues.dateRanges.forEach((range: { startDateTime: Date; endDateTime: Date }) => {
      const duration = differenceInMinutes(range.endDateTime, range.startDateTime);
      totalMinutes += duration;
    });

    const basePrice = parseFloat(bookingConfig.baseBookingPrice);
    let totalCost = 0;
    formValues.dateRanges.forEach((range: { startDateTime: Date; endDateTime: Date }) => {
      const slotMinutes = differenceInMinutes(range.endDateTime, range.startDateTime);
      const slotCost = basePrice * (slotMinutes / bookingConfig.minBookingDurationMinutes);
      totalCost += slotCost;
    });

    return {
      totalMinutes: Math.round(totalMinutes),
      totalHours: Math.round(totalMinutes / 60 * 10) / 10, // Round to 1 decimal
      totalCost: Math.round(totalCost),
      currency: bookingConfig.currency,
    };
  };

  const { totalMinutes, totalHours, totalCost, currency } = calculateBookingCost();

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

  const handleEditStep = (step: number) => {
    if (onEditStep) {
      onEditStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Summary */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Review & Submit</h2>
          <p className="text-muted-foreground">
            Review your event details before submitting your request
          </p>
        </div>

        {/* Quick Summary Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Event</p>
                  <p className="font-semibold line-clamp-1">{formValues.eventName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="font-semibold line-clamp-1">
                    {isLoadingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : location ? (
                      location.name
                    ) : (
                      "Not selected"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Slots</p>
                  <p className="font-semibold">
                    {formValues.dateRanges?.length || 0} slot{formValues.dateRanges?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Event Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditStep(1)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Allow Ticketing</p>
              <Badge variant={formValues.allowTickets ? "default" : "secondary"}>
                {formValues.allowTickets ? "Yes" : "No"}
              </Badge>
            </div>
            {tags && tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <DisplayTags tags={tags} maxCount={10} />
              </div>
            )}
          </div>

          {formValues.specialRequirements && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Special Requirements</p>
              <p className="text-base whitespace-pre-wrap">{formValues.specialRequirements}</p>
            </div>
          )}

          {formValues.eventValidationDocuments &&
            formValues.eventValidationDocuments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Event Permit Documents
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {formValues.eventValidationDocuments[0]?.documentImageUrls?.length || 0}{" "}
                    document{formValues.eventValidationDocuments[0]?.documentImageUrls?.length !== 1 ? 's' : ''} uploaded
                  </Badge>
                </div>
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

      {/* Venue Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Venue Details
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
          {isLoadingLocation ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : location ? (
            <>
              {/* Location Images */}
              {location.imageUrl && location.imageUrl.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {location.imageUrl.slice(0, 4).map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg overflow-hidden border bg-muted"
                    >
                      <Image
                        src={url}
                        alt={`${location.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Venue Name</p>
                  <p className="text-base font-semibold">{location.name}</p>
                </div>

                {location.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-base">{location.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                  <p className="text-base">
                    {location.addressLine}
                    {location.addressLevel1 && `, ${location.addressLevel1}`}
                    {location.addressLevel2 && `, ${location.addressLevel2}`}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No venue selected</p>
            </div>
          )}

          <Separator />

          {/* Event Time Slots - Compact Grouped View */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Event Time Slots
                <Badge variant="secondary" className="ml-2">
                  {totalSlots} slot{totalSlots !== 1 ? 's' : ''}
                </Badge>
              </p>
            </div>
            
            {totalSlots > 0 ? (
              <div className="space-y-2">
                {groupedTimeSlots.slice(0, showAllSlots ? undefined : INITIAL_VISIBLE_GROUPS).map((group) => {
                  const isExpanded = expandedDateGroups.has(group.dateKey);
                  const visibleSlots = isExpanded 
                    ? group.slots 
                    : group.slots.slice(0, INITIAL_VISIBLE_SLOTS_PER_GROUP);
                  const hasMoreSlots = group.slots.length > INITIAL_VISIBLE_SLOTS_PER_GROUP;
                  
                  return (
                    <div key={group.dateKey} className="border rounded-lg overflow-hidden bg-muted/20">
                      {/* Date Header */}
                      <div 
                        className="flex items-center justify-between p-3 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                        onClick={() => {
                          if (hasMoreSlots) {
                            const newExpanded = new Set(expandedDateGroups);
                            if (isExpanded) {
                              newExpanded.delete(group.dateKey);
                            } else {
                              newExpanded.add(group.dateKey);
                            }
                            setExpandedDateGroups(newExpanded);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">
                            {format(group.date, "EEEE, MMMM d, yyyy")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {group.slots.length} slot{group.slots.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {hasMoreSlots && (
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </div>

                      {/* Time Slots List */}
                      <div className="divide-y divide-border">
                        {visibleSlots.map((slot) => {
                          const duration = differenceInMinutes(slot.endDateTime, slot.startDateTime);
                          const isSlotSameDay = isSameDay(slot.startDateTime, slot.endDateTime);
                          
                          return (
                            <div key={slot.index} className="px-3 py-2.5 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0 w-12 text-center">
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                      #{slot.index + 1}
                                    </Badge>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium">
                                        {format(slot.startDateTime, "h:mm a")} - {format(slot.endDateTime, isSlotSameDay ? "h:mm a" : "h:mm a")}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatDuration(duration)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {hasMoreSlots && !isExpanded && (
                          <div className="px-3 py-2 text-center text-xs text-muted-foreground bg-muted/20">
                            +{group.slots.length - INITIAL_VISIBLE_SLOTS_PER_GROUP} more slot{group.slots.length - INITIAL_VISIBLE_SLOTS_PER_GROUP !== 1 ? 's' : ''} (click to expand)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Show More/Less Button */}
                {groupedTimeSlots.length > INITIAL_VISIBLE_GROUPS && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllSlots(!showAllSlots)}
                    className="w-full mt-2"
                  >
                    {showAllSlots ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show All Dates ({groupedTimeSlots.length - INITIAL_VISIBLE_GROUPS} more)
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <Calendar className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No time slots selected</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payment Summary
          </CardTitle>
          <CardDescription>
            Payment will be processed after your event request is approved
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoadingConfig || isLoadingLocation ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bookingConfig && formValues.dateRanges && formValues.dateRanges.length > 0 ? (
            <div className="space-y-6">
              {/* Booking Details */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Booking Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Duration</p>
                    <p className="text-lg font-semibold">{formatDuration(totalMinutes)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ({totalHours} hour{totalHours !== 1 ? 's' : ''})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Time Slots</p>
                    <p className="text-lg font-semibold">{formValues.dateRanges.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      slot{formValues.dateRanges.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Base Price</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(parseFloat(bookingConfig.baseBookingPrice), bookingConfig.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      per {formatDuration(bookingConfig.minBookingDurationMinutes)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Venue Booking Fee
                  </span>
                  <span className="font-semibold text-xl">
                    {formatCurrency(totalCost, currency)}
                  </span>
                </div>
                
                {bookingConfig && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t bg-muted/20 p-3 rounded">
                    <p>• Minimum booking duration: {formatDuration(bookingConfig.minBookingDurationMinutes)}</p>
                    <p>• Maximum booking duration: {formatDuration(bookingConfig.maxBookingDurationMinutes)}</p>
                    <p>• Minimum gap between bookings: {formatDuration(bookingConfig.minGapBetweenBookingsMinutes)}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg">Estimated Total</span>
                  <span className="font-bold text-3xl text-primary">
                    {formatCurrency(totalCost, currency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  Final amount may vary based on approval and additional fees
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {!formValues.locationId ? (
                <div>
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Please select a venue to view booking costs</p>
                </div>
              ) : !formValues.dateRanges || formValues.dateRanges.length === 0 ? (
                <div>
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Please select event time slots to calculate booking costs</p>
                </div>
              ) : (
                <div>
                  <Loader2 className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                  <p className="text-sm">Unable to load booking configuration</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => handleEditStep(3)}
          className="flex-1"
          disabled={isSubmitting}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
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