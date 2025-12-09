/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { VenueMapSelector } from "./VenueMapSelector";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Building2, MapPin, Calendar, CheckCircle2, Loader2, AlertCircle, Map, Star } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { cn } from "@/lib/utils";

interface Step3BusinessVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3BusinessVenue({ form }: Step3BusinessVenueProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    form.watch("locationId")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMapView, setShowMapView] = useState(true); // Show map by default
  const [isInitializingCalendar, setIsInitializingCalendar] = useState(false);
  const { data: bookableLocationsData, isLoading: isLoadingLocations } = useBookableLocations({ 
    page: 1, 
    limit: 50, 
    sortBy: 'name:ASC' 
  });

  const locations = bookableLocationsData?.data || [];
  const location = locations.find((loc) => loc.id === selectedLocationId);
  const dateRanges = form.watch("dateRanges") || [];
  const hasBookedSlots = dateRanges && dateRanges.length > 0;
  
  // Fetch detailed location data for analytics (check-ins, reviews, etc.)
  const { data: bookableLocationDetails } = useBookableLocationById(selectedLocationId);
  // Also fetch regular location data which may have analytics
  const { data: regularLocationDetails } = useLocationById(selectedLocationId);
  
  // Combine data from both sources
  const locationDetails = bookableLocationDetails || regularLocationDetails;

  // Handle location selection - clear dateRanges when location changes
  const handleLocationSelect = (locationId: string) => {
    const previousLocationId = selectedLocationId;
    
    // If location changed (not just initial set), clear dateRanges
    if (previousLocationId && previousLocationId !== locationId) {
      form.setValue("dateRanges" as any, [], { shouldValidate: false });
    }
    
    setSelectedLocationId(locationId);
    form.setValue("locationId", locationId, { shouldValidate: true });
  };

  useEffect(() => {
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
    }
  }, [selectedLocationId, form]);

  const handleSlotsChange = (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => {
    form.setValue("dateRanges" as any, slots, { shouldValidate: true });
    // Don't close dialog automatically - let user edit freely
  };

  const handleSaveSlots = () => {
    setShowCalendar(false);
  };

  const handleBookNow = () => {
    if (!selectedLocationId) {
      return;
    }
    setIsInitializingCalendar(true);
    setShowCalendar(true);
    // Reset initialization flag after a short delay to allow calendar to initialize
    setTimeout(() => {
      setIsInitializingCalendar(false);
    }, 500);
  };

  // Mock data for booked and unavailable slots - TODO: Replace with API calls
  const mockBookedSlots = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(13, 0, 0, 0);
    
    const day4 = new Date();
    day4.setDate(day4.getDate() + 3);
    day4.setHours(10, 0, 0, 0);

    return [
      { startDateTime: tomorrow, endDateTime: new Date(tomorrow.getTime() + 60 * 60 * 1000) },
      { startDateTime: day4, endDateTime: new Date(day4.getTime() + 60 * 60 * 1000) },
    ];
  }, []);

  const mockUnavailableSlots = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate());
    today.setHours(12, 0, 0, 0);

    return [
      { startDateTime: today, endDateTime: new Date(today.getTime() + 60 * 60 * 1000) },
    ];
  }, []);

  const isLocationComplete = selectedLocationId && hasBookedSlots;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b-2 border-primary/20">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Choose Event Location
            </h2>
            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
              Optional
            </Badge>
          </div>
          <p className="text-muted-foreground text-base mb-3">
            Select a venue and book your event time slots. You can skip this step and add a location later.
          </p>
          {isLocationComplete && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                Location selected and time slots booked
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-200 ml-2">
          <strong className="font-semibold">Tip:</strong> Booking a location now helps ensure venue availability. You can always add or change the location when editing your event.
        </AlertDescription>
      </Alert>

      {/* Location Selection */}
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="location-select" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Select Venue
              </Label>
              {selectedLocationId && (
                <Badge variant="outline" className="text-xs">
                  Selected
                </Badge>
              )}
            </div>
            {locations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapView(!showMapView)}
                className="text-xs"
              >
                <Map className="h-3 w-3 mr-1" />
                {showMapView ? "Hide Map" : "Show Map"}
              </Button>
            )}
          </div>
          
          {/* Map View - Show by default when locations are available */}
          {showMapView && locations.length > 0 && (
            <Card className="h-[500px] w-full border-2 border-primary/10 py-0">
              <CardContent className="p-0 h-full">
                <VenueMapSelector
                  locations={locations.map((loc) => {
                    // If this is the selected location and we have detailed data, use it
                    const isSelected = loc.id === selectedLocationId;
                    const detailedData = isSelected && locationDetails ? locationDetails : null;
                    
                    return {
                      id: loc.id,
                      name: loc.name,
                      description: loc.description,
                      latitude: Number(loc.latitude) || 0,
                      longitude: Number(loc.longitude) || 0,
                      addressLine: loc.addressLine,
                      addressLevel1: loc.addressLevel1,
                      addressLevel2: loc.addressLevel2,
                      imageUrl: loc.imageUrl || [],
                      bookingConfig: loc.bookingConfig,
                      business: loc.business,
                      // Add analytics if available from detailed data
                      ...(detailedData && {
                        totalCheckIns: detailedData.totalCheckIns,
                        analytics: {
                          totalCheckIns: detailedData.totalCheckIns 
                            ? (typeof detailedData.totalCheckIns === 'string' 
                                ? parseInt(detailedData.totalCheckIns) 
                                : detailedData.totalCheckIns)
                            : 0,
                          totalReviews: detailedData.totalReviews || 0,
                          averageRating: detailedData.averageRating 
                            ? (typeof detailedData.averageRating === 'string' 
                                ? parseFloat(detailedData.averageRating) 
                                : detailedData.averageRating)
                            : 0,
                        },
                      }),
                    };
                  })}
                  onLocationSelect={handleLocationSelect}
                  selectedLocationId={selectedLocationId}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Dropdown Selection */}
          <div className="space-y-2">
            <Label htmlFor="location-select" className="text-sm font-medium text-muted-foreground">
              Or select from dropdown:
            </Label>
            <Select 
              value={selectedLocationId} 
              onValueChange={handleLocationSelect}
            >
              <SelectTrigger 
                id="location-select"
                className={cn(
                  "w-full h-11 border-primary/20 focus:border-primary/50 transition-all",
                  selectedLocationId && "border-green-500/50 focus:border-green-500"
                )}
              >
                <SelectValue placeholder={isLoadingLocations ? "Loading venues..." : "Choose a venue (optional)..."} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {isLoadingLocations ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading venues...</span>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No venues available
                  </div>
                ) : (
                  locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id} className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{loc.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {loc.addressLine}
                          {loc.addressLevel1 && `, ${loc.addressLevel1}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {!isLoadingLocations && locations.length === 0 && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                No venues available at the moment. You can skip this step and add a location later when editing your event.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Show message when map is hidden */}
          {!showMapView && locations.length > 0 && (
            <Alert className="mt-2">
              <Map className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Click "Show Map" to view all available venues on the map with location pins.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {form.formState.errors.locationId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {form.formState.errors.locationId.message}
            </AlertDescription>
          </Alert>
        )}

        {(form.formState.errors as any).dateRanges && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {(form.formState.errors as any).dateRanges.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Location Details */}
        {location && (
          <div 
            data-location-details-panel
            className="border-2 rounded-xl p-5 space-y-4 transition-all border-primary/10 bg-primary/5"
          >
            {/* Images */}
            {location.imageUrl && location.imageUrl.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {location.imageUrl.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted"
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
            
            <div>
              <h3 className="text-lg font-semibold mb-1">{location.name}</h3>
              <p className="text-sm text-muted-foreground">
                {location.addressLine}
                {location.addressLevel1 && `, ${location.addressLevel1}`}
              </p>
            </div>
            
            {location.description && (
              <p className="text-sm text-foreground">{location.description}</p>
            )}
            
            {/* Analytics */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {locationDetails?.averageRating !== undefined ? (
                locationDetails.averageRating > 0 ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {typeof locationDetails.averageRating === 'string' 
                        ? parseFloat(locationDetails.averageRating).toFixed(1)
                        : locationDetails.averageRating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <span>No rating yet</span>
                )
              ) : (
                <span>No rating yet</span>
              )}
              <span>
                {locationDetails?.totalCheckIns 
                  ? (typeof locationDetails.totalCheckIns === 'string' 
                      ? parseInt(locationDetails.totalCheckIns) 
                      : locationDetails.totalCheckIns)
                  : 0} check-ins
              </span>
              <span>
                {locationDetails?.totalReviews || 0} reviews
              </span>
            </div>
            
            {/* Book Time Slots Button */}
            {!hasBookedSlots ? (
              <Button
                onClick={handleBookNow}
                className="w-full"
                size="lg"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Time Slots
              </Button>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-200">
                      {dateRanges.length} time slot{dateRanges.length !== 1 ? "s" : ""} booked
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsInitializingCalendar(true);
                      setShowCalendar(true);
                      // Reset initialization flag after a short delay to allow calendar to initialize
                      setTimeout(() => {
                        setIsInitializingCalendar(false);
                      }, 500);
                    }}
                    className="text-xs h-7"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Edit Slots
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Location Selected State */}
        {!selectedLocationId && !isLoadingLocations && (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No venue selected
            </p>
            <p className="text-xs text-muted-foreground">
              Select a venue above to view details and book time slots, or skip this step to continue.
            </p>
          </div>
        )}
      </div>

      {/* Availability Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={(open) => {
        setShowCalendar(open);
        setIsInitializingCalendar(false);
      }}>
        <DialogContent className="w-[95vw] !max-w-6xl max-h-[88vh] overflow-hidden flex flex-col mt-6 p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold mb-1.5">Select Event Time Slots</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {location?.name}
                </DialogDescription>
              </div>
              {dateRanges && dateRanges.length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                  {dateRanges.length} slot{dateRanges.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedLocationId && (
              <AvailabilityCalendar
                locationId={selectedLocationId}
                onSlotsChange={handleSlotsChange}
                initialSlots={dateRanges || []}
              />
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Click and drag to select multiple time slots
            </p>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCalendar(false)}
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSlots} 
                size="sm"
                className="min-w-[100px]"
              >
                Save Slots
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
