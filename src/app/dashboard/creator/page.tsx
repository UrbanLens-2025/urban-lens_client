"use client";

import { CalendarDays, Users, MapPin, TrendingUp } from "lucide-react";
import { useMyEvents } from "@/hooks/events/useMyEvents";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  StatsCard,
  DashboardSection,
  DashboardHeader,
  ActivityItem,
} from "@/components/dashboard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

export default function CreatorDashboardPage() {
  // Fetch events data
  const { data: eventsData, isLoading } = useMyEvents({
    page: 1,
    limit: 10,
    sortBy: "createdAt:DESC",
  });

  const events = eventsData?.data || [];
  const meta = eventsData?.meta;

  // Calculate statistics from actual data
  const stats = useMemo(() => {
    const activeEvents = events.filter((e) => {
      return e.status?.toUpperCase() === "PUBLISHED" || e.status?.toUpperCase() === "ACTIVE";
    });

    // Calculate revenue (placeholder - would need actual revenue data from API)
    const revenue = 0; // TODO: Get from wallet/transactions API

    return {
      totalEvents: meta?.totalItems ?? 0,
      totalAttendees: 0, // TODO: Get from event attendance API
      activeEvents: activeEvents.length,
      revenue,
    };
  }, [events, meta]);

  // Get upcoming events (recently created events, sorted by creation date)
  const upcomingEvents = useMemo(() => {
    return events
      .slice(0, 5)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [events]);

  // Get recent activity (recently created or updated events)
  const recentActivity = useMemo(() => {
    return events
      .slice(0, 5)
      .map((e) => ({
        type: "event",
        title: e.displayName,
        description: e.description,
        date: e.createdAt || e.updatedAt,
        status: e.status,
      }));
  }, [events]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      const status = (e.status || "UNKNOWN").toUpperCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [events]);

  const statusChartConfig: ChartConfig = {
    count: {
      label: "Events",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-8 pb-8 overflow-x-hidden">
      <DashboardHeader
        title="Creator Dashboard"
        description="Manage your events, attendees, and revenue"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Events"
          value={stats.totalEvents}
          change="Events created"
          icon={CalendarDays}
          isLoading={isLoading}
          color="primary"
          variant="minimal"
        />
        <StatsCard
          title="Total Attendees"
          value={stats.totalAttendees}
          change="Across all events"
          icon={Users}
          isLoading={isLoading}
          color="blue"
          variant="minimal"
        />
        <StatsCard
          title="Active Events"
          value={stats.activeEvents}
          change="Currently running"
          icon={MapPin}
          isLoading={isLoading}
          color="emerald"
          variant="minimal"
        />
        <StatsCard
          title="Revenue"
          value={`₫${stats.revenue.toLocaleString()}`}
          change="Total earnings"
          icon={TrendingUp}
          isLoading={isLoading}
          color="amber"
          variant="minimal"
        />
      </div>

      {/* Overview Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardSection
          title="Events by status"
          icon={TrendingUp}
          className="lg:col-span-2"
          isEmpty={!isLoading && statusBreakdown.length === 0}
          emptyState={{
            icon: CalendarDays,
            title: "No events yet",
            description: "Create your first event to see status analytics",
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statusBreakdown.length === 0 ? null : (
            <div className="h-64">
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
            </div>
          )}
        </DashboardSection>

        <div className="hidden lg:block" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection
          title="Recent Activity"
          icon={CalendarDays}
          isEmpty={!isLoading && recentActivity.length === 0}
          emptyState={{
            icon: CalendarDays,
            title: "No recent activity",
            description: "Your event activity will appear here",
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <ActivityItem
                  key={index}
                  icon={CalendarDays}
                  title={activity.title}
                  description={activity.description}
                  date={activity.date}
                />
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Upcoming Events"
          icon={CalendarDays}
          action={
            upcomingEvents.length > 0
              ? {
                  label: "View all",
                  href: "/dashboard/creator/events",
                }
              : undefined
          }
          isEmpty={!isLoading && upcomingEvents.length === 0}
          emptyState={{
            icon: CalendarDays,
            title: "No upcoming events",
            description: "Create your first event to get started",
            action: {
              label: "Create Event",
              href: "/dashboard/creator/request/create",
            },
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <ActivityItem
                  key={event.id}
                  icon={CalendarDays}
                  title={event.displayName}
                  description={event.description}
                  date={event.createdAt}
                  href={`/dashboard/creator/events/${event.id}`}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}


