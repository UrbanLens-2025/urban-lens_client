/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, PlusCircle, Star, Eye, Building2, MapPin, Users, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import { useOwnerLocationBookings } from "@/hooks/locations/useOwnerLocationBookings";
import { LocationStatus } from "@/types";
import { format } from "date-fns";

function StatCard({ title, value, change, icon: Icon, isLoading }: any) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{value}</div>
            {change && <p className="text-xs font-medium text-muted-foreground">{change}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  const statusUpper = status?.toUpperCase();
  if (statusUpper === "APPROVED" || statusUpper === "ACTIVE") {
    return <Badge className="font-medium bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">APPROVED</Badge>;
  }
  if (statusUpper === "PENDING") {
    return <Badge variant="secondary" className="font-medium">PENDING</Badge>;
  }
  if (statusUpper === "REJECTED") {
    return <Badge variant="destructive" className="font-medium">REJECTED</Badge>;
  }
  return <Badge variant="secondary" className="font-medium">{status || "N/A"}</Badge>;
}

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
      <div className="flex justify-end">
        <Link href="/dashboard/business/locations/create" className="shrink-0">
          <Button className="shadow-md hover:shadow-lg transition-all">
            <PlusCircle className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add New Location</span><span className="sm:hidden">Add Location</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Locations"
          value={stats.totalLocations.toLocaleString()}
          change={`${stats.approvedLocations} approved`}
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Check-ins"
          value={stats.totalCheckIns.toLocaleString()}
          change="All locations"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          change={`${stats.recentBookings} in last 30 days`}
          icon={Calendar}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue > 0 ? `₫${(stats.totalRevenue / 1000).toFixed(0)}K` : "₫0"}
          change="From completed bookings"
          icon={Eye}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 shadow-lg border-2">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                My Locations
              </CardTitle>
              <Link href={"/dashboard/business/locations"}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingLocations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentLocations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No locations yet</p>
                <Link href="/dashboard/business/locations/create">
                  <Button variant="outline" size="sm" className="mt-4">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Location
                  </Button>
                </Link>
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
                          <Badge className="font-medium bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">ACTIVE</Badge>
                        ) : (
                          <Badge variant="secondary" className="font-medium">HIDDEN</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{parseInt(location.totalCheckIns || "0").toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {location.addressLine ? `${location.addressLine}, ${location.addressLevel2}` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg border-2">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Bookings
              </CardTitle>
              <Link href={"/dashboard/business/location-bookings"}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {isLoadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentBookingsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              recentBookingsList.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/business/location-bookings/${booking.id}`}
                  className="block"
                >
                  <div className="flex flex-col p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{booking.location?.name || "Location"}</p>
                      {getStatusBadge(booking.status || "")}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {format(new Date(booking.createdAt), "MMM dd, yyyy")}
                    </p>
                    <p className="text-sm font-medium">
                      ₫{parseFloat(booking.amountToPay || "0").toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
