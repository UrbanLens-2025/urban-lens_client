/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useLocationRequests,
  useMyLocations,
} from "@/hooks/locations/useMyLocations";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Location, LocationRequest, LocationStatus, SortState } from "@/types";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { useCancelLocationRequest } from "@/hooks/locations/useCancelLocationRequest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DisplayTags } from "@/components/shared/DisplayTags";

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
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const { mutate: cancelRequest, isPending } = useCancelLocationRequest();

  const onCancelConfirm = () => {
    cancelRequest(requestId, {
      onSuccess: () => setIsCancelAlertOpen(false),
    });
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/business/locations/request/${requestId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          {(status === "AWAITING_ADMIN_REVIEW" ||
            status === "NEEDS_MORE_INFO") && (
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/business/locations/request/${requestId}/edit`}
              >
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
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => setIsCancelAlertOpen(true)}
              disabled={isPending}
            >
              <BadgeX className="mr-2 h-4 w-4" />
              Cancel Request
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to cancel this request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your request status will be changed
              to &apos;CANCELLED_BY_BUSINESS&apos;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCancelConfirm}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function MyLocationsPage() {
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(activeSearchTerm, 300);

  const [sort, setSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });

  const sortByString = `${sort.column}:${sort.direction}`;

  const { data: activeLocationsResponse, isLoading: isLoadingActive } =
    useMyLocations(activePage, debouncedSearchTerm);
  const { data: requestsResponse, isLoading: isLoadingRequests } =
    useLocationRequests(historyPage, sortByString);

  const activeLocations: Location[] = activeLocationsResponse?.data || [];
  const activeMeta = activeLocationsResponse?.meta;
  const locationRequests: LocationRequest[] = requestsResponse?.data || [];
  const historyMeta = requestsResponse?.meta;
  const isLoading = isLoadingActive || isLoadingRequests;

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
            Showing page {activeMeta?.currentPage} of {activeMeta?.totalPages}.
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
                      <DisplayTags tags={location.tags} maxCount={4} />
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
            Showing page {historyMeta?.currentPage} of {historyMeta?.totalPages}
            .
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
