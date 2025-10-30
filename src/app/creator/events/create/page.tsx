"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Image as ImageIcon, 
  FileText,
  Upload,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Globe,
  MapPinOff,
  X,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as RBCalendar, dateFnsLocalizer, Views, type SlotInfo } from "react-big-calendar";
import { format as dfFormat, parse as dfParse, startOfWeek, getDay, addHours, setMinutes, setSeconds } from "date-fns";
import { enUS } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVenueType, setSelectedVenueType] = useState<'business' | 'public' | 'custom' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [wardQuery, setWardQuery] = useState("");

  // Mock location data for demonstration
  const mockBusinessLocation = {
    id: "1",
    name: "Downtown Event Space",
    address: "123 Main St, New York, NY",
    ownerName: "John's Events LLC",
    ownerEmail: "contact@johnsevents.com",
    ownerPhone: "+1 234 567 8900",
    capacity: 500,
    price: 5000,
    amenities: ["WiFi", "Parking", "Catering", "AV Equipment"],
    description: "A versatile downtown space ideal for conferences, workshops, and performances.",
    images: [
      "https://picsum.photos/id/1018/600/400",
      "https://picsum.photos/id/1025/600/400",
      "https://picsum.photos/id/1038/600/400",
    ],
  };

  const mockPublicLocation = {
    id: "2",
    name: "Central Park Amphitheater",
    address: "Central Park, New York, NY",
    capacity: 1000,
    description: "Public outdoor amphitheater managed by the city",
  };

  const steps = [
    { number: 1, title: "Event Details", icon: FileText },
    { number: 2, title: "Choose Venue", icon: MapPin },
    { number: 3, title: "Review & Payment", icon: CreditCard },
  ];

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-6">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                  currentStep > step.number
                    ? "bg-green-500 border-green-500 text-white"
                    : currentStep === step.number
                    ? "bg-primary border-primary text-white"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <step.icon className="h-6 w-6" />
                )}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-[2px] w-20 mx-4 transition-colors ${
                  currentStep > step.number ? "bg-green-500" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  function DraggableMap({ onDropPin }: { onDropPin: (coords: { x: number; y: number }) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [pinPosition, setPinPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onDropPin(pinPosition);
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPinPosition({ x: clamp(x, 2, 98), y: clamp(y, 5, 95) });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      setPinPosition({ x: clamp(x, 2, 98), y: clamp(y, 5, 95) });
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onDropPin(pinPosition);
      }
    };

    return (
      <div
        className="border rounded-lg h-[400px] bg-muted/30 relative select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-foreground">Drag the pin to choose a spot</p>
        </div>
        <button
          type="button"
          className="absolute cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-full"
          style={{ left: `${pinPosition.x}%`, top: `${pinPosition.y}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          aria-label="Drag map pin"
        >
          <MapPin className="h-8 w-8 text-primary fill-primary drop-shadow" />
        </button>
      </div>
    );
  }

  function AvailabilityCalendar() {
    const locales = {
      "en-US": enUS,
    } as const;

    const localizer = dateFnsLocalizer({
      format: dfFormat,
      parse: dfParse,
      startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
      getDay,
      locales,
    });

    // Create mock 1-hour bookings for the current week
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const bookings = [
      { dayOffset: 1, hour: 10 },
      { dayOffset: 2, hour: 14 },
      { dayOffset: 3, hour: 9 },
      { dayOffset: 4, hour: 16 },
      { dayOffset: 5, hour: 11 },
    ].map((b) => {
      const start = setSeconds(setMinutes(addHours(weekStart, b.dayOffset * 24 + b.hour), 0), 0);
      const end = addHours(start, 1); // 1-hour interval
      return {
        title: "Booked",
        start,
        end,
        resource: { type: "BOOKED" },
        allDay: false,
      };
    });

    const minTime = setSeconds(setMinutes(new Date(1970, 1, 1, 6), 0), 0); // 6:00
    const maxTime = setSeconds(setMinutes(new Date(1970, 1, 1, 22), 0), 0); // 22:00

    const SELECTABLE_BG = "#e0f2fe"; // light sky blue
    const DISABLED_BG = "#f3f4f6";   // gray-100

    const [selection, setSelection] = useState<{ start: Date; end: Date } | null>(null);

    const roundToHour = (date: Date) => {
      const d = new Date(date);
      d.setMinutes(0, 0, 0);
      return d;
    };

    const isOverlappingExisting = (start: Date, end: Date) => {
      return bookings.some((b) => !(end <= b.start || start >= b.end));
    };

    const clampToSelectable = (date: Date) => {
      const d = new Date(date);
      const h = d.getHours();
      if (h < 7) d.setHours(7, 0, 0, 0);
      if (h >= 21) d.setHours(20, 0, 0, 0); // last selectable starts at 20:00
      d.setMinutes(0, 0, 0);
      return d;
    };

    const handleSelectSlot = (slotInfo: SlotInfo) => {
      let start = clampToSelectable(roundToHour(slotInfo.start));
      let end = clampToSelectable(roundToHour(slotInfo.end));
      if (end <= start) end = addHours(start, 1);

      // Ensure selection ends on the hour and within 7-21
      if (end.getHours() > 21 || (end.getHours() === 21 && end.getMinutes() > 0)) {
        end = new Date(start);
        end.setHours(21, 0, 0, 0);
      }

      // Prevent overlap with existing bookings
      if (isOverlappingExisting(start, end)) {
        return; // ignore invalid selection
      }
      setSelection({ start, end });
    };

    return (
      <div>
        <h4 className="font-semibold mb-2">Availability Calendar</h4>
        <div className="border rounded-lg p-2 bg-muted/30">
          <RBCalendar
            localizer={localizer}
            events={[...bookings, ...(selection ? [{ title: "Selected", start: selection.start, end: selection.end, resource: { type: "SELECTED" } }] : [])]}
            defaultView={Views.WEEK}
            views={[Views.WEEK]}
            step={60}
            timeslots={1}
            toolbar
            popup={false}
            showMultiDayTimes
            selectable
            onSelectSlot={handleSelectSlot}
            longPressThreshold={200}
            style={{ height: 520, borderRadius: 10 }}
            min={minTime}
            max={maxTime}
            slotPropGetter={(date) => {
              // Shade background for selectable windows (7:00 - 21:00)
              const hour = new Date(date).getHours();
              const selectable = hour >= 7 && hour < 21;
              const style: React.CSSProperties = {
                backgroundColor: selectable ? SELECTABLE_BG : DISABLED_BG,
              };
              return { style };
            }}
            eventPropGetter={(event) => {
              const isBooked = event.resource?.type === "BOOKED";
              const isSelected = event.resource?.type === "SELECTED";
              // Booked slots should be grayed out using the same disabled background color
              const style = {
                backgroundColor: isBooked ? DISABLED_BG : isSelected ? "#d1fae5" : SELECTABLE_BG,
                borderColor: isBooked ? DISABLED_BG : isSelected ? "#34d399" : SELECTABLE_BG,
                color: isBooked ? "#6b7280" : "#0f172a",
                borderRadius: 8,
                boxShadow: isBooked ? "inset 0 0 0 1px #e5e7eb" : "inset 0 0 0 1px rgba(0,0,0,0.06)",
              } as React.CSSProperties;
              return { style };
            }}
            components={{
              event: ({ event }) => {
                const isBooked = event.resource?.type === "BOOKED";
                const isSelected = event.resource?.type === "SELECTED";
                return (
                  <div className={`flex h-full w-full items-center justify-between px-2 py-1 ${isBooked ? "opacity-80" : ""}`}>
                    <span className="text-xs font-medium truncate">
                      {dfFormat(event.start as Date, "HH:mm")} - {dfFormat(event.end as Date, "HH:mm")}
                    </span>
                    <span className={`text-[10px] rounded px-1.5 py-0.5 ${isBooked ? "bg-gray-200 text-gray-700" : isSelected ? "bg-emerald-200 text-emerald-800" : "bg-sky-200 text-sky-800"}`}>
                      {isBooked ? "Booked" : isSelected ? "Selected" : "Available"}
                    </span>
                  </div>
                );
              },
            }}
            formats={{
              timeGutterFormat: (date, culture, loc) => dfFormat(date, "HH:mm"),
              eventTimeRangeFormat: ({ start, end }, culture, loc) => `${dfFormat(start, "HH:mm")} - ${dfFormat(end, "HH:mm")}`,
            }}
          />
          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: SELECTABLE_BG }} />
              <span className="text-muted-foreground">Selectable window (7:00 - 21:00)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: DISABLED_BG }} />
              <span className="text-muted-foreground">Unavailable window or booked</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                placeholder="Summer Music Festival 2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Input
                id="eventType"
                placeholder="Festival, Conference, Workshop..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your event in detail..."
              rows={4}
            />
          </div>
          {/* Start/End Date removed. Booking time is chosen in the venue step. */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Expected Attendees *</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Images & Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Event Banner/Poster</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload event banner
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Event Documentation</Label>
            <p className="text-sm text-muted-foreground">
              Upload any required permits, licenses, or supporting documents
            </p>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload documents
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOC up to 20MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Venue Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedVenueType || ''} onValueChange={(v) => setSelectedVenueType(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Venue
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public Location
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <MapPinOff className="h-4 w-4" />
                Custom Location
              </TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4 mt-6">
              <div className="rounded-md border border-blue-200 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/50 p-3">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Select a business-owned venue from the map. You'll see pricing and availability.
                </p>
              </div>
              
              {/* Map Placeholder with draggable pin */}
              <DraggableMap onDropPin={(coords) => {
                // Create mock info based on dropped coordinates
                const mock = {
                  ...mockBusinessLocation,
                  name: `Selected Spot (${Math.round(coords.x)}%, ${Math.round(coords.y)}%)`,
                  address: "Approximate address near dropped point",
                };
                setSelectedLocation(mock);
              }} />

              {/* Location Details Modal/Panel */}
              {selectedLocation && selectedVenueType === 'business' && (
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedLocation.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedLocation.address}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedLocation(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="font-semibold mb-2">Location Overview</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {selectedLocation.description}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedLocation.images?.map((src: string) => (
                            <div key={src} className="aspect-[3/2] overflow-hidden rounded-md border bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="venue" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Business Owner</h4>
                        <div className="rounded-md border p-3 bg-card">
                          <div className="text-sm">
                            <div className="flex items-center justify-between py-1">
                              <span className="text-muted-foreground">Name</span>
                              <span className="font-medium">{selectedLocation.ownerName}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-muted-foreground">Email</span>
                              <span className="font-medium">{selectedLocation.ownerEmail}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-muted-foreground">Phone</span>
                              <span className="font-medium">{selectedLocation.ownerPhone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Venue Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Capacity</p>
                          <p className="font-medium">{selectedLocation.capacity} people</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Booking Price</p>
                          <p className="font-medium text-green-600">${selectedLocation.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLocation.amenities.map((amenity: string) => (
                          <Badge key={amenity} variant="secondary">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <AvailabilityCalendar />

                    <Button className="w-full" size="lg">
                      Select This Venue
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="public" className="space-y-4 mt-6">
              <div className="rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/50 p-3">
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Public locations are free but require agreement to terms and conditions.
                </p>
              </div>

              {/* Map Placeholder */}
              <div className="border rounded-lg h-[400px] bg-muted/30 flex items-center justify-center relative">
                <Globe className="h-16 w-16 text-muted-foreground/50" />
                <p className="text-muted-foreground absolute">Map showing public locations - Click to select</p>
                
                <div 
                  className="absolute top-1/3 right-1/3 cursor-pointer"
                  onClick={() => setSelectedLocation(mockPublicLocation)}
                >
                  <Globe className="h-8 w-8 text-green-600 fill-green-600 animate-pulse" />
                </div>
              </div>

              {selectedLocation && selectedVenueType === 'public' && (
                <Card className="border-2 border-green-600">
                  <CardHeader>
                    <CardTitle>{selectedLocation.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.address}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm">{selectedLocation.description}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Capacity:</strong> {selectedLocation.capacity} people
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold">Terms of Usage</h4>
                      <div className="text-sm space-y-2 max-h-48 overflow-y-auto">
                        <p>By using this public location, you agree to:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Keep the area clean and dispose of waste properly</li>
                          <li>Follow all local regulations and noise ordinances</li>
                          <li>Provide adequate security and crowd control</li>
                          <li>Obtain necessary permits and insurance</li>
                          <li>Restore the location to original condition after event</li>
                          <li>Take full responsibility for any damages</li>
                        </ul>
                      </div>
                      <div className="flex items-start space-x-2 pt-2">
                        <Checkbox id="terms" />
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the terms and conditions for using this public location
                        </label>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      Select This Location
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-6">
              <div className="rounded-md border border-purple-200 bg-purple-50/50 dark:border-purple-700 dark:bg-purple-950/50 p-3">
                <p className="text-sm text-purple-900 dark:text-purple-200 font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Use a custom location not in our system. You'll need to provide full address details.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Location Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customVenueName">Venue Name *</Label>
                    <Input
                      id="customVenueName"
                      placeholder="Enter venue name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customAddress">Full Address *</Label>
                    <Input
                      id="customAddress"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" placeholder="New York" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province *</Label>
                      <Input id="state" placeholder="NY" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                      <Input id="zipCode" placeholder="10001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" placeholder="United States" />
                    </div>
                  </div>
                  
                  {/* Map for verification */}
                  <div className="space-y-2">
                    <Label>Verify Location on Map</Label>
                    <div className="border rounded-lg h-[300px] bg-muted/30 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Address will be shown here for verification
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customNotes">Additional Notes</Label>
                    <Textarea
                      id="customNotes"
                      placeholder="Any special instructions or details about this location..."
                      rows={3}
                    />
                  </div>

                  <Button className="w-full" size="lg">
                    Confirm Custom Location
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Event Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> Summer Music Festival 2025</p>
                <p><strong>Type:</strong> Festival</p>
                <p><strong>Date:</strong> July 15, 2025 - July 17, 2025</p>
                <p><strong>Expected Attendees:</strong> 500</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Venue</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> Downtown Event Space</p>
                <p><strong>Address:</strong> 123 Main St, New York, NY</p>
                <p><strong>Type:</strong> Business Venue</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Venue Booking Fee</span>
              <span className="font-medium">$5,000.00</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="font-medium">$150.00</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge</span>
              <span className="font-medium">$100.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">$5,250.00</span>
            </div>
          </div>

          <div className="rounded-md border border-green-200 bg-green-50/50 dark:border-green-700 dark:bg-green-950/50 p-3 mt-4">
            <p className="text-sm text-green-900 dark:text-green-200">
              A refundable deposit of $1,000 will be held until 7 days after your event concludes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input id="cardNumber" placeholder="4242 4242 4242 4242" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expiry">Expiration Date</Label>
              <Input id="expiry" placeholder="MM/YY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="123" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input id="cardName" placeholder="John Doe" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground mt-2">
          Complete all steps to submit your event for approval
        </p>
      </div>

      {renderStepIndicator()}

      <div className="min-h-[600px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {currentStep < 3 ? (
          <Button onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1))}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button size="lg" className="px-8">
            <Check className="mr-2 h-4 w-4" />
            Submit Event Request
          </Button>
        )}
      </div>
    </div>
  );
}

