"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Activity,
  Wallet,
  Ticket,
  MapPin,
  Eye,
  BarChart3,
} from "lucide-react";
import { useMyEvents } from "@/hooks/events/useMyEvents";
import { format, subDays, subMonths, isSameMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";

export default function CreatorDashboardPage() {
  const router = useRouter();

  // Fetch events data
  const { data: eventsData, isLoading } = useMyEvents({
    page: 1,
    limit: 100, // Get more events for better statistics
    sortBy: "createdAt:DESC",
  });

  const events = eventsData?.data || [];
  const meta = eventsData?.meta;

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate statistics with mock data where APIs don't exist
  const stats = useMemo(() => {
    const totalEvents = meta?.totalItems ?? 0;
    
    const activeEvents = events.filter((e) => {
      return e.status?.toUpperCase() === "PUBLISHED" || e.status?.toUpperCase() === "ACTIVE";
    });

    const draftEvents = events.filter((e) => {
      return e.status?.toUpperCase() === "DRAFT";
    });

    const completedEvents = events.filter((e) => {
      return e.status?.toUpperCase() === "COMPLETED";
    });

    // Mock data for attendees (estimate based on events)
    // In real app, this would come from attendance API
    const totalAttendees = events.reduce((sum, event) => {
      // Mock: estimate attendees based on event status and age
      const baseAttendees = event.status?.toUpperCase() === "COMPLETED" ? 50 : 25;
      const randomFactor = Math.floor(Math.random() * 30) + 1;
      return sum + baseAttendees + randomFactor;
    }, 0);

    // Mock revenue data (in real app, get from wallet/transactions API)
    const now = new Date();
    const thisMonthEvents = events.filter((e) => {
      const eventDate = new Date(e.createdAt);
      return isSameMonth(eventDate, now);
    });

    const lastMonthEvents = events.filter((e) => {
      const eventDate = new Date(e.createdAt);
      return isSameMonth(eventDate, subMonths(now, 1));
    });

    // Mock revenue calculation
    const totalRevenue = events.reduce((sum, event) => {
      if (event.status?.toUpperCase() === "COMPLETED") {
        // Mock: completed events generate revenue
        return sum + (Math.floor(Math.random() * 5000000) + 1000000);
      }
      return sum;
    }, 0);

    const thisMonthRevenue = thisMonthEvents.reduce((sum, event) => {
      if (event.status?.toUpperCase() === "COMPLETED") {
        return sum + (Math.floor(Math.random() * 3000000) + 500000);
      }
      return sum;
    }, 0);

    const lastMonthRevenue = lastMonthEvents.reduce((sum, event) => {
      if (event.status?.toUpperCase() === "COMPLETED") {
        return sum + (Math.floor(Math.random() * 3000000) + 500000);
      }
      return sum;
    }, 0);

    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : thisMonthRevenue > 0 ? 100 : 0;

    // Calculate recent events (last 30 days)
    const thirtyDaysAgo = subDays(now, 30);
    const recentEvents = events.filter((e) => {
      const eventDate = new Date(e.createdAt);
      return eventDate >= thirtyDaysAgo;
    }).length;

    const previousPeriodEvents = events.filter((e) => {
      const eventDate = new Date(e.createdAt);
      const previousThirtyDaysAgo = subDays(now, 60);
      return eventDate >= previousThirtyDaysAgo && eventDate < thirtyDaysAgo;
    }).length;

    const eventsChange = previousPeriodEvents > 0 
      ? ((recentEvents - previousPeriodEvents) / previousPeriodEvents) * 100 
      : recentEvents > 0 ? 100 : 0;

    return {
      totalEvents,
      totalAttendees,
      activeEvents: activeEvents.length,
      draftEvents: draftEvents.length,
      completedEvents: completedEvents.length,
      totalRevenue,
      thisMonthRevenue,
      revenueChange,
      recentEvents,
      eventsChange,
    };
  }, [events, meta]);

  // Get upcoming events (events with future dates)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        // Check if event has future dates
        if (e.startDate) {
          const startDate = new Date(e.startDate);
          return startDate >= now;
        }
        // If no startDate, consider published/active events as upcoming
        return e.status?.toUpperCase() === "PUBLISHED" || e.status?.toUpperCase() === "ACTIVE";
      })
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.startDate ? new Date(b.startDate).getTime() : new Date(b.createdAt).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [events]);

  // Get recent activity
  const recentActivity = useMemo(() => {
    return events
      .slice(0, 5)
      .map((e) => ({
        type: "event",
        title: e.displayName,
        description: e.description,
        date: e.updatedAt || e.createdAt,
        status: e.status,
        id: e.id,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events]);

  // Event status breakdown for chart
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      const status = (e.status || "UNKNOWN").toUpperCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));
  }, [events]);

  // Mock event trends data (last 6 months)
  const eventTrends = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthEvents = events.filter((e) => {
        const eventDate = new Date(e.createdAt);
        return isSameMonth(eventDate, monthDate);
      });
      months.push({
        month: format(monthDate, "MMM"),
        events: monthEvents.length,
        revenue: monthEvents.reduce((sum) => sum + Math.floor(Math.random() * 2000000) + 500000, 0),
      });
    }
    return months;
  }, [events]);

  const statusChartConfig: ChartConfig = {
    count: {
      label: "Events",
      color: "hsl(var(--primary))",
    },
  };

  const trendsChartConfig: ChartConfig = {
    events: {
      label: "Events",
      color: "hsl(var(--primary))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your events, attendees, and revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/creator/events')}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Events
          </Button>
          <Button onClick={() => router.push('/dashboard/creator/request/create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalEvents}</div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                {stats.activeEvents} active
              </p>
              {stats.eventsChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs ${
                  stats.eventsChange > 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {stats.eventsChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(stats.eventsChange).toFixed(1)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attendees
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {stats.totalAttendees.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all events
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Events
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.activeEvents}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                {stats.draftEvents} drafts
              </p>
              {stats.completedEvents > 0 && (
                <Badge variant="outline" className="text-xs">
                  {stats.completedEvents} completed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.thisMonthRevenue)} this month
              </p>
              {stats.revenueChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs ${
                  stats.revenueChange > 0 ? "text-emerald-600" : "text-red-600"
                }`}>
                  {stats.revenueChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(stats.revenueChange).toFixed(1)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/dashboard/creator/events')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft Events</p>
                <p className="text-2xl font-bold mt-1">{stats.draftEvents}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Needs publishing
              <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/dashboard/creator/events')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Events</p>
                <p className="text-2xl font-bold mt-1">{stats.completedEvents}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Past events
              <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/dashboard/creator/wallet')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.thisMonthRevenue)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              View wallet
              <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/dashboard/creator/events')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold mt-1">{upcomingEvents.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              Scheduled events
              <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Events by Status
                </CardTitle>
                <CardDescription className="mt-1">
                  Distribution of event statuses
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/creator/events')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : statusBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No events yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create your first event to see analytics
                  </p>
                </div>
              ) : (
                <ChartContainer config={statusChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusBreakdown}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="status"
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
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Event Trends
                </CardTitle>
                <CardDescription className="mt-1">
                  Events and revenue over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : eventTrends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No trend data yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trends will appear as you create more events
                  </p>
                </div>
              ) : (
                <ChartContainer config={trendsChartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eventTrends}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        yAxisId="left"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        yAxisId="right"
                        orientation="right"
                      />
                      <RechartsTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="events"
                        stroke="var(--color-events)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/creator/events')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  No recent activity
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your event activity will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/dashboard/creator/events/${activity.id}`}
                    className="block"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            {activity.title}
                          </p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {activity.status}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {activity.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.date), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                Upcoming Events
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/creator/events')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  No upcoming events
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Create your first event to get started
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/creator/request/create')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const eventDate = event.startDate ? new Date(event.startDate) : new Date(event.createdAt);
                  const isUpcoming = eventDate >= new Date();
                  
                  return (
                    <Link
                      key={event.id}
                      href={`/dashboard/creator/events/${event.id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Ticket className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">
                              {event.displayName}
                            </p>
                            {isUpcoming && (
                              <Badge variant="default" className="text-xs shrink-0 bg-emerald-500">
                                Upcoming
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(eventDate, "MMM dd, yyyy")}
                            </span>
                            {event.status && (
                              <Badge variant="outline" className="text-xs">
                                {event.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
