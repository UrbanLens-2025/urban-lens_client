"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, Edit, Loader2, PlusCircle } from "lucide-react";
import { Location, LocationRequest, SortState } from "@/types";
import { useProcessLocationRequest } from "@/hooks/admin/useProcessLocationRequest";
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
import { Textarea } from "@/components/ui/textarea";
import { useLocationAdminRequests } from "@/hooks/admin/useLocationAdminRequests";
import Link from "next/link";
import { useAllLocations } from "@/hooks/admin/useAllLocations";

export default function LocationDashboardPage() {
  const [page, setPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchReqTerm, setSearchReqTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 1000);
  const [debouncedSearchReqTerm] = useDebounce(searchReqTerm, 1000);

  const [sortReq, setSortReq] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });

  const [sort, setSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });

  const sortByString = `${sort.column}:${sort.direction}`;
  const sortReqByString = `${sortReq.column}:${sortReq.direction}`;

  const { data: response, isLoading } = useLocationAdminRequests(
    reqPage,
    debouncedSearchReqTerm,
    sortReqByString
  );

  const requests = response?.data || [];
  const reqMeta = response?.meta;

  const { data: allLocationsResponse, isLoading: isLoadingAll } =
    useAllLocations(page, debouncedSearchTerm, sortByString);

  const allLocations = allLocationsResponse?.data || [];
  const allLocationsMeta = allLocationsResponse?.meta;

  const { mutate: processRequest, isPending } = useProcessLocationRequest();

  const [approvingRequest, setApprovingRequest] =
    useState<LocationRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] =
    useState<LocationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleConfirmApprove = () => {
    if (!approvingRequest) return;

    processRequest(
      { id: approvingRequest.id, payload: { status: "APPROVED" } },
      {
        onSuccess: () => {
          setApprovingRequest(null);
        },
      }
    );
  };

  const handleConfirmReject = () => {
    if (rejectingRequest) {
      processRequest(
        {
          id: rejectingRequest.id,
          payload: { status: "REJECTED", adminNotes: rejectReason },
        },
        {
          onSuccess: () => setRejectingRequest(null),
        }
      );
    }
  };

  const handleSortReq = (columnName: string) => {
    setSortReq((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === "DESC"
          ? "ASC"
          : "DESC",
    }));
    setReqPage(1);
  };

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === "DESC"
          ? "ASC"
          : "DESC",
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const SortReqIcon = ({ column }: { column: string }) => {
    if (sortReq.column !== column) return null;
    return sortReq.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/admin/locations/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Public Location
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Approved Locations ({allLocationsMeta?.totalItems || 0})
          </CardTitle>
          <CardDescription>
            Manage all active locations on the platform. Showing page{" "}
            {allLocationsMeta?.currentPage} of {allLocationsMeta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search all locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAll ? (
            <div className="text-center p-8">
              <Loader2 />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("name")}>
                      Name <SortIcon column="name" />
                    </Button>
                  </TableHead>
                  <TableHead>Business Owner</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created At <SortIcon column="createdAt" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLocations.map((loc: Location) => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell>{loc.business?.name || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(loc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/locations/${loc.id}`}>View</Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/admin/locations/${loc.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {allLocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No locations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!allLocationsMeta || allLocationsMeta.currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={
                !allLocationsMeta ||
                allLocationsMeta.currentPage >= allLocationsMeta.totalPages
              }
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Location Requests ({requests.length})</CardTitle>
          <CardDescription>
            Review and approve new location submissions. Showing page{" "}
            {reqMeta?.currentPage} of {reqMeta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search by name..."
              value={searchReqTerm}
              onChange={(e) => setSearchReqTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !response ? (
            <div className="text-center p-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Location Name <SortReqIcon column="name" />
                  </TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSortReq("createdAt")}
                    >
                      Date <SortReqIcon column="createdAt" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req: LocationRequest) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell>
                      {`${req.createdBy?.firstName} ${req.createdBy?.lastName}` ||
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      {req.createdBy?.businessProfile?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/locations/request/${req.id}`}>
                          View
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => setApprovingRequest(req)}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejectingRequest(req)}
                        disabled={isPending}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No pending requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReqPage(reqPage - 1)}
              disabled={!reqMeta || reqMeta.currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReqPage(reqPage + 1)}
              disabled={!reqMeta || reqMeta.currentPage >= reqMeta.totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!approvingRequest}
        onOpenChange={() => setApprovingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this Location Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the location &quot;
              {approvingRequest?.name}&quot;? This action will make it public.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!rejectingRequest}
        onOpenChange={() => setRejectingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to reject this request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection. This note will be visible
              to the business owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
