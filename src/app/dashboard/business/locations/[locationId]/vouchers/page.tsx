"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocationVouchers } from "@/hooks/vouchers/useLocationVouchers";
import { LocationVoucher, SortState } from "@/types";
import { useDebounce } from "use-debounce";

// --- Import UI Components ---
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
import {
  Loader2,
  PlusCircle,
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDeleteLocationVoucher } from "@/hooks/vouchers/useDeleteLocationVoucher";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Component Actions cho từng Voucher
function VoucherActions({
  voucher,
  onDeleteClick,
}: {
  voucher: LocationVoucher;
  onDeleteClick: () => void;
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
          <Link
            href={`/dashboard/business/locations/${voucher.locationId}/vouchers/${voucher.id}`}
          >
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
           <Link href={`/dashboard/business/locations/${voucher.locationId}/vouchers/${voucher.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDeleteClick} className="text-red-500">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ManageVouchersPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [voucherToDelete, setVoucherToDelete] = useState<LocationVoucher | null>(null);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });

  const {
    data: response,
    isLoading,
    isError,
  } = useLocationVouchers({
    locationId,
    page,
    sortBy: `${sort.column}:${sort.direction}`,
    search: debouncedSearchTerm,
  });

  const { mutate: deleteVoucher, isPending: isDeleting } = useDeleteLocationVoucher(locationId);

  const vouchers = response?.data || [];
  const meta = response?.meta;

  const getStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    if (new Date(startDate) > now)
      return <Badge variant="outline">Scheduled</Badge>;
    if (new Date(endDate) < now)
      return <Badge variant="secondary">Expired</Badge>;
    return <Badge className="bg-green-600">Active</Badge>;
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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const onConfirmDelete = () => {
    if (!voucherToDelete) return;
    deleteVoucher(voucherToDelete.id, {
      onSuccess: () => {
        setVoucherToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-3xl font-bold">Manage Vouchers</h1>
        </div>
        <Link
          href={`/dashboard/business/locations/${locationId}/vouchers/create`}
        >
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Voucher
          </Button>
        </Link>
      </div>

      {/* --- Bảng Danh sách --- */}
      <Card>
        <CardHeader>
          <CardTitle>All Vouchers ({meta?.totalItems || 0})</CardTitle>
          <CardDescription>
            Create and manage vouchers for this location. Showing page{" "}
            {meta?.currentPage} of {meta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search vouchers by code or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !response ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500 py-12">
              Failed to load vouchers.
            </div>
          ) : (
            <Table>
              {/* --- CẬP NHẬT BẢNG --- */}
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("pricePoint")}
                    >
                      Price (Points) <SortIcon column="pricePoint" />
                    </Button>
                  </TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created At <SortIcon column="createdAt" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.length > 0 ? (
                  vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-medium">
                        {voucher.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{voucher.voucherCode}</Badge>
                      </TableCell>
                      <TableCell>{voucher.pricePoint} pts</TableCell>
                      <TableCell>{voucher.maxQuantity}</TableCell>
                      <TableCell>
                        {getStatus(voucher.startDate, voucher.endDate)}
                      </TableCell>
                      <TableCell>{formatDate(voucher.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <VoucherActions voucher={voucher} onDeleteClick={() => setVoucherToDelete(voucher)} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No vouchers found for this location.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* --- Phân trang --- */}
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

      <AlertDialog open={!!voucherToDelete} onOpenChange={() => setVoucherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the voucher: 
              <strong className="ml-1">&quot;{voucherToDelete?.title}&quot;</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Yes, Delete Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
