/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { VenueMapSelector } from "./VenueMapSelector";
import { LocationDetailsPanel } from "./LocationDetailsPanel";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";

interface Step3BusinessVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

// Using real API: bookable locations

export function Step3BusinessVenue({ form }: Step3BusinessVenueProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    form.watch("locationId")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const { data: bookableLocationsData, isLoading: isLoadingLocations } = useBookableLocations({ page: 1, limit: 20, sortBy: 'name:ASC' });

  const locations = bookableLocationsData?.data || [];
  const location = locations.find((loc) => loc.id === selectedLocationId);

  useEffect(() => {
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
      // console.log selected location for debugging if needed
    }
  }, [selectedLocationId, form]);

  const handleSlotsChange = (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => {
    form.setValue("dateRanges" as any, slots, { shouldValidate: true });
  };

  const handleBookNow = () => {
    setShowCalendar(true);
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Choose Business Venue</h2>
        <p className="text-muted-foreground">
          Select a venue to view details and book your event time.
        </p>
      </div>

      {form.formState.errors.locationId && (
        <div className="text-sm text-destructive">
          {form.formState.errors.locationId.message}
        </div>
      )}

      {(form.formState.errors as any).dateRanges && (
        <div className="text-sm text-destructive">
          {(form.formState.errors as any).dateRanges.message}
        </div>
      )}

      {/* Location Dropdown Selector - Using API */}
      <div className="space-y-2">
        <Label htmlFor="location-select">Select Location</Label>
        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoadingLocations ? "Loading venues..." : "Choose a venue..."} />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{loc.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {loc.addressLine}, {loc.addressLevel1}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isLoadingLocations && locations.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              No venues found. Try again later or adjust your search criteria.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Map - Currently displays selected location (will support pin selection with API key) */}
      {/* <VenueMapSelector
        onLocationSelect={setSelectedLocationId}
        selectedLocationId={selectedLocationId}
      /> */}

      {/* Location Details */}
      {location && (
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
      )}

      {/* Availability Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="w-[90vw] !max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Event Times</DialogTitle>
          </DialogHeader>
          <AvailabilityCalendar
            onSlotsChange={handleSlotsChange}
            initialSlots={(form.watch as any)("dateRanges") || []}
            locationId={selectedLocationId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
