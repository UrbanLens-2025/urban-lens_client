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
  ClipboardList,
  PlusCircle,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { EventRequest, EventRequestStatus } from "@/types";
import { useDebounce } from "use-debounce";
import { useEventRequests } from "@/hooks/events/useEventRequests";
import Link from "next/link";

const getStatusBadge = (status: EventRequestStatus) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case "UNDER_REVIEW":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        >
          <ClipboardList className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function EventRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const { data: response, isLoading } = useEventRequests({
    page,
    search: debouncedSearchTerm,
    sortBy: "createdAt:DESC",
  });

  const requests = response?.data || [];
  const meta = response?.meta;

  const stats = [
    {
      label: "Total Requests",
      value: meta?.totalItems ?? 0,
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      label: "Pending",
      value: 0, // <-- Dữ liệu giả (API không cung cấp)
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Approved",
      value: 0, // <-- Dữ liệu giả (API không cung cấp)
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Rejected",
      value: 0, // <-- Dữ liệu giả (API không cung cấp)
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage your event venue and approval requests
          </p>
        </div>
        <Button
          onClick={() =>
            (window.location.href = "/dashboard/creator/request/create")
          }
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Quick Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Requests</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !response ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground/50" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Requested Location</TableHead>
                  <TableHead>Location Owner</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: EventRequest) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      {request.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.eventName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          N/A (API Missing)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      N/A (API Missing)
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      N/A (API Missing)
                    </TableCell>
                    <TableCell className="text-sm">
                      {request.expectedNumberOfParticipants}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <Link href={`/dashboard/creator/request/${request.id}`}>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </Link>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {requests.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={!meta || meta.currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={!meta || meta.currentPage >= meta.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
