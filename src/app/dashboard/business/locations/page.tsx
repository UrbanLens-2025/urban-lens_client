/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocationRequests, useMyLocations } from "@/hooks/useMyLocations";
import { useTags } from "@/hooks/useTags";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  PlusCircle,
  Loader2,
  Copy,
  Edit,
  Eye,
  BadgeX,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Location,
  LocationRequest,
  PaginatedData,
  Tag,
  LocationStatus,
  SortState,
} from "@/types";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";

function ActiveLocationActions({ location }: { location: Location }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/business/locations/${location.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/business/locations/${location.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Live Page
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-red-500">
          <Link href="#">
            <BadgeX className="mr-2 h-4 w-4" />
            Disable
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: LocationStatus;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/locations`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>

        {(status === "AWAITING_ADMIN_REVIEW" ||
          status === "NEEDS_MORE_INFO") && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/locations/${requestId}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Request
            </Link>
          </DropdownMenuItem>
        )}

        {(status === "REJECTED" || status === "CANCELLED_BY_BUSINESS") && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/locations/create?copyFrom=${requestId}`}>
              <Copy className="mr-2 h-4 w-4" /> Copy & Create New
            </Link>
          </DropdownMenuItem>
        )}

        {(status === "AWAITING_ADMIN_REVIEW" ||
          status === "NEEDS_MORE_INFO") && (
          <DropdownMenuItem asChild className="text-red-500">
            <Link href="#">
              <BadgeX className="mr-2 h-4 w-4" />
              Disable
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DisplayTags({
  items,
  tagsMap,
}: {
  items: any[] | undefined;
  tagsMap: Map<number, Tag>;
}) {
  if (!items || items.length === 0)
    return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, 3).map((item) => {
        const tagDetails = item.tag ? item.tag : tagsMap.get(item.tagId);
        if (!tagDetails) return null;
        return (
          <Badge
            key={tagDetails.id}
            variant="secondary"
            className="font-normal"
            style={{ backgroundColor: tagDetails.color, color: "#fff" }}
          >
            {tagDetails.icon} {tagDetails.displayName}
          </Badge>
        );
      })}
    </div>
  );
}

export default function MyLocationsPage() {
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(activeSearchTerm, 50);

  const [sort, setSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });

  const sortByString = `${sort.column}:${sort.direction}`;

  const { data: activeLocationsResponse, isLoading: isLoadingActive } =
    useMyLocations(activePage, debouncedSearchTerm);
  const { data: requestsResponse, isLoading: isLoadingRequests } =
    useLocationRequests(historyPage, sortByString);
  const { data: allTagsResponse } = useTags();

  const activeLocations: Location[] = activeLocationsResponse?.data || [];
  const activeMeta = activeLocationsResponse?.meta;
  const locationRequests: LocationRequest[] = requestsResponse?.data || [];
  const historyMeta = requestsResponse?.meta;
  const isLoading = isLoadingActive || isLoadingRequests;

  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
    allTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTagsResponse]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === "DESC"
          ? "ASC"
          : "DESC",
    }));
    setHistoryPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Locations</h1>
          <p className="text-muted-foreground">
            Manage your active locations and track submissions.
          </p>
        </div>
        <Link href="/dashboard/business/locations/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Submit New Location
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Active Locations ({activeMeta?.totalItems || 0})
          </CardTitle>
          <CardDescription>
            Showing page{" "}
            {activeMeta?.currentPage} of {activeMeta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search by name..."
              value={activeSearchTerm}
              onChange={(e) => setActiveSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeLocations.length > 0 ? (
                activeLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      {location.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {location.description}
                    </TableCell>
                    <TableCell>
                      <DisplayTags items={location.tags} tagsMap={tagsMap} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ActiveLocationActions location={location} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No active locations.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage(activePage - 1)}
              disabled={!activeMeta || activeMeta.currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage(activePage + 1)}
              disabled={
                !activeMeta || activeMeta.currentPage >= activeMeta.totalPages
              }
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Request History ({historyMeta?.totalItems || 0})
          </CardTitle>
          <CardDescription>
            Showing page{" "}
            {historyMeta?.currentPage} of {historyMeta?.totalPages}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("createdAt")}
                  >
                    Submitted At <SortIcon column="createdAt" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locationRequests.length > 0 ? (
                locationRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.description}
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn({
                          "bg-blue-100 text-blue-800":
                            request.status === "AUTO_VALIDATING",
                          "bg-yellow-100 text-yellow-800":
                            request.status === "AWAITING_ADMIN_REVIEW" ||
                            request.status === "NEEDS_MORE_INFO",
                          "bg-green-100 text-green-800":
                            request.status === "APPROVED",
                          "bg-red-100 text-red-800":
                            request.status === "REJECTED",
                          "bg-gray-100 text-gray-800":
                            request.status === "CANCELLED_BY_BUSINESS",
                        })}
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <RequestActions
                        requestId={request.id}
                        status={request.status}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryPage(historyPage - 1)}
              disabled={!historyMeta || historyMeta.currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryPage(historyPage + 1)}
              disabled={
                !historyMeta ||
                historyMeta.currentPage >= historyMeta.totalPages
              }
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
