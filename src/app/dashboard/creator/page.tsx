"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MapPin, TrendingUp } from "lucide-react";
import { useMyEvents } from "@/hooks/events/useMyEvents";
import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

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

    return [
      {
        title: "Total Events",
        value: meta?.totalItems ?? 0,
        icon: CalendarDays,
        description: "Events created",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        title: "Total Attendees",
        value: 0, // TODO: Get from event attendance API
        icon: Users,
        description: "Across all events",
        color: "text-blue-600",
        bgColor: "bg-blue-500/10",
      },
      {
        title: "Active Events",
        value: activeEvents.length,
        icon: MapPin,
        description: "Currently running",
        color: "text-emerald-600",
        bgColor: "bg-emerald-500/10",
      },
      {
        title: "Revenue",
        value: `₫${revenue.toLocaleString()}`,
        icon: TrendingUp,
        description: "Total earnings",
        color: "text-amber-600",
        bgColor: "bg-amber-500/10",
      },
    ];
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your event creator dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Consolidated Activity & Events Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                    <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold mb-1">No recent activity</p>
                <p className="text-xs text-muted-foreground">
                  Your event activity will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
              {upcomingEvents.length > 0 && (
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                  <Link href="/dashboard/creator/events">View all</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/creator/events/${event.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors group"
                  >
                    <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {event.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold mb-1">No upcoming events</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Create your first event to get started
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/creator/request/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Event
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


