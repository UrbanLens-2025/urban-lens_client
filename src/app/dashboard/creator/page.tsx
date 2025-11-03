"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MapPin, TrendingUp } from "lucide-react";

export default function CreatorDashboardPage() {
  // Placeholder stats - these would come from API in real implementation
  const stats = [
    {
      title: "Total Events",
      value: "0",
      icon: CalendarDays,
      description: "Events created",
    },
    {
      title: "Total Attendees",
      value: "0",
      icon: Users,
      description: "Across all events",
    },
    {
      title: "Active Events",
      value: "0",
      icon: MapPin,
      description: "Currently running",
    },
    {
      title: "Revenue",
      value: "₫0",
      icon: TrendingUp,
      description: "Total earnings",
    },
  ];

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
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your event activity will appear here
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No upcoming events</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first event to get started
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


