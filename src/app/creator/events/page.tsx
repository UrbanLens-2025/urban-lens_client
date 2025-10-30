"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CalendarDays, 
  PlusCircle, 
  Search, 
  Users, 
  DollarSign,
  TrendingUp,
  Eye,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

// Mock data for events
const mockEvents = [
  {
    id: "1",
    name: "Summer Music Festival 2025",
    date: "2025-07-15",
    time: "18:00",
    status: "published",
    location: "Central Park, New York",
    registeredAttendees: 450,
    capacity: 500,
    revenue: 45000,
    ticketsSold: 450,
  },
  {
    id: "2",
    name: "Tech Conference: Future of AI",
    date: "2025-06-20",
    time: "09:00",
    status: "active",
    location: "Convention Center, San Francisco",
    registeredAttendees: 1200,
    capacity: 1500,
    revenue: 120000,
    ticketsSold: 1200,
  },
  {
    id: "3",
    name: "Art Exhibition Opening",
    date: "2025-05-10",
    time: "19:00",
    status: "completed",
    location: "Modern Art Museum, Los Angeles",
    registeredAttendees: 300,
    capacity: 300,
    revenue: 15000,
    ticketsSold: 300,
  },
  {
    id: "4",
    name: "Startup Networking Night",
    date: "2025-08-05",
    time: "18:30",
    status: "draft",
    location: "Innovation Hub, Austin",
    registeredAttendees: 0,
    capacity: 200,
    revenue: 0,
    ticketsSold: 0,
  },
  {
    id: "5",
    name: "Food & Wine Tasting Event",
    date: "2025-09-12",
    time: "17:00",
    status: "published",
    location: "Grand Hotel, Chicago",
    registeredAttendees: 85,
    capacity: 150,
    revenue: 8500,
    ticketsSold: 85,
  },
  {
    id: "6",
    name: "Charity Run for Education",
    date: "2025-04-22",
    time: "07:00",
    status: "completed",
    location: "Riverside Park, Portland",
    registeredAttendees: 500,
    capacity: 500,
    revenue: 25000,
    ticketsSold: 500,
  },
  {
    id: "7",
    name: "Business Leadership Summit",
    date: "2025-10-18",
    time: "08:00",
    status: "published",
    location: "Business Center, Boston",
    registeredAttendees: 320,
    capacity: 400,
    revenue: 96000,
    ticketsSold: 320,
  },
  {
    id: "8",
    name: "Halloween Costume Party",
    date: "2025-10-31",
    time: "20:00",
    status: "draft",
    location: "Downtown Club, Miami",
    registeredAttendees: 0,
    capacity: 250,
    revenue: 0,
    ticketsSold: 0,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "default";
    case "active":
      return "default";
    case "completed":
      return "secondary";
    case "draft":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function CreatorEventsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate statistics
  const stats = {
    totalEvents: mockEvents.length,
    activeEvents: mockEvents.filter(e => e.status === "active" || e.status === "published").length,
    totalAttendees: mockEvents.reduce((sum, e) => sum + e.registeredAttendees, 0),
    totalRevenue: mockEvents.reduce((sum, e) => sum + e.revenue, 0),
  };

  // Filter events based on search
  const filteredEvents = mockEvents.filter(event =>
    event.name.toLowerCase().includes(search.toLowerCase()) ||
    event.location.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your events
          </p>
        </div>
        <Button onClick={() => window.location.href = '/creator/events/create'}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Quick Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered guests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From ticket sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Events</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Tickets Sold</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mb-4" />
                      <p>No events found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDate(event.date)}</span>
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {event.location}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(event.status)}>
                        {getStatusLabel(event.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {event.registeredAttendees}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {event.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{event.ticketsSold}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {formatCurrency(event.revenue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            View Attendees
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredEvents.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedEvents.length} of {filteredEvents.length} events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
