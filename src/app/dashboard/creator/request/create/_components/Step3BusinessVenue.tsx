/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { VenueMapSelector } from "./VenueMapSelector";
import { LocationDetailsPanel } from "./LocationDetailsPanel";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  MapPin, 
  Info, 
  X,
  CheckCircle2,
  DollarSign,
  Clock,
  Building2,
  Calendar
} from "lucide-react";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Step3BusinessVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3BusinessVenue({ form }: Step3BusinessVenueProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    form.watch("locationId")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const previousLocationIdRef = useRef<string | undefined>(form.watch("locationId"));
  
  const { data: bookableLocationsData, isLoading: isLoadingLocations } = useBookableLocations({ 
    page: 1, 
    limit: 100, 
    sortBy: 'name:ASC',
    search: searchQuery || undefined
  });

  const locations = bookableLocationsData?.data || [];
  const location = locations.find((loc) => loc.id === selectedLocationId);

  // Map bookable locations to format expected by VenueMapSelector
  const mappedLocations = useMemo(() => 
    locations
      .filter(loc => {
        const lat = Number((loc as any).latitude);
        const lng = Number((loc as any).longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        latitude: Number((loc as any).latitude),
        longitude: Number((loc as any).longitude),
        addressLine: loc.addressLine,
        addressLevel1: loc.addressLevel1,
        addressLevel2: loc.addressLevel2,
        imageUrl: loc.imageUrl,
        bookingConfig: (loc as any).bookingConfig ? {
          baseBookingPrice: (loc as any).bookingConfig.baseBookingPrice,
          currency: (loc as any).bookingConfig.currency,
          minBookingDurationMinutes: (loc as any).bookingConfig.minBookingDurationMinutes,
          maxBookingDurationMinutes: (loc as any).bookingConfig.maxBookingDurationMinutes,
        } : undefined,
        business: (loc as any).business ? {
          name: (loc as any).business.name,
        } : undefined,
      })),
    [locations]
  );

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    
    const query = searchQuery.toLowerCase();
    return locations.filter(loc => 
      loc.name.toLowerCase().includes(query) ||
      loc.addressLine.toLowerCase().includes(query) ||
      loc.addressLevel1?.toLowerCase().includes(query) ||
      loc.description?.toLowerCase().includes(query)
    );
  }, [locations, searchQuery]);

  useEffect(() => {
    // If venue changed (not just initialized), clear selected time slots
    // This handles both: changing from one venue to another, and clearing the venue
    if (previousLocationIdRef.current !== undefined && 
        previousLocationIdRef.current !== selectedLocationId) {
      // Clear date ranges when venue changes
      form.setValue("dateRanges" as any, [], { shouldValidate: true });
      // Also close the calendar dialog if it's open
      setShowCalendar(false);
    }
    
    // Update previous location ID
    previousLocationIdRef.current = selectedLocationId;
    
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
      setShowDetails(true);
    } else {
      // When venue is cleared, also clear the locationId in the form
      form.setValue("locationId", undefined, { shouldValidate: true });
      setShowDetails(false);
    }
  }, [selectedLocationId, form]);

  const handleSlotsChange = (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => {
    form.setValue("dateRanges" as any, slots, { shouldValidate: true });
  };

  const handleBookNow = () => {
    setShowCalendar(true);
  };

  const formatPrice = (price: string | number, currency: string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return null;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "VND",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Choose Business Venue</h2>
        <p className="text-muted-foreground">
          Click on a location marker on the map to view details and select your venue.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search venues by name, address, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11"
        />
        {filteredLocations.length > 0 && (
          <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2">
            {filteredLocations.length} venues
          </Badge>
        )}
      </div>

      {/* Error Messages */}
      {form.formState.errors.locationId && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>{form.formState.errors.locationId.message}</AlertDescription>
        </Alert>
      )}

      {(form.formState.errors as any).dateRanges && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>{(form.formState.errors as any).dateRanges.message}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoadingLocations && (
        <Card className="h-[600px] flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading venues...</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoadingLocations && filteredLocations.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto" />
            <div>
              <h3 className="font-semibold">No venues found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery 
                  ? `Try adjusting your search "${searchQuery}"`
                  : "No venues available at the moment"}
              </p>
            </div>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Main Content - Flexible Map Layout */}
      {!isLoadingLocations && filteredLocations.length > 0 && (
        <div className={cn(
          "grid gap-4 transition-all",
          selectedLocationId 
            ? "grid-cols-1 lg:grid-cols-3" 
            : "grid-cols-1"
        )}>
          {/* Map Section - Full width when no selection, 2/3 when selected */}
          <div className={cn(
            "space-y-4",
            selectedLocationId && "lg:col-span-2"
          )}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Select Location on Map</h3>
                {mappedLocations.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {mappedLocations.length} venues
                  </Badge>
                )}
              </div>
              {mappedLocations.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No venues with map coordinates available. Please use the list below to select a location.
                  </AlertDescription>
                </Alert>
              ) : (
                <Card className="overflow-hidden">
                  <div className="h-[500px] lg:h-[600px] xl:h-[700px]">
                    <VenueMapSelector
                      locations={mappedLocations}
                      onLocationSelect={setSelectedLocationId}
                      selectedLocationId={selectedLocationId}
                    />
                  </div>
                </Card>
              )}
            </div>

            {/* Location List (for venues without coordinates or as alternative) */}
            {filteredLocations.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Or Select from List</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {filteredLocations.map((loc) => {
                    const isSelected = selectedLocationId === loc.id;
                    const price = (loc as any).bookingConfig?.baseBookingPrice;
                    const currency = (loc as any).bookingConfig?.currency || "VND";
                    
                    return (
                      <Card
                        key={loc.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md border-2 p-3",
                          isSelected
                            ? "border-primary shadow-md ring-2 ring-primary/20"
                            : "border-transparent hover:border-border"
                        )}
                        onClick={() => setSelectedLocationId(loc.id)}
                      >
                        <div className="flex gap-3">
                          {loc.imageUrl?.[0] && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border">
                              <Image
                                src={loc.imageUrl[0]}
                                alt={loc.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm line-clamp-1">{loc.name}</h4>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                              {loc.addressLine}, {loc.addressLevel1}
                            </p>
                            {price && (
                              <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                <DollarSign className="h-3 w-3" />
                                <span>{formatPrice(price, currency)}</span>
                                <span className="text-muted-foreground font-normal">/hr</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Location Details (only shown when location is selected) */}
          {selectedLocationId && location && (
            <div className="space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Venue Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedLocationId(undefined);
                    setShowDetails(false);
                  }}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4 sticky top-4">
                {/* Quick Summary Card */}
                <Card className={cn(
                  "border-2 transition-all",
                  "border-primary bg-primary/5"
                )}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <h3 className="font-semibold text-lg truncate">{location.name}</h3>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-2">
                            {location.addressLine}, {location.addressLevel1}
                          </span>
                        </div>
                        {(location as any).bookingConfig?.baseBookingPrice && (
                          <div className="flex items-center gap-1 text-green-600 font-semibold mb-3">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {formatPrice(
                                (location as any).bookingConfig.baseBookingPrice,
                                (location as any).bookingConfig.currency || "VND"
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">/hr</span>
                          </div>
                        )}
                      </div>
                      {location.imageUrl?.[0] && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                          <Image
                            src={location.imageUrl[0]}
                            alt={location.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowDetails(!showDetails)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {showDetails ? "Hide" : "View"} Details
                      </Button>
                      <Button 
                        onClick={handleBookNow}
                        size="sm"
                        className="flex-1"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Select Time
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Detailed View */}
                {showDetails && (
                  <LocationDetailsPanel
                    location={{
                      id: location.id,
                      name: location.name,
                      description: location.description || "",
                      imageUrl: location.imageUrl || [],
                      addressLine: location.addressLine,
                      addressLevel1: location.addressLevel1,
                      addressLevel2: location.addressLevel2,
                      business: {
                        name: (location as any).business?.name || "",
                        email: (location as any).business?.email || "",
                        phone: (location as any).business?.phone || "",
                        website: (location as any).business?.website,
                        avatar: (location as any).business?.avatar,
                        category: (location as any).business?.category || "",
                      },
                      tags: location.tags || [],
                      analytics: undefined as any,
                      bookingConfig: (location as any).bookingConfig ? {
                        baseBookingPrice: (location as any).bookingConfig.baseBookingPrice,
                        currency: (location as any).bookingConfig.currency,
                        minBookingDurationMinutes: (location as any).bookingConfig.minBookingDurationMinutes,
                        maxBookingDurationMinutes: (location as any).bookingConfig.maxBookingDurationMinutes,
                        minGapBetweenBookingsMinutes: (location as any).bookingConfig.minGapBetweenBookingsMinutes,
                        allowBooking: (location as any).bookingConfig.allowBooking,
                      } : undefined,
                    }}
                    onBookNow={handleBookNow}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Availability Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="w-[90vw] !max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Event Times</DialogTitle>
          </DialogHeader>
          <AvailabilityCalendar
            key={selectedLocationId || "no-location"}
            onSlotsChange={handleSlotsChange}
            initialSlots={(form.watch as any)("dateRanges") || []}
            locationId={selectedLocationId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
