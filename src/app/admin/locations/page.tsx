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
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { LocationRequest, SortState } from "@/types";
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
import { ViewRequestModal } from "@/components/admin/ViewRequestModal";
import { useLocationAdminRequests } from "@/hooks/admin/useLocationAdminRequests";

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 50);
  const [viewingRequest, setViewingRequest] = useState<LocationRequest | null>(
    null
  );

  const [sort, setSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });

  const sortByString = `${sort.column}:${sort.direction}`;

  const { data: response, isLoading } = useLocationAdminRequests(
    page,
    debouncedSearchTerm,
    sortByString
  );
  const requests = response?.data || [];
  const meta = response?.meta;

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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Location Requests ({requests.length})</CardTitle>
          <CardDescription>
            Review and approve new location submissions. Showing page{" "}
            {meta?.currentPage} of {meta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    Location Name <SortIcon column="name" />
                  </TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                    >
                      Date <SortIcon column="createdAt" />
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingRequest(req)}
                      >
                        View
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

      {viewingRequest && (
        <ViewRequestModal
          requestId={viewingRequest.id}
          open={!!viewingRequest}
          onOpenChange={() => setViewingRequest(null)}
        />
      )}
    </div>
  );
}
