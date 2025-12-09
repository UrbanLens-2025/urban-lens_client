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
import { 
  PlusCircle, 
  Building2, 
  Users, 
  Calendar, 
  DollarSign, 
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
  Activity,
  Wallet,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import { useOwnerLocationBookings } from "@/hooks/locations/useOwnerLocationBookings";
import { format, subDays, subMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import {
  DashboardSection,
  StatusBadge,
} from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

export default function BusinessDashboardPage() {
  const router = useRouter();
  
  // Fetch locations - increase limit to get all for accurate stats
  const { data: locationsData, isLoading: isLoadingLocations } = useMyLocations(1, "", {
    limit: 100, // Increased to get all locations for accurate statistics
    sortBy: "createdAt:DESC",
  });

  // Fetch bookings for statistics - increase limit for better accuracy
  const { data: bookingsData, isLoading: isLoadingBookings } = useOwnerLocationBookings({
    page: 1,
    limit: 500, // Increased to get more bookings for accurate revenue/trend calculations
    sortBy: "createdAt:DESC",
  });

  const locations = locationsData?.data || [];
  const locationsMeta = locationsData?.meta;
  const bookings = bookingsData?.data || [];
  const bookingsMeta = bookingsData?.meta;

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate statistics from real data
  const stats = useMemo(() => {
    const totalLocations = locationsMeta?.totalItems || 0;
    const totalCheckIns = locations.reduce((sum, loc) => sum + parseInt(loc.totalCheckIns || "0"), 0);
    const totalBookings = bookingsMeta?.totalItems || 0;
    
    const approvedLocations = locations.filter((loc) => {
      return loc.isVisibleOnMap;
    }).length;
    
    // If we have pagination info and fetched all locations, use accurate count
    // Otherwise, estimate based on fetched data
    // Handle edge cases to prevent NaN
    let visibleLocationsCount: number;
    if (locations.length === 0 || totalLocations === 0) {
      visibleLocationsCount = 0;
    } else if (locationsMeta && locationsMeta.totalItems <= locations.length) {
      // We've fetched all locations, use exact count
      visibleLocationsCount = approvedLocations;
    } else {
      // Estimate based on ratio
      const ratio = approvedLocations / locations.length;
      visibleLocationsCount = Math.round(ratio * totalLocations);
    }
    
    // Ensure we never return NaN
    visibleLocationsCount = isNaN(visibleLocationsCount) ? 0 : visibleLocationsCount;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const previousThirtyDaysAgo = subDays(now, 60);
    
    const recentBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= thirtyDaysAgo;
    }).length;

    const previousPeriodBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= previousThirtyDaysAgo && bookingDate < thirtyDaysAgo;
    }).length;

    const bookingsChange = previousPeriodBookings > 0 
      ? ((recentBookings - previousPeriodBookings) / previousPeriodBookings) * 100 
      : recentBookings > 0 ? 100 : 0;

    const thisMonthBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return isSameMonth(bookingDate, now);
    });

    const lastMonthBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return isSameMonth(bookingDate, subMonths(now, 1));
    });

    const totalRevenue = bookings
      .filter((b) => b.status?.toUpperCase() === "PAYMENT_RECEIVED")
      .reduce((sum, b) => sum + parseFloat(b.amountToPay || "0"), 0);

    const thisMonthRevenue = thisMonthBookings
      .filter((b) => b.status?.toUpperCase() === "PAYMENT_RECEIVED")
      .reduce((sum, b) => sum + parseFloat(b.amountToPay || "0"), 0);

    const lastMonthRevenue = lastMonthBookings
      .filter((b) => b.status?.toUpperCase() === "PAYMENT_RECEIVED")
      .reduce((sum, b) => sum + parseFloat(b.amountToPay || "0"), 0);

    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : thisMonthRevenue > 0 ? 100 : 0;

    const pendingBookings = bookings.filter(
      (b) => b.status?.toUpperCase() === "AWAITING_BUSINESS_PROCESSING"
    ).length;

    const activeBookings = bookings.filter((booking) => {
      if (booking.status?.toUpperCase() === "CANCELLED") return false;
      const hasFutureDate = booking.dates?.some((dateSlot: any) => {
        const endDate = new Date(dateSlot.endDateTime);
        return endDate >= now;
      });
      return hasFutureDate;
    }).length;

    return {
      totalLocations,
      totalCheckIns,
      totalBookings,
      approvedLocations: visibleLocationsCount,
      recentBookings,
      bookingsChange,
      totalRevenue,
      thisMonthRevenue,
      revenueChange,
      pendingBookings,
      activeBookings,
      // Add warning flags if data might be incomplete
      hasMoreBookings: bookingsMeta && bookingsMeta.totalItems > bookings.length,
      hasMoreLocations: locationsMeta && locationsMeta.totalItems > locations.length,
    };
  }, [locations, locationsMeta, bookings, bookingsMeta]);

  // Get recent locations for the table
  const recentLocations = locations.slice(0, 5);

  // Get recent bookings
  const recentBookingsList = bookings.slice(0, 3);

  const isLoading = isLoadingLocations || isLoadingBookings;

  const topLocationsForChart = useMemo(() => {
    return locations
      .map((loc) => ({
        name: loc.name || "Location",
        checkIns: parseInt(loc.totalCheckIns || "0"),
      }))
      .sort((a, b) => b.checkIns - a.checkIns)
      .slice(0, 5);
  }, [locations]);

  const locationChartConfig: ChartConfig = {
    checkIns: {
      label: "Check-ins",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <PageContainer>
      {/* Professional Header */}
      <PageHeader
        title="Business Dashboard"
        description="Overview of your locations, bookings, and revenue"
        icon={Building2}
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/business/location-bookings')}
              className="h-11 border-2 border-primary/20 hover:border-primary/40"
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Bookings
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/business/locations/create')}
              className="h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </>
        }
      />

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Locations"
          value={stats.totalLocations}
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-500/10"
          description={`${stats.approvedLocations} visible on map`}
          footer={
            stats.approvedLocations < stats.totalLocations && (
              <Badge variant="outline" className="text-xs">
                {stats.totalLocations - stats.approvedLocations} hidden
              </Badge>
            )
          }
          onClick={() => router.push('/dashboard/business/locations')}
        />

        <StatCard
          title="Total Check-ins"
          value={stats.totalCheckIns.toLocaleString()}
          icon={Users}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-500/10"
          description="Across all locations"
          onClick={() => router.push('/dashboard/business/locations')}
        />

        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          icon={Calendar}
          iconColor="text-purple-600"
          iconBg="bg-purple-500/10"
          description={`${stats.recentBookings} in last 30 days`}
          trend={
            stats.bookingsChange !== 0
              ? {
                  value: stats.bookingsChange,
                  isPositive: stats.bookingsChange > 0,
                }
              : undefined
          }
          onClick={() => router.push('/dashboard/business/location-bookings')}
        />

        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          iconColor="text-amber-600"
          iconBg="bg-amber-500/10"
          description={`${formatCurrency(stats.thisMonthRevenue)} this month`}
          trend={
            stats.revenueChange !== 0
              ? {
                  value: stats.revenueChange,
                  isPositive: stats.revenueChange > 0,
                }
              : undefined
          }
          onClick={() => router.push('/dashboard/business/wallet')}
        />
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-500/10"
          description="Requires your action"
          onClick={() => router.push('/dashboard/business/location-bookings')}
        />

        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-500/10"
          description="Upcoming events"
          onClick={() => router.push('/dashboard/business/location-bookings')}
        />

        <StatCard
          title="Visible Locations"
          value={stats.approvedLocations}
          icon={MapPin}
          iconColor="text-blue-600"
          iconBg="bg-blue-500/10"
          description="On the map"
          onClick={() => router.push('/dashboard/business/locations')}
        />

        <StatCard
          title="This Month Revenue"
          value={formatCurrency(stats.thisMonthRevenue)}
          icon={Wallet}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-500/10"
          description="View wallet"
          onClick={() => router.push('/dashboard/business/wallet')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Top Locations by Check-ins
                </CardTitle>
                <CardDescription className="mt-1">
                  Most popular locations this month
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/business/locations')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {isLoadingLocations ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : topLocationsForChart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No check-ins data yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check-ins will appear here once customers visit your locations
                  </p>
                </div>
              ) : (
                <ChartContainer config={locationChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topLocationsForChart}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip
                        cursor={{
                          fill: "hsl(var(--muted))",
                          opacity: 0.4,
                        }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="checkIns"
                        fill="var(--color-checkIns)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  Revenue Overview
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Monthly revenue from bookings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">This Month</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(stats.thisMonthRevenue)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
              {stats.revenueChange !== 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  stats.revenueChange > 0 
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" 
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                }`}>
                  {stats.revenueChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      stats.revenueChange > 0 ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {stats.revenueChange > 0 ? "+" : ""}{stats.revenueChange.toFixed(1)}% from last month
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Revenue {stats.revenueChange > 0 ? "increased" : "decreased"}
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard/business/wallet')}
              >
                <Wallet className="mr-2 h-4 w-4" />
                View Wallet Details
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
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
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/business/locations/${location.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {location.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {location.isVisibleOnMap ? (
                          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-medium">
                            <Eye className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {parseInt(location.totalCheckIns || "0").toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 max-w-[200px]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {location.addressLine
                              ? `${location.addressLine}, ${location.addressLevel2}`
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
            <div className="space-y-3">
              {recentBookingsList.map((booking) => {
                const bookingDate = booking.dates?.[0]?.startDateTime 
                  ? new Date(booking.dates[0].startDateTime)
                  : new Date(booking.createdAt);
                const isUpcoming = bookingDate >= new Date();
                
                return (
                  <Link
                    key={booking.id}
                    href={`/dashboard/business/location-bookings/${booking.id}`}
                    className="block"
                  >
                    <div className="flex flex-col p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all shadow-sm cursor-pointer hover:shadow-md">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {booking.location?.name || "Location"}
                          </p>
                          {booking.referencedEventRequest?.eventName && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {booking.referencedEventRequest.eventName}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={booking.status || ""} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(bookingDate, "MMM dd, yyyy")}
                        </span>
                        {isUpcoming && (
                          <Badge variant="outline" className="text-xs">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(parseFloat(booking.amountToPay || "0"))}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </DashboardSection>
      </div>
    </PageContainer>
  );
}
