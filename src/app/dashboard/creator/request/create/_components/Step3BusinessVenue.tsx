"use client";

import { useState, useEffect } from "react";
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

interface Step3BusinessVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

// Mock locations data - NO API CALLS
const MOCK_LOCATIONS = [
  {
    id: "8d1b0a75-f77f-4f7f-bf5c-88c51972852c",
    name: "Hội Quán Sinh Viên Chiến Đạt",
    description: "A versatile downtown space ideal for conferences, workshops, and performances. Features modern amenities and flexible seating arrangements.",
    imageUrl: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1519167758481-83f29da8c9b3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop"
    ],
    addressLine: "ĐT 743",
    addressLevel1: "Bình Dương",
    addressLevel2: "Thành phố Hồ Chí Minh",
    latitude: 10.8747888,
    longitude: 106.7978802,
    business: {
      name: "Urban Events Co.",
      email: "contact@urbanevents.com",
      phone: "+84 123 456 789",
      website: "https://www.urbanevents.com",
      avatar: "https://i.pravatar.cc/150?u=business1",
      category: "EVENTS_VENUE",
    },
    tags: [
      { tag: { displayName: "Conference Hall", color: "#3B82F6", icon: "🎤" } },
      { tag: { displayName: "Workshop Space", color: "#10B981", icon: "🛠️" } },
      { tag: { displayName: "Modern", color: "#8B5CF6", icon: "✨" } },
    ],
    analytics: {
      totalCheckIns: 450,
      totalReviews: 89,
      averageRating: 4.7,
    },
  },
  {
    id: "a1234567-89ab-cdef-0123-456789abcdef",
    name: "Riverside Convention Center",
    description: "Stunning riverside venue with panoramic views, perfect for large-scale events, galas, and corporate functions. State-of-the-art AV equipment included.",
    imageUrl: [
      "https://images.unsplash.com/photo-1519167758481-83f29da8c9b3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop"
    ],
    addressLine: "123 Riverside Drive",
    addressLevel1: "Ho Chi Minh City",
    addressLevel2: "District 1",
    latitude: 10.7769,
    longitude: 106.7009,
    business: {
      name: "Premium Venues Ltd",
      email: "info@premiumvenues.vn",
      phone: "+84 987 654 321",
      website: "https://www.premiumvenues.vn",
      avatar: "https://i.pravatar.cc/150?u=business2",
      category: "CONVENTION_CENTER",
    },
    tags: [
      { tag: { displayName: "Large Capacity", color: "#EF4444", icon: "🏢" } },
      { tag: { displayName: "Riverside", color: "#06B6D4", icon: "🌊" } },
      { tag: { displayName: "Elegant", color: "#6366F1", icon: "💎" } },
    ],
    analytics: {
      totalCheckIns: 1200,
      totalReviews: 234,
      averageRating: 4.9,
    },
  },
  {
    id: "b2345678-90bc-def0-1234-56789abcdef0",
    name: "Garden Terrace Event Space",
    description: "Beautiful outdoor garden venue with covered terrace. Perfect for weddings, garden parties, and intimate gatherings. Catering services available.",
    imageUrl: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop"
    ],
    addressLine: "456 Garden Street",
    addressLevel1: "Hanoi",
    addressLevel2: "Ba Dinh District",
    latitude: 21.0285,
    longitude: 105.8542,
    business: {
      name: "Garden Events Co.",
      email: "hello@gardenevents.vn",
      phone: "+84 555 123 456",
      website: "https://www.gardenevents.vn",
      avatar: "https://i.pravatar.cc/150?u=business3",
      category: "OUTDOOR_VENUE",
    },
    tags: [
      { tag: { displayName: "Outdoor", color: "#10B981", icon: "🌳" } },
      { tag: { displayName: "Garden", color: "#84CC16", icon: "🌺" } },
      { tag: { displayName: "Romantic", color: "#EC4899", icon: "💕" } },
    ],
    analytics: {
      totalCheckIns: 320,
      totalReviews: 67,
      averageRating: 4.8,
    },
  },
];

export function Step3BusinessVenue({ form }: Step3BusinessVenueProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    form.watch("locationId")
  );
  const [showCalendar, setShowCalendar] = useState(false);

  // Get mock location data - NO API CALLS
  const location = MOCK_LOCATIONS.find((loc) => loc.id === selectedLocationId);

  useEffect(() => {
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
      console.log("Selected location:", MOCK_LOCATIONS.find(l => l.id === selectedLocationId)?.name);
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

      {/* Location Dropdown Selector - MOCK DATA (No API calls) */}
      <div className="space-y-2">
        <Label htmlFor="location-select">Select Location</Label>
        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a venue..." />
          </SelectTrigger>
          <SelectContent>
            {MOCK_LOCATIONS.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{location.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {location.addressLine}, {location.addressLevel1}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Mock data for testing. No API calls are made in Step 3.
          </AlertDescription>
        </Alert>
      </div>

      {/* Map - Currently displays selected location (will support pin selection with API key) */}
      <VenueMapSelector
        onLocationSelect={setSelectedLocationId}
        selectedLocationId={selectedLocationId}
      />

      {/* Location Details - MOCK DATA */}
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
              name: location.business?.name || "",
              email: location.business?.email || "",
              phone: location.business?.phone || "",
              website: location.business?.website,
              avatar: location.business?.avatar,
              category: location.business?.category || "",
            },
            tags: location.tags || [],
            analytics: location.analytics,
          }}
          onBookNow={handleBookNow}
        />
      )}

      {/* Availability Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="w-[90vw] max-w-[1400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Your Event Times</DialogTitle>
          </DialogHeader>
          <AvailabilityCalendar
            onSlotsChange={handleSlotsChange}
            initialSlots={(form.watch as any)("dateRanges") || []}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
