/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { VenueMapSelector } from "./VenueMapSelector";
import { LocationDetailsPanel } from "./LocationDetailsPanel";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Building2, MapPin, Calendar, CheckCircle2, Loader2, AlertCircle, Map } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import { cn } from "@/lib/utils";

interface Step3BusinessVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3BusinessVenue({ form }: Step3BusinessVenueProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    form.watch("locationId")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const { data: bookableLocationsData, isLoading: isLoadingLocations } = useBookableLocations({ 
    page: 1, 
    limit: 50, 
    sortBy: 'name:ASC' 
  });

  const locations = bookableLocationsData?.data || [];
  const location = locations.find((loc) => loc.id === selectedLocationId);
  const dateRanges = form.watch("dateRanges") || [];
  const hasBookedSlots = dateRanges && dateRanges.length > 0;

  useEffect(() => {
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
    }
  }, [selectedLocationId, form]);

  const handleSlotsChange = (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => {
    form.setValue("dateRanges" as any, slots, { shouldValidate: true });
    setShowCalendar(false);
  };

  const handleBookNow = () => {
    if (!selectedLocationId) {
      return;
    }
    setShowCalendar(true);
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
      <div className="flex items-start gap-3 pb-3 border-b border-primary/10">
        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold">Choose Event Location</h2>
            <Badge variant="secondary" className="text-xs">
              Optional
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Select a venue and book your event time slots. You can skip this step and add a location later.
          </p>
          {isLocationComplete && (
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                Location selected and time slots booked
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Tip:</strong> Booking a location now helps ensure venue availability. You can always add or change the location when editing your event.
        </AlertDescription>
      </Alert>

      {/* Location Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
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
            {/* Future: Add map view toggle button here */}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMapView(!showMapView)}
              className="text-xs"
            >
              <Map className="h-3 w-3 mr-1" />
              {showMapView ? "List View" : "Map View"}
            </Button> */}
          </div>
          
          {/* Dropdown Selection (Current Implementation) */}
          <Select 
            value={selectedLocationId} 
            onValueChange={setSelectedLocationId}
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
          
          {!isLoadingLocations && locations.length === 0 && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                No venues available at the moment. You can skip this step and add a location later when editing your event.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Future: Map View (commented out for now) */}
          {/* {showMapView && (
            <Card className="h-[400px] w-full mt-4">
              <CardContent className="p-0 h-full">
                <VenueMapSelector
                  locations={locations}
                  onLocationSelect={setSelectedLocationId}
                  selectedLocationId={selectedLocationId}
                />
              </CardContent>
            </Card>
          )} */}
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
          <div className={cn(
            "border-2 rounded-xl p-5 space-y-4 transition-all",
            isLocationComplete 
              ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
              : "border-primary/10 bg-primary/5"
          )}>
            <LocationDetailsPanel
              location={{
                id: location.id,
                name: location.name,
                description: location.description,
                imageUrl: location.imageUrl || [],
                addressLine: location.addressLine,
                addressLevel1: location.addressLevel1,
                addressLevel2: location.addressLevel2,
                business: {
                  name: "",
                  email: "",
                  phone: "",
                  website: undefined,
                  avatar: undefined,
                  category: "",
                },
                tags: [],
                analytics: undefined as any,
              }}
              onBookNow={handleBookNow}
            />

            {/* Booked Time Slots Summary */}
            {hasBookedSlots && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
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
                    onClick={() => setShowCalendar(true)}
                    className="text-xs h-7"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Edit Slots
                  </Button>
                </div>
              </div>
            )}

            {/* Book Time Slots Button */}
            {!hasBookedSlots && (
              <Button
                onClick={handleBookNow}
                className="w-full"
                size="lg"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Time Slots
              </Button>
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
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="w-[90vw] !max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Event Time Slots</DialogTitle>
            <DialogDescription>
              Choose the dates and times when your event will take place at {location?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLocationId && (
            <AvailabilityCalendar
              locationId={selectedLocationId}
              onSlotsChange={handleSlotsChange}
              initialSlots={dateRanges || []}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
