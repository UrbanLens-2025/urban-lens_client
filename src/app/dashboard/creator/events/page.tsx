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
  MapPin,
  Tag as TagIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useMyEvents } from "@/hooks/events/useMyEvents";
import Link from "next/link";
import type { Event } from "@/types";

// Event data will come from API

const getStatusColor = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case "PUBLISHED":
    case "ACTIVE":
      return "default" as const;
    case "DRAFT":
      return "outline" as const;
    case "COMPLETED":
      return "secondary" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const getStatusLabel = (status: string) => {
  return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || status;
};

export default function CreatorEventsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const { data: eventsData, isLoading } = useMyEvents({
    page,
    limit: 10,
    search: debouncedSearchTerm,
    sortBy: "createdAt:DESC",
  });

  const events = eventsData?.data || [];
  const meta = eventsData?.meta;

  // Calculate statistics from actual data
  const stats = {
    totalEvents: meta?.totalItems ?? 0,
    activeEvents: events.filter((e) => e.status?.toUpperCase() === "PUBLISHED" || e.status?.toUpperCase() === "ACTIVE").length,
    draftEvents: events.filter((e) => e.status?.toUpperCase() === "DRAFT").length,
    totalTags: events.reduce((sum, e) => sum + (e.tags?.length || 0), 0),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <Button onClick={() => window.location.href = '/dashboard/creator/request/create'}>
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
            <CardTitle className="text-sm font-medium">Draft Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftEvents}</div>
            <p className="text-xs text-muted-foreground">Not published yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <TagIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTags}</div>
            <p className="text-xs text-muted-foreground">Across all events</p>
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
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !eventsData ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground/50" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <CalendarDays className="h-12 w-12 mb-4" />
                        <p className="font-medium">No events found</p>
                        <p className="text-sm mt-2">
                          {debouncedSearchTerm
                            ? "Try adjusting your search terms"
                            : "Create your first event to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event: Event) => (
                    <TableRow key={event.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{event.displayName}</span>
                          <span className="text-xs text-muted-foreground font-mono mt-1">
                            {event.id.substring(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                              {event.location?.name || "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {event.location?.addressLine || ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {event.tags && event.tags.length > 0 ? (
                            <>
                              <TagIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {event.tags.length} tag{event.tags.length !== 1 ? "s" : ""}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">No tags</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {formatDate(event.createdAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(event.createdAt).split(',')[1]?.trim()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(event.status)}>
                          {getStatusLabel(event.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/creator/events/${event.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((meta.currentPage - 1) * meta.itemsPerPage) + 1} to{" "}
                {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of{" "}
                {meta.totalItems} events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!meta || meta.currentPage <= 1 || isLoading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {meta.currentPage} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!meta || meta.currentPage >= meta.totalPages || isLoading}
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
