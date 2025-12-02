"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Building2, Users, Calendar, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import { useOwnerLocationBookings } from "@/hooks/locations/useOwnerLocationBookings";
import { format } from "date-fns";
import {
  StatsCard,
  DashboardSection,
  DashboardHeader,
  StatusBadge,
} from "@/components/dashboard";

export default function BusinessDashboardPage() {
  const router = useRouter();
  
  // Fetch locations
  const { data: locationsData, isLoading: isLoadingLocations } = useMyLocations(1, "", {
    limit: 10,
    sortBy: "createdAt:DESC",
  });

  // Fetch bookings for statistics
  const { data: bookingsData, isLoading: isLoadingBookings } = useOwnerLocationBookings({
    page: 1,
    limit: 100,
    sortBy: "createdAt:DESC",
  });

  const locations = locationsData?.data || [];
  const locationsMeta = locationsData?.meta;
  const bookings = bookingsData?.data || [];
  const bookingsMeta = bookingsData?.meta;

  // Calculate statistics from real data
  const stats = useMemo(() => {
    const totalLocations = locationsMeta?.totalItems || 0;
    const totalCheckIns = locations.reduce((sum, loc) => sum + parseInt(loc.totalCheckIns || "0"), 0);
    const totalBookings = bookingsMeta?.totalItems || 0;
    
    const approvedLocations = locations.filter((loc) => {
      // Locations don't have a status field directly, but we can check if they're visible
      return loc.isVisibleOnMap;
    }).length;

    const recentBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return bookingDate >= thirtyDaysAgo;
    }).length;

    const totalRevenue = bookings
      .filter((b) => b.status?.toUpperCase() === "PAYMENT_RECEIVED")
      .reduce((sum, b) => sum + parseFloat(b.amountToPay || "0"), 0);

    return {
      totalLocations,
      totalCheckIns,
      totalBookings,
      approvedLocations,
      recentBookings,
      totalRevenue,
    };
  }, [locations, locationsMeta, bookings, bookingsMeta]);

  // Get recent locations for the table
  const recentLocations = locations.slice(0, 5);

  // Get recent bookings
  const recentBookingsList = bookings.slice(0, 3);

  const isLoading = isLoadingLocations || isLoadingBookings;

  return (
    <div className="space-y-8 pb-8 overflow-x-hidden">
      <DashboardHeader
        title="Business Dashboard"
        description="Manage your locations, bookings, and revenue"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Locations"
          value={stats.totalLocations.toLocaleString()}
          change={`${stats.approvedLocations} approved`}
          icon={Building2}
          isLoading={isLoading}
          color="primary"
        />
        <StatsCard
          title="Total Check-ins"
          value={stats.totalCheckIns.toLocaleString()}
          change="All locations"
          icon={Users}
          isLoading={isLoading}
          color="blue"
        />
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          change={`${stats.recentBookings} in last 30 days`}
          icon={Calendar}
          isLoading={isLoading}
          color="purple"
        />
        <StatsCard
          title="Total Revenue"
          value={stats.totalRevenue > 0 ? `₫${(stats.totalRevenue / 1000).toFixed(0)}K` : "₫0"}
          change="From completed bookings"
          icon={Eye}
          isLoading={isLoading}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <DashboardSection
          title="My Locations"
          icon={Building2}
          action={{
            label: "View all",
            href: "/dashboard/business/locations",
          }}
          className="lg:col-span-3"
          isEmpty={!isLoadingLocations && recentLocations.length === 0}
          emptyState={{
            icon: Building2,
            title: "No locations yet",
            description: "Get started by adding your first location",
            action: {
              label: "Add Your First Location",
              href: "/dashboard/business/locations/create",
            },
          }}
        >
          {isLoadingLocations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Check-ins</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLocations.map((location) => (
                  <TableRow
                    key={location.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/business/locations/${location.id}`)}
                  >
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>
                      {location.isVisibleOnMap ? (
                        <StatusBadge status="ACTIVE" />
                      ) : (
                        <Badge variant="secondary" className="font-medium">
                          HIDDEN
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseInt(location.totalCheckIns || "0").toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {location.addressLine
                        ? `${location.addressLine}, ${location.addressLevel2}`
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DashboardSection>

        <DashboardSection
          title="Recent Bookings"
          icon={Calendar}
          action={{
            label: "View all",
            href: "/dashboard/business/location-bookings",
          }}
          className="lg:col-span-2"
          isEmpty={!isLoadingBookings && recentBookingsList.length === 0}
          emptyState={{
            icon: Calendar,
            title: "No bookings yet",
            description: "Bookings will appear here when creators book your locations",
          }}
        >
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookingsList.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/business/location-bookings/${booking.id}`}
                  className="block"
                >
                  <div className="flex flex-col p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">
                        {booking.location?.name || "Location"}
                      </p>
                      <StatusBadge status={booking.status || ""} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(new Date(booking.createdAt), "MMM dd, yyyy")}
                    </p>
                    <p className="text-sm font-medium">
                      ₫{parseFloat(booking.amountToPay || "0").toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}
