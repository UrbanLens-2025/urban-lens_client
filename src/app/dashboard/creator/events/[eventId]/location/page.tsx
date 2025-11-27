"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Search, Plus, Building2, Loader2 } from "lucide-react";
import { useEventTabs } from "@/contexts/EventTabContext";
import { useEventById } from "@/hooks/events/useEventById";

export default function EventLocationPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { data: event, isLoading } = useEventById(eventId);

  const { openBookLocationTab } = useEventTabs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasLocation = !!event?.locationId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {hasLocation && (
          <div className="w-full flex justify-end">
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Browse Other Venues
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Venue Booking
          </CardTitle>
          <CardDescription>
            Current booking status and venue details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasLocation ? (
            <div className="text-center py-16 border rounded-lg bg-muted/10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No Venue Booked Yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Your event needs a location. Browse our available venues to find the perfect spot for your event.
              </p>
              <Button size="lg" onClick={() => {
                openBookLocationTab();
                router.push(`/dashboard/creator/events/${eventId}/location/book`);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Book a Venue
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Location details coming soon.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
