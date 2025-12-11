/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { VenueMapSelector } from "./VenueMapSelector";
import { LocationDetailsPanel } from "./LocationDetailsPanel";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Loader2, 
  Search, 
  MapPin, 
  Grid3x3, 
  Info, 
  X,
  CheckCircle2,
  DollarSign,
  Clock,
  Building2
} from "lucide-react";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Step3PublicVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3PublicVenue({ form }: Step3PublicVenueProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    form.watch("locationId")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
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
        latitude: Number((loc as any).latitude),
        longitude: Number((loc as any).longitude),
        addressLine: loc.addressLine,
        addressLevel1: loc.addressLevel1,
        addressLevel2: loc.addressLevel2,
        imageUrl: loc.imageUrl,
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
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
      setShowDetails(true);
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
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search public venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showMap ? "default" : "outline"}
            size="default"
            onClick={() => setShowMap(!showMap)}
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
          {mappedLocations.length > 0 && (
            <Badge variant="secondary" className="items-center gap-1 px-3">
              <Grid3x3 className="h-3 w-3" />
              {filteredLocations.length} venues
            </Badge>
          )}
        </div>
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
        <Card className="h-[400px] flex items-center justify-center">
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
                  : "No public venues available at the moment"}
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

      {/* Main Content */}
      {!isLoadingLocations && filteredLocations.length > 0 && (
        <div className="space-y-4">
          {/* Map View */}
          {showMap && mappedLocations.length > 0 && (
            <Card className="overflow-hidden">
              <div className="h-[400px]">
                <VenueMapSelector
                  locations={mappedLocations}
                  onLocationSelect={setSelectedLocationId}
                  selectedLocationId={selectedLocationId}
                />
              </div>
            </Card>
          )}

          {/* Selected Location Summary */}
          {selectedLocationId && location && (
            <Card className={cn(
              "border-2 transition-all",
              "border-primary bg-primary/5"
            )}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-lg truncate">{location.name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{location.addressLine}, {location.addressLevel1}</span>
                      </div>
                      {(location as any).bookingConfig?.baseBookingPrice && (
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <DollarSign className="h-3 w-3" />
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
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowDetails(!showDetails)}
                        variant="outline"
                        size="sm"
                      >
                        {showDetails ? "Hide" : "View"} Details
                      </Button>
                      <Button 
                        onClick={handleBookNow}
                        size="sm"
                        className="flex-1"
                      >
                        Select Time Slots
                      </Button>
                    </div>
                  </div>
                  {location.imageUrl?.[0] && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border">
                      <Image
                        src={location.imageUrl[0]}
                        alt={location.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Location Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Available Public Venues</h3>
              {selectedLocationId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedLocationId(undefined);
                    setShowDetails(false);
                  }}
                  className="gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear Selection
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocationId === loc.id;
                const price = (loc as any).bookingConfig?.baseBookingPrice;
                const currency = (loc as any).bookingConfig?.currency || "VND";
                
                return (
                  <Card
                    key={loc.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-2 group",
                      isSelected
                        ? "border-primary shadow-md ring-2 ring-primary/20"
                        : "border-transparent hover:border-border"
                    )}
                    onClick={() => setSelectedLocationId(loc.id)}
                  >
                    <div className="p-0">
                      {/* Image */}
                      <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-muted">
                        {loc.imageUrl?.[0] ? (
                          <Image
                            src={loc.imageUrl[0]}
                            alt={loc.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Building2 className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-primary">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-semibold line-clamp-1">{loc.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {loc.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {loc.addressLine}, {loc.addressLevel1}
                          </span>
                        </div>
                        {(loc as any).bookingConfig && price && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatPrice(price, currency)}</span>
                              <span className="text-xs text-muted-foreground font-normal">/hr</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {(loc as any).bookingConfig.minBookingDurationMinutes / 60}h -{" "}
                                {(loc as any).bookingConfig.maxBookingDurationMinutes / 60}h
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Detailed View */}
          {showDetails && location && (
            <Card className="border-2 border-primary/20">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Venue Details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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

                {/* Terms and Conditions */}
                <div className="mt-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="publicVenueTermsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the terms and conditions *
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            By checking this box, you agree to follow all public venue guidelines,
                            including cleanup responsibilities, noise restrictions, and permitted hours.
                          </p>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Availability Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={(open) => {
        setShowCalendar(open);
        // Only clear slots if they haven't been saved yet
        // If slots are already saved (dateRanges has values), just close without clearing
        if (!open) {
          const savedSlots = (form.watch as any)("dateRanges") || [];
          // Only clear if no slots are saved
          if (savedSlots.length === 0) {
            form.setValue("dateRanges" as any, [], { shouldValidate: false });
          }
        }
      }}>
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
