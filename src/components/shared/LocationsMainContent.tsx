"use client";

import { useLocationsSidebar } from "./LocationsSidebarContext";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, FileText, Edit, CalendarDays, DollarSign, Loader2 } from "lucide-react";
import { Location } from "@/types";
import { useLocationById } from "@/hooks/locations/useLocationById";
import Link from "next/link";
import { usePathname } from "next/navigation";

const locationTabs = [
  {
    id: "overview",
    label: "Overview",
    icon: FileText,
    path: (locationId: string) => `/dashboard/business/locations/${locationId}`,
  },
  {
    id: "update",
    label: "Update Location",
    icon: Edit,
    path: (locationId: string) => `/dashboard/business/locations/${locationId}/edit`,
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: CalendarDays,
    path: (locationId: string) => `/dashboard/business/locations/${locationId}/booking-config`,
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: DollarSign,
    path: (locationId: string) => `/dashboard/business/locations/${locationId}`,
  },
];

export function LocationsMainContent() {
  const { selectedLocationId } = useLocationsSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { data: locationsResponse } = useMyLocations(1, "");
  const locations = locationsResponse?.data || [];
  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);

  const { data: locationDetails, isLoading: isLoadingDetails } = useLocationById(
    selectedLocationId || ""
  );

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.includes("/edit")) return "update";
    if (pathname.includes("/booking-config")) return "bookings";
    if (pathname.includes("/availability")) return "bookings";
    return "overview";
  };

  if (!selectedLocationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Choose a location</h2>
        <p className="text-muted-foreground max-w-md">
          Select a location from the list to view its details and manage settings.
        </p>
      </div>
    );
  }

  if (isLoadingDetails) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const location = locationDetails || selectedLocation;

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <h2 className="text-2xl font-semibold mb-2">Location not found</h2>
        <p className="text-muted-foreground">The selected location could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{location.name}</h1>
          {location.description && (
            <p className="text-muted-foreground mt-1">{location.description}</p>
          )}
        </div>
      </div>

      <Tabs value={getActiveTab()} className="w-full">
        <TabsList>
          {locationTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => router.push(tab.path(selectedLocationId!))}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Basic information about this location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {location.addressLine}, {location.addressLevel1}, {location.addressLevel2}
                  </p>
                </div>
                {location.latitude && location.longitude && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coordinates</p>
                    <p className="text-sm">
                      {location.latitude}, {location.longitude}
                    </p>
                  </div>
                )}
                {location.radiusMeters && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Radius</p>
                    <p className="text-sm">{location.radiusMeters} meters</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for this location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/business/locations/${location.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Location
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/business/locations/${location.id}/availability`}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Manage Availability
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/business/locations/${location.id}/booking-config`}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Booking Configuration
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="update" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Location</CardTitle>
              <CardDescription>Modify location details and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/dashboard/business/locations/${location.id}/edit`}>
                  Go to Edit Page
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>Manage booking configuration and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/dashboard/business/locations/${location.id}/booking-config`}>
                  Go to Booking Config
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>View revenue and financial information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Revenue tracking will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

