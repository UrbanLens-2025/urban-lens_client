"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocationVouchers } from "@/hooks/vouchers/useLocationVouchers";
import { LocationVoucher, SortState } from "@/types";
import { useDebounce } from "use-debounce";
import { format } from "date-fns";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TicketPercent,
  Target,
  CalendarDays,
  Sparkles,
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "scheduled" | "expired">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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

  const getVoucherStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > now) return "scheduled";
    if (end < now) return "expired";
    return "active";
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    const status = getVoucherStatus(startDate, endDate);
    if (status === "scheduled") {
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          Scheduled
        </Badge>
      );
    }
    if (status === "expired") {
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Expired
        </Badge>
      );
    }
    return <Badge className="bg-emerald-500/90 text-white">Active</Badge>;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      return `${format(new Date(startDate), "MMM d, yyyy")} → ${format(new Date(endDate), "MMM d, yyyy")}`;
    } catch {
      return `${startDate} → ${endDate}`;
    }
  };

  const voucherTypes = useMemo(
    () => Array.from(new Set(vouchers.map((voucher) => voucher.voucherType))).sort(),
    [vouchers]
  );

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const status = getVoucherStatus(voucher.startDate, voucher.endDate);
      const statusMatch = statusFilter === "all" || status === statusFilter;
      const typeMatch = typeFilter === "all" || voucher.voucherType === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [vouchers, statusFilter, typeFilter]);

  const voucherStats = useMemo(() => {
    if (!vouchers.length) {
      return {
        total: 0,
        active: 0,
        scheduled: 0,
        expired: 0,
        totalSupply: 0,
        averagePrice: 0,
      };
    }

    const counts = vouchers.reduce(
      (acc, voucher) => {
        const status = getVoucherStatus(voucher.startDate, voucher.endDate);
        acc[status] += 1;
        acc.totalSupply += voucher.maxQuantity ?? 0;
        acc.totalPrice += voucher.pricePoint ?? 0;
        return acc;
      },
      { active: 0, scheduled: 0, expired: 0, totalSupply: 0, totalPrice: 0 }
    );

    return {
      total: meta?.totalItems ?? vouchers.length,
      active: counts.active,
      scheduled: counts.scheduled,
      expired: counts.expired,
      totalSupply: counts.totalSupply,
      averagePrice: vouchers.length ? Math.round((counts.totalPrice / vouchers.length) * 10) / 10 : 0,
    };
  }, [vouchers, meta]);

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
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
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
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span>Back to location</span>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Vouchers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch rewards and track redemption incentives for this location.
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/business/locations/${locationId}/vouchers/create`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create voucher
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total vouchers</CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-semibold">
              {voucherStats.total.toLocaleString()}
              <Sparkles className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Across all time
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Active vouchers</CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-semibold">
              {voucherStats.active.toLocaleString()}
              <Target className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Currently redeemable by users
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Scheduled / Expired</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {voucherStats.scheduled}/{voucherStats.expired}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Upcoming releases and retired rewards
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Reward supply</CardDescription>
            <CardTitle className="flex items-center justify-between text-2xl font-semibold">
              {voucherStats.totalSupply.toLocaleString()}
              <TicketPercent className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <div>Total available quantity</div>
            <div>Average cost {voucherStats.averagePrice.toLocaleString()} pts</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Vouchers ({filteredVouchers.length}/{meta?.totalItems || 0})
              </CardTitle>
              <CardDescription>
                Showing page {meta?.currentPage} of {meta?.totalPages}.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <Input
                placeholder="Search by code or title..."
                value={searchTerm}
                className="md:w-64"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
              >
                <SelectTrigger className="md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
                <SelectTrigger className="md:w-44">
                  <SelectValue placeholder="Voucher type" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All types</SelectItem>
                  {voucherTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !response ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-red-500">
              Failed to load vouchers.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="min-w-[220px]">Voucher</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="px-0"
                        onClick={() => handleSort("pricePoint")}
                      >
                        Price (pts) <SortIcon column="pricePoint" />
                      </Button>
                    </TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="px-0"
                        onClick={() => handleSort("createdAt")}
                      >
                        Created <SortIcon column="createdAt" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length > 0 ? (
                    filteredVouchers.map((voucher) => (
                      <TableRow key={voucher.id} className="hover:bg-muted/20">
                        <TableCell className="space-y-1">
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                              {voucher.imageUrl ? (
                                <img
                                  src={voucher.imageUrl}
                                  alt={voucher.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold leading-tight">
                                  {voucher.title}
                                </span>
                                <Badge variant="outline" className="text-[10px] uppercase">
                                  {voucher.voucherType.replace(/_/g, " ")}
                                </Badge>
                              </div>
                              {voucher.description && (
                                <p className="max-w-md text-xs text-muted-foreground line-clamp-2">
                                  {voucher.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Code</span>
                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                              {voucher.voucherCode}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDateRange(voucher.startDate, voucher.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {voucher.pricePoint.toLocaleString()} pts
                        </TableCell>
                        <TableCell className="font-medium">
                          {voucher.maxQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(voucher.startDate, voucher.endDate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(voucher.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <VoucherActions
                            voucher={voucher}
                            onDeleteClick={() => setVoucherToDelete(voucher)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32">
                        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                          <div className="text-base font-semibold">
                            No vouchers match your filters
                          </div>
                          <p className="max-w-sm text-sm text-muted-foreground">
                            Adjust filters or create a new voucher to offer fresh incentives for this location.
                          </p>
                          <Button asChild size="sm">
                            <Link href={`/dashboard/business/locations/${locationId}/vouchers/create`}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create voucher
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
