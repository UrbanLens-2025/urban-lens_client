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
  Wallet,
  Calendar,
  Users,
  Tag,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { EventRequest, EventRequestStatus } from "@/types";
import { useDebounce } from "use-debounce";
import { useEventRequests } from "@/hooks/events/useEventRequests";
import Link from "next/link";

const getStatusBadge = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
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
    case "CONFIRMED":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    case "PROCESSED":
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700"
        >
          <Wallet className="h-3 w-3 mr-1" />
          Payment Required
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

  // Calculate stats from actual data
  const stats = [
    {
      label: "Total Requests",
      value: meta?.totalItems ?? 0,
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      label: "Payment Required",
      value: requests.filter((r) => r.status?.toUpperCase() === "PROCESSED").length,
      icon: Wallet,
      color: "text-amber-600",
    },
    {
      label: "Confirmed",
      value: requests.filter((r) => r.status?.toUpperCase() === "CONFIRMED").length,
      icon: CheckCircle,
      color: "text-emerald-600",
    },
    {
      label: "Pending",
      value: requests.filter((r) => r.status?.toUpperCase() === "PENDING").length,
      icon: Clock,
      color: "text-yellow-600",
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
                  <TableHead>Event Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request: EventRequest) => (
                  <TableRow key={request.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.eventName}</span>
                        <span className="text-xs text-muted-foreground font-mono mt-1">
                          {request.id.substring(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.eventDescription || "No description"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {request.expectedNumberOfParticipants}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(request as any).tags && (request as any).tags.length > 0 ? (
                          <>
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {(request as any).tags.length} tag{(request as any).tags.length !== 1 ? "s" : ""}
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
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/creator/request/${request.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {requests.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <ClipboardList className="mx-auto h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No event requests found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {debouncedSearchTerm
                  ? "Try adjusting your search terms"
                  : "Create your first event request to get started"}
              </p>
              {!debouncedSearchTerm && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    (window.location.href = "/dashboard/creator/request/create")
                  }
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event Request
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing {((meta.currentPage - 1) * meta.itemsPerPage) + 1} to{" "}
            {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of{" "}
            {meta.totalItems} requests
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!meta || meta.currentPage <= 1}
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
              disabled={!meta || meta.currentPage >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
