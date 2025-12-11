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
import { PageHeader } from "@/components/shared/PageHeader";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";

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
    <PageContainer>
      {/* Professional Header */}
      <PageHeader
        title="Creator Dashboard"
        description="Overview of your events, attendees, and revenue"
        icon={CalendarDays}
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/creator/events')}
              className="h-11 border-2 border-primary/20 hover:border-primary/40"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Events
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/creator/request/create')}
              className="h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </>
        }
      />

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          icon={CalendarDays}
          iconColor="text-blue-600"
          iconBg="bg-blue-500/10"
          description={`${stats.activeEvents} active`}
          trend={
            stats.eventsChange !== 0
              ? {
                  value: stats.eventsChange,
                  isPositive: stats.eventsChange > 0,
                }
              : undefined
          }
          onClick={() => router.push('/dashboard/creator/events')}
        />

        <StatCard
          title="Total Attendees"
          value={stats.totalAttendees.toLocaleString()}
          icon={Users}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-500/10"
          description="Across all events"
          onClick={() => router.push('/dashboard/creator/events')}
        />

        <StatCard
          title="Active Events"
          value={stats.activeEvents}
          icon={MapPin}
          iconColor="text-purple-600"
          iconBg="bg-purple-500/10"
          description={`${stats.draftEvents} drafts`}
          footer={
            stats.completedEvents > 0 && (
              <Badge variant="outline" className="text-xs">
                {stats.completedEvents} completed
              </Badge>
            )
          }
          onClick={() => router.push('/dashboard/creator/events')}
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
          onClick={() => router.push('/dashboard/creator/wallet')}
        />
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Draft Events"
          value={stats.draftEvents}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-500/10"
          description="Needs publishing"
          onClick={() => router.push('/dashboard/creator/events')}
        />

        <StatCard
          title="Completed Events"
          value={stats.completedEvents}
          icon={CheckCircle2}
          iconColor="text-green-600"
          iconBg="bg-green-500/10"
          description="Past events"
          onClick={() => router.push('/dashboard/creator/events')}
        />

        <StatCard
          title="This Month Revenue"
          value={formatCurrency(stats.thisMonthRevenue)}
          icon={Wallet}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-500/10"
          description="View wallet"
          onClick={() => router.push('/dashboard/creator/wallet')}
        />

        <StatCard
          title="Upcoming Events"
          value={upcomingEvents.length}
          icon={Ticket}
          iconColor="text-blue-600"
          iconBg="bg-blue-500/10"
          description="Scheduled events"
          onClick={() => router.push('/dashboard/creator/events')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
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

        <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  Event Trends
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
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

    </PageContainer>
  );
}
