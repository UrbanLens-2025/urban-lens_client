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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarDays, 
  PlusCircle, 
  Search, 
  TrendingUp,
  MapPin,
  Tag as TagIcon,
  Loader2,
  CheckCircle2,
  FileText,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useMyEvents } from "@/hooks/events/useMyEvents";
import Link from "next/link";
import type { Event } from "@/types";

// Event data will come from API

const getStatusLabel = (status: string) => {
  return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || status;
};

const getStatusIcon = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case "PUBLISHED":
    case "ACTIVE":
      return <CheckCircle2 className="h-3 w-3" />;
    case "DRAFT":
      return <FileText className="h-3 w-3" />;
    case "COMPLETED":
      return <CheckCircle2 className="h-3 w-3" />;
    case "CANCELLED":
      return <XCircle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

const getStatusBadgeStyle = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case "PUBLISHED":
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default:
      return "";
  }
};

export default function CreatorEventsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const { data: eventsData, isLoading, refetch } = useMyEvents({
    page,
    limit: 10,
    search: debouncedSearchTerm,
    sortBy: "createdAt:DESC",
  });

  const allEvents = eventsData?.data || [];
  const meta = eventsData?.meta;

  // Filter events by status if status filter is set
  const events = statusFilter === "all" 
    ? allEvents 
    : allEvents.filter((event) => event.status?.toUpperCase() === statusFilter.toUpperCase());

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
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            {/* Search and Filter Section */}
            <div className="px-6 py-4 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by event name, location, date, or tags..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-2">
                  {/* Status Filter */}
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Refresh Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      refetch();
                      setPage(1);
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto">
              {isLoading && !eventsData ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground/50" />
                </div>
              ) : (
                <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="w-12 font-semibold pl-6">#</TableHead>
                  <TableHead className="font-semibold">Event Name</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Tags</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 pl-6 pr-6">
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
                  events.map((event: Event, index: number) => {
                    const rowNumber = ((meta?.currentPage || 1) - 1) * (meta?.itemsPerPage || 10) + index + 1;
                    const visibleTags = event.tags?.slice(0, 2) || [];
                    const remainingTagsCount = (event.tags?.length || 0) - visibleTags.length;
                    
                    return (
                      <TableRow key={event.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4 pl-6">
                          <span className="text-sm font-medium text-muted-foreground">
                            {rowNumber}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <Link href={`/dashboard/creator/events/${event.id}`} className="hover:underline">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-foreground hover:text-primary transition-colors">{event.displayName}</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {event.id.substring(0, 8)}...
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex flex-col min-w-0 gap-0.5">
                              <span className="text-sm font-medium truncate">
                                {event.location?.name || "N/A"}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {event.location?.addressLine || ""}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {event.tags && event.tags.length > 0 ? (
                              <>
                                {visibleTags.map((tag, tagIndex) => (
                                  <Badge
                                    key={tag.id || tagIndex}
                                    variant="secondary"
                                    className="text-xs border-0 font-medium"
                                    style={{ 
                                      backgroundColor: tag.color || 'hsl(var(--muted))', 
                                      color: '#fff' 
                                    }}
                                  >
                                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                    {tag.displayName}
                                  </Badge>
                                ))}
                                {remainingTagsCount > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1.5 py-0.5 font-medium"
                                  >
                                    +{remainingTagsCount}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">No tags</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {formatDate(event.createdAt)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(event.createdAt).split(',')[1]?.trim()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 pr-6">
                          <Badge 
                            variant="outline"
                            className={`${getStatusBadgeStyle(event.status)} flex items-center gap-1.5 w-fit font-medium`}
                          >
                            {getStatusIcon(event.status)}
                            {getStatusLabel(event.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
              )}
            </div>

            {/* Table Bottom Border and Pagination */}
            <div className="border-t">
              {meta && meta.totalPages > 1 && (
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
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
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
