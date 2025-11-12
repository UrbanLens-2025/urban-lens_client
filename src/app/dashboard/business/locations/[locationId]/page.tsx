"use client";

import { useLocationById } from "@/hooks/locations/useLocationById";
import {
  ArrowLeft,
  CalendarDays,
  FilePenLine,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Eye,
  EyeOff,
  Layers,
  ImageIcon,
  Building,
  Tag,
  Rocket,
  Ticket,
  DollarSign,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { use, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DisplayTags } from "@/components/shared/DisplayTags";
import type React from "react";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocationVouchers } from "@/hooks/vouchers/useLocationVouchers";
import { useLocationMissions } from "@/hooks/missions/useLocationMissions";
import { useDeleteLocationVoucher } from "@/hooks/vouchers/useDeleteLocationVoucher";
import { useDeleteLocationMission } from "@/hooks/missions/useDeleteLocationMission";
import { useDebounce } from "use-debounce";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye as EyeIcon,
  TicketPercent,
  Target,
  Trophy,
  Sparkles,
  CalendarDays as CalendarDaysIcon,
  Save,
  Clock,
  Calendar,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Building2,
  Filter,
  ImagePlus,
} from "lucide-react";
import type { LocationVoucher, LocationMission, SortState, Announcement } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useOwnerLocationBookingConfig } from "@/hooks/locations/useOwnerLocationBookingConfig";
import { useCreateLocationBookingConfig, useUpdateLocationBookingConfig } from "@/hooks/locations/useCreateLocationBookingConfig";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import type { UpdateLocationBookingConfigPayload } from "@/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUpdateLocation } from "@/hooks/locations/useUpdateLocation";
import { FileUpload } from "@/components/shared/FileUpload";
import { useAddTagsToLocation } from "@/hooks/tags/useAddTagsToLocation";
import { useRemoveTagsFromLocation } from "@/hooks/tags/useRemoveTagsFromLocation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";
import { LocationTagsSelector } from "@/components/locations/LocationTagsSelector";
import { useWeeklyAvailabilities } from "@/hooks/availability/useWeeklyAvailabilities";
import { useCreateWeeklyAvailability } from "@/hooks/availability/useCreateWeeklyAvailability";
import { useDeleteAvailability } from "@/hooks/availability/useDeleteAvailability";
import { useUpdateWeeklyAvailability } from "@/hooks/availability/useUpdateWeeklyAvailability";
import type { WeeklyAvailabilityResponse } from "@/api/availability";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAnnouncements } from "@/hooks/announcements/useAnnouncements";
import { useDeleteAnnouncement } from "@/hooks/announcements/useDeleteAnnouncement";
import { formatDateTime } from "@/lib/utils";

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      {Icon && (
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-xs font-semibold text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Vouchers Tab Component
function VouchersTab({ locationId }: { locationId: string }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "scheduled" | "expired">("all");
  const [voucherToDelete, setVoucherToDelete] = useState<LocationVoucher | null>(null);

  const { data: response, isLoading, isError } = useLocationVouchers({
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
      return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Scheduled</Badge>;
    }
    if (status === "expired") {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">Expired</Badge>;
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

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const status = getVoucherStatus(voucher.startDate, voucher.endDate);
      return statusFilter === "all" || status === statusFilter;
    });
  }, [vouchers, statusFilter]);

  const voucherStats = useMemo(() => {
    if (!vouchers.length) {
      return { total: 0, active: 0, scheduled: 0, expired: 0, totalSupply: 0, averagePrice: 0 };
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
      direction: currentSort.column === columnName && currentSort.direction === "DESC" ? "ASC" : "DESC",
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === "ASC" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const onConfirmDelete = () => {
    if (!voucherToDelete) return;
    deleteVoucher(voucherToDelete.id, {
      onSuccess: () => setVoucherToDelete(null),
    });
  };

  function VoucherActions({ voucher }: { voucher: LocationVoucher }) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/business/locations/${voucher.locationId}/vouchers/${voucher.id}`}>
              <EyeIcon className="mr-2 h-4 w-4" /> View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/business/locations/${voucher.locationId}/vouchers/${voucher.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setVoucherToDelete(voucher)} className="text-red-500">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild size="sm">
          <Link href={`/dashboard/business/locations/${locationId}/vouchers/create`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create voucher
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total vouchers</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0 pb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xl font-semibold">{voucherStats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active vouchers</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0 pb-3">
            <Target className="h-4 w-4 text-emerald-500" />
            <p className="text-xl font-semibold">{voucherStats.active.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Scheduled / Expired</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-xl font-semibold">{voucherStats.scheduled}/{voucherStats.expired}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Reward supply</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0 pb-3">
            <TicketPercent className="h-4 w-4 text-amber-500" />
            <p className="text-xl font-semibold">{voucherStats.totalSupply.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm font-semibold">
              Vouchers ({filteredVouchers.length}/{meta?.totalItems || 0})
            </CardTitle>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <Input
                placeholder="Search by code or title..."
                value={searchTerm}
                className="h-8 md:w-64"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="h-8 md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {isLoading && !response ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-red-500">Failed to load vouchers.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="min-w-[220px]">Voucher</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="px-0 h-auto" onClick={() => handleSort("pricePoint")}>
                        Price (pts) <SortIcon column="pricePoint" />
                      </Button>
                    </TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="px-0 h-auto" onClick={() => handleSort("createdAt")}>
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
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                              {voucher.imageUrl ? (
                                <img src={voucher.imageUrl} alt={voucher.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold leading-tight">{voucher.title}</span>
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
                            <CalendarDaysIcon className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDateRange(voucher.startDate, voucher.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{voucher.pricePoint.toLocaleString()} pts</TableCell>
                        <TableCell className="font-medium">{voucher.maxQuantity.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(voucher.startDate, voucher.endDate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(voucher.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <VoucherActions voucher={voucher} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32">
                        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                          <div className="text-sm font-semibold">No vouchers match your filters</div>
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

      <div className="flex items-center justify-end space-x-2 py-2">
        <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!meta || meta.currentPage <= 1}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!meta || meta.currentPage >= meta.totalPages}>
          Next
        </Button>
      </div>

      <AlertDialog open={!!voucherToDelete} onOpenChange={() => setVoucherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the voucher: <strong className="ml-1">&quot;{voucherToDelete?.title}&quot;</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Missions Tab Component
function MissionsTab({ locationId }: { locationId: string }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({ column: "createdAt", direction: "DESC" });
  const [missionToDelete, setMissionToDelete] = useState<LocationMission | null>(null);

  const { data: response, isLoading, isError } = useLocationMissions({
    locationId,
    page,
    sortBy: `${sort.column}:${sort.direction}`,
    search: debouncedSearchTerm,
  });

  const { mutate: deleteMission, isPending: isDeleting } = useDeleteLocationMission(locationId);

  const missions = response?.data || [];
  const meta = response?.meta;

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > now) {
      return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Scheduled</Badge>;
    }
    if (end < now) {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">Completed</Badge>;
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

  const missionStats = useMemo(() => {
    if (!missions.length) {
      return { total: 0, active: 0, scheduled: 0, completed: 0, totalReward: 0 };
    }
    const now = new Date();
    let active = 0, scheduled = 0, completed = 0;
    const totalReward = missions.reduce((sum, mission) => sum + (mission.reward ?? 0), 0);
    missions.forEach((mission) => {
      const start = new Date(mission.startDate);
      const end = new Date(mission.endDate);
      if (start > now) scheduled += 1;
      else if (end < now) completed += 1;
      else active += 1;
    });
    return { total: meta?.totalItems ?? missions.length, active, scheduled, completed, totalReward };
  }, [missions, meta]);

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction: currentSort.column === columnName && currentSort.direction === "DESC" ? "ASC" : "DESC",
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === "ASC" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const onConfirmDelete = () => {
    if (!missionToDelete) return;
    deleteMission(missionToDelete.id, {
      onSuccess: () => setMissionToDelete(null),
    });
  };

  function MissionActions({ mission }: { mission: LocationMission }) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}`}>
              <EyeIcon className="mr-2 h-4 w-4" /> View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMissionToDelete(mission)} className="text-red-500">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild size="sm">
          <Link href={`/dashboard/business/locations/${locationId}/missions/create`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create mission
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total missions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0 pb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xl font-semibold">{missionStats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active missions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0 pb-3">
            <Target className="h-4 w-4 text-emerald-500" />
            <p className="text-xl font-semibold">{missionStats.active.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Scheduled / Completed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <p className="text-xl font-semibold">{missionStats.scheduled}/{missionStats.completed}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total rewards</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-0 pb-3">
            <Trophy className="h-4 w-4 text-amber-500" />
            <p className="text-xl font-semibold">{missionStats.totalReward.toLocaleString()} pts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm font-semibold">Missions ({meta?.totalItems || 0})</CardTitle>
            <div className="w-full md:w-72">
              <Input placeholder="Search missions by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {isLoading && !response ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500 py-12">Failed to load missions.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="min-w-[220px]">
                      <Button variant="ghost" className="px-0 h-auto" onClick={() => handleSort("title")}>
                        Title <SortIcon column="title" />
                      </Button>
                    </TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="px-0 h-auto" onClick={() => handleSort("target")}>
                        Target <SortIcon column="target" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" className="px-0 h-auto" onClick={() => handleSort("reward")}>
                        Reward <SortIcon column="reward" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.length > 0 ? (
                    missions.map((mission) => (
                      <TableRow key={mission.id} className="hover:bg-muted/20">
                        <TableCell className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{mission.title}</span>
                            <Badge variant="outline" className="text-[10px]">{mission.metric}</Badge>
                          </div>
                          {mission.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{mission.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground space-y-1">
                          <div>{mission.metric?.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")}</div>
                          <div>{formatDateRange(mission.startDate, mission.endDate)}</div>
                        </TableCell>
                        <TableCell className="font-medium">{mission.target}</TableCell>
                        <TableCell className="font-medium">{mission.reward} pts</TableCell>
                        <TableCell>{getStatusBadge(mission.startDate, mission.endDate)}</TableCell>
                        <TableCell className="text-right">
                          <MissionActions mission={mission} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32">
                        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                          <div className="text-sm font-semibold">No missions yet</div>
                          <Button asChild size="sm">
                            <Link href={`/dashboard/business/locations/${locationId}/missions/create`}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create your first mission
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

      <div className="flex items-center justify-end space-x-2 py-2">
        <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={!meta || meta.currentPage <= 1}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={!meta || meta.currentPage >= meta.totalPages}>
          Next
        </Button>
      </div>

      <AlertDialog open={!!missionToDelete} onOpenChange={() => setMissionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this mission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mission: <strong className="ml-1">&quot;{missionToDelete?.title}&quot;</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete Mission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Booking Config Tab Component
const bookingConfigSchema = z
  .object({
    allowBooking: z.boolean(),
    baseBookingPrice: z
      .number()
      .positive("Base booking price must be greater than 0")
      .min(0.01, "Base booking price must be at least 0.01"),
    currency: z.string().min(1, "Currency is required"),
    minBookingDurationMinutes: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0")
      .min(1, "Minimum duration must be at least 1 minute"),
    maxBookingDurationMinutes: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0"),
    minGapBetweenBookingsMinutes: z
      .number()
      .int("Must be a whole number")
      .min(0, "Minimum gap cannot be negative"),
  })
  .refine(
    (data) => data.maxBookingDurationMinutes >= data.minBookingDurationMinutes,
    {
      message: "Maximum duration must be greater than or equal to minimum duration",
      path: ["maxBookingDurationMinutes"],
    }
  );

type BookingConfigForm = z.infer<typeof bookingConfigSchema>;

function BookingConfigTab({ locationId }: { locationId: string }) {
  const { data: existingConfig, isLoading: isLoadingConfig, error: configError } =
    useOwnerLocationBookingConfig(locationId);
  const createConfig = useCreateLocationBookingConfig();
  const updateConfig = useUpdateLocationBookingConfig();

  const form = useForm<BookingConfigForm>({
    resolver: zodResolver(bookingConfigSchema),
    defaultValues: {
      allowBooking: true,
      baseBookingPrice: 0,
      currency: "VND",
      minBookingDurationMinutes: 30,
      maxBookingDurationMinutes: 240,
      minGapBetweenBookingsMinutes: 15,
    },
  });

  useEffect(() => {
    if (existingConfig && !configError) {
      form.reset({
        allowBooking: existingConfig.allowBooking,
        baseBookingPrice: parseFloat(existingConfig.baseBookingPrice),
        currency: existingConfig.currency,
        minBookingDurationMinutes: existingConfig.minBookingDurationMinutes,
        maxBookingDurationMinutes: existingConfig.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes: existingConfig.minGapBetweenBookingsMinutes,
      });
    }
  }, [existingConfig, configError, form]);

  const onSubmit = (data: BookingConfigForm) => {
    if (hasConfig) {
      const updatePayload: UpdateLocationBookingConfigPayload = {
        allowBooking: data.allowBooking,
        baseBookingPrice: data.baseBookingPrice,
        currency: data.currency,
        minBookingDurationMinutes: data.minBookingDurationMinutes,
        maxBookingDurationMinutes: data.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes: data.minGapBetweenBookingsMinutes,
      };
      updateConfig.mutate({
        locationId,
        payload: updatePayload,
      });
    } else {
      createConfig.mutate({
        locationId,
        ...data,
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const basePrice = form.watch("baseBookingPrice");
  const currency = form.watch("currency");
  const minDuration = form.watch("minBookingDurationMinutes");
  const maxDuration = form.watch("maxBookingDurationMinutes");

  const hasConfig = existingConfig && !configError;
  const isSubmitting = createConfig.isPending || updateConfig.isPending;

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    Booking Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0 pb-4">
                  <FormField
                    control={form.control}
                    name="allowBooking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Allow Booking</FormLabel>
                          <FormDescription className="text-xs">
                            Enable or disable booking for this location
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Pricing</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="baseBookingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Base Booking Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Base price for minimum booking duration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Currency</FormLabel>
                            <FormControl>
                              <Input placeholder="VND" maxLength={3} {...field} className="h-8" />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Currency code (e.g., VND, USD)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Duration Settings
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="minBookingDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Minimum Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="30"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Minimum booking duration in minutes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxBookingDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Maximum Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="240"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="h-8"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Maximum booking duration in minutes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="minGapBetweenBookingsMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Minimum Gap Between Bookings (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="15"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Minimum time required between consecutive bookings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button type="submit" disabled={isSubmitting} size="sm" className="h-8">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-3.5 w-3.5" />
                          {hasConfig ? "Update Configuration" : "Create Configuration"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-border/60 shadow-sm sticky top-4">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-4">
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="text-sm font-semibold">
                    {form.watch("allowBooking") ? (
                      <span className="text-green-600">Booking Enabled</span>
                    ) : (
                      <span className="text-gray-500">Booking Disabled</span>
                    )}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Base Price</Label>
                  <p className="text-xl font-bold">{formatCurrency(basePrice, currency)}</p>
                  <p className="text-xs text-muted-foreground">per {minDuration} minutes</p>
                </div>

                <div className="border-t pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Min Duration</span>
                    <span className="font-medium">{minDuration} min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Max Duration</span>
                    <span className="font-medium">{maxDuration} min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Gap Required</span>
                    <span className="font-medium">{form.watch("minGapBetweenBookingsMinutes")} min</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Edit Location Tab Component
const updateLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.array(z.string().url()).min(1, "At least one image is required"),
  isVisibleOnMap: z.boolean().optional(),
  tagIds: z.array(z.number()).min(1, "At least one tag is required"),
});
type FormValues = z.infer<typeof updateLocationSchema>;

function EditLocationTab({ locationId }: { locationId: string }) {
  const queryClient = useQueryClient();
  const { data: location, isLoading: isLoadingData } = useLocationById(locationId);
  const { mutateAsync: updateLocation, isPending: isUpdating } = useUpdateLocation();
  const { mutateAsync: addTags, isPending: isAddingTags } = useAddTagsToLocation();
  const { mutateAsync: removeTags, isPending: isRemovingTags } = useRemoveTagsFromLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(updateLocationSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      imageUrl: [],
      isVisibleOnMap: false,
      tagIds: [],
    },
  });

  const watchedValues = form.watch();
  const { resolvedTags: tags } = useResolvedTags(watchedValues.tagIds);
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        description: location.description,
        imageUrl: location.imageUrl || [],
        isVisibleOnMap: location.isVisibleOnMap ?? false,
        tagIds: location.tags.map((t) => t.id),
      });
    }
  }, [location, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { name, description, imageUrl, isVisibleOnMap, tagIds: newTagIds } = values;
      const mainPayload = {
        name,
        description,
        imageUrl,
        isVisibleOnMap: isVisibleOnMap ?? false,
        tagIds: newTagIds,
      };

      const originalTagIds = location?.tags.map((t) => t.id) || [];
      const tagsToAdd = newTagIds.filter((id) => !originalTagIds.includes(id));
      const tagsToRemove = originalTagIds.filter((id) => !newTagIds.includes(id));

      const mutationPromises = [];
      mutationPromises.push(updateLocation({ locationId, payload: mainPayload }));

      if (tagsToAdd.length > 0) {
        mutationPromises.push(addTags({ locationId, tagIds: tagsToAdd }));
      }

      if (tagsToRemove.length > 0) {
        mutationPromises.push(removeTags({ locationId, tagIds: tagsToRemove }));
      }

      await Promise.all(mutationPromises);
      queryClient.invalidateQueries({ queryKey: ["myLocations"] });
      queryClient.invalidateQueries({ queryKey: ["location", locationId] });
      toast.success("Location updated successfully");
    } catch (err) {
      toast.error("An error occurred while saving. Please try again.");
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!location) {
    return <div>Location not found.</div>;
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4" />
                Core details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 pb-4">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Location name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Skyline Rooftop Venue" {...field} className="h-8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Describe the ambiance, capacity, and unique features guests should know."
                        {...field}
                        className="text-sm resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="tagIds"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tags</FormLabel>
                    <FormControl>
                      <LocationTagsSelector
                        value={field.value}
                        onChange={(ids) => field.onChange(ids)}
                        error={form.formState.errors.tagIds?.message}
                        helperText="Select the location type and other relevant categories."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Selected tags
                </p>
                <div>
                  {tags.length > 0 ? (
                    <DisplayTags tags={tags} maxCount={10} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No tags selected yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ImagePlus className="h-4 w-4" />
                Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <FormField
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm">Visibility & publishing</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <FormField
                name="isVisibleOnMap"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs">Visible on map</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Toggle off if you want to temporarily hide this location from creators.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {watchedValues.isVisibleOnMap ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-emerald-500" />
                    <span>This location will appear in venue search results.</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>This location is hidden and only accessible via direct links.</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse items-stretch gap-2 border-t pt-3 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={!isDirty || isUpdating}
              size="sm"
              className="h-8 sm:min-w-[140px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Announcements Tab Component
function AnnouncementsTab({ locationId }: { locationId: string }) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("startDate:DESC");
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [debouncedSearch] = useDebounce(searchTerm, 400);

  const { data, isLoading, isError, isFetching } = useAnnouncements(
    {
      page,
      limit,
      sortBy,
      search: debouncedSearch,
      locationId,
    },
    { enabled: Boolean(locationId) }
  );

  const { mutate: deleteAnnouncement, isPending: isDeleting } = useDeleteAnnouncement();

  const announcements = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = () => {
    if (!announcementToDelete) return;
    deleteAnnouncement(announcementToDelete.id, {
      onSuccess: () => setAnnouncementToDelete(null),
    });
  };

  const renderPublishWindow = (announcement: Announcement) => {
    const start = announcement.startDate ? formatDateTime(announcement.startDate) : "—";
    const end = announcement.endDate ? formatDateTime(announcement.endDate) : "—";
    return (
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p><span className="font-medium">Starts:</span> {start}</p>
        <p><span className="font-medium">Ends:</span> {end}</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button asChild size="sm">
          <Link href={`/dashboard/business/locations/${locationId}/announcements/new`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create announcement
          </Link>
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-sm font-semibold">Announcements</CardTitle>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className="h-8 md:w-64"
              />
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="startDate:DESC">Start date (newest)</SelectItem>
                  <SelectItem value="startDate:ASC">Start date (oldest)</SelectItem>
                  <SelectItem value="createdAt:DESC">Created (newest)</SelectItem>
                  <SelectItem value="createdAt:ASC">Created (oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-destructive">
              Failed to load announcements. Please try again shortly.
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Megaphone className="h-8 w-8 text-muted-foreground/70" />
              <div>
                <p className="text-sm font-semibold">No announcements yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first announcement to keep visitors informed.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Announcement</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {announcement.imageUrl ? (
                            <img
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              className="h-12 w-16 flex-shrink-0 rounded-md border object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 flex-shrink-0 items-center justify-center rounded-md border border-dashed text-[10px] text-muted-foreground">
                              No image
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm leading-tight">
                                {announcement.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {announcement.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{renderPublishWindow(announcement)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground text-xs">
                          {announcement.isHidden ? "Hidden" : "Visible"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <p>Created {formatDateTime(announcement.createdAt)}</p>
                          <p>Updated {formatDateTime(announcement.updatedAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" asChild className="h-7 text-xs">
                            <Link
                              href={`/dashboard/business/locations/${locationId}/announcements/${announcement.id}/edit`}
                            >
                              Manage
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive h-7 text-xs"
                            onClick={() => setAnnouncementToDelete(announcement)}
                            disabled={isDeleting && announcementToDelete?.id === announcement.id}
                          >
                            {isDeleting && announcementToDelete?.id === announcement.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <div>
            {meta ? (
              <span>
                Showing page {meta.currentPage} of {meta.totalPages} ({meta.totalItems} total)
              </span>
            ) : (
              <span>No data</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!meta || meta.currentPage <= 1 || isFetching}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => (meta ? Math.min(meta.totalPages, prev + 1) : prev + 1))}
              disabled={!meta || meta.currentPage >= meta.totalPages || isFetching}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement
              {announcementToDelete && ` "${announcementToDelete.title}"`} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Availability Tab Component - Simplified version
interface WeeklyAvailabilitySlot {
  id?: number;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
}

const DAY_OF_WEEK_MAP: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

const DAY_OF_WEEK_REVERSE_MAP: Record<number, string> = {
  0: "MONDAY",
  1: "TUESDAY",
  2: "WEDNESDAY",
  3: "THURSDAY",
  4: "FRIDAY",
  5: "SATURDAY",
  6: "SUNDAY",
};

const transformApiResponse = (apiData: WeeklyAvailabilityResponse[]): WeeklyAvailabilitySlot[] => {
  return apiData.map((item) => {
    const startHour = parseInt(item.startTime.split(":")[0], 10);
    const endHour = parseInt(item.endTime.split(":")[0], 10);
    return {
      id: item.id,
      dayOfWeek: DAY_OF_WEEK_MAP[item.dayOfWeek],
      startHour,
      endHour,
    };
  });
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function AvailabilityTab({ locationId }: { locationId: string }) {
  const { data: apiAvailability, isLoading } = useWeeklyAvailabilities(locationId);
  const { mutate: createWeeklyAvailability, isPending: isCreating } = useCreateWeeklyAvailability();
  const { mutate: deleteAvailability, isPending: isDeleting } = useDeleteAvailability(locationId);
  const { mutate: updateWeeklyAvailability, isPending: isUpdating } = useUpdateWeeklyAvailability(locationId);

  const availability = useMemo(() => {
    if (!apiAvailability) return [];
    return transformApiResponse(apiAvailability);
  }, [apiAvailability]);

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [slotsToConfirm, setSlotsToConfirm] = useState<WeeklyAvailabilitySlot[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<WeeklyAvailabilitySlot | null>(null);
  const [editedStartHour, setEditedStartHour] = useState<number>(0);
  const [editedEndHour, setEditedEndHour] = useState<number>(0);
  const [editErrors, setEditErrors] = useState<{ start?: string; end?: string; overlap?: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);

  const availabilityCellsSet = useMemo(() => {
    const set = new Set<string>();
    availability.forEach((slot) => {
      for (let hour = slot.startHour; hour < slot.endHour; hour++) {
        set.add(`${slot.dayOfWeek}_${hour}`);
      }
    });
    return set;
  }, [availability]);

  const weeklyStats = useMemo(() => {
    if (availability.length === 0) {
      return { totalHours: 0, activeDays: 0, slotCount: 0, longestBlock: 0 };
    }
    const activeDaysSet = new Set<number>();
    let totalHours = 0;
    let longestBlock = 0;
    availability.forEach((slot) => {
      activeDaysSet.add(slot.dayOfWeek);
      const duration = slot.endHour - slot.startHour;
      totalHours += duration;
      if (duration > longestBlock) longestBlock = duration;
    });
    return {
      totalHours,
      activeDays: activeDaysSet.size,
      slotCount: availability.length,
      longestBlock,
    };
  }, [availability]);

  const getCellStatus = (day: number, hour: number): "available" | "saved" => {
    const key = `${day}_${hour}`;
    return availabilityCellsSet.has(key) ? "saved" : "available";
  };

  const getSlotAtCell = (day: number, hour: number): WeeklyAvailabilitySlot | null => {
    return availability.find(
      (slot) => slot.dayOfWeek === day && hour >= slot.startHour && hour < slot.endHour
    ) || null;
  };

  const handleCellClick = (day: number, hour: number) => {
    const key = `${day}_${hour}`;
    if (availabilityCellsSet.has(key)) {
      const block = getSlotAtCell(day, hour);
      if (block) {
        setSlotToEdit(block);
        setEditedStartHour(block.startHour);
        setEditedEndHour(block.endHour);
        setEditErrors({});
        setShowEditDialog(true);
      }
      return;
    }
    const newSelectedCells = new Set([key]);
    setSelectedCells(newSelectedCells);
    processSelectedCells(newSelectedCells);
  };

  const processSelectedCells = (cellsToProcess: Set<string>) => {
    if (cellsToProcess.size === 0) return;
    const slotsByDay = new Map<number, number[]>();
    cellsToProcess.forEach((key) => {
      const [dayStr, hourStr] = key.split("_");
      const day = parseInt(dayStr, 10);
      const hour = parseInt(hourStr, 10);
      if (!slotsByDay.has(day)) slotsByDay.set(day, []);
      slotsByDay.get(day)!.push(hour);
    });
    const newSlots: WeeklyAvailabilitySlot[] = [];
    slotsByDay.forEach((hours, day) => {
      if (hours.length === 0) return;
      hours.sort((a, b) => a - b);
      let startHour = hours[0];
      for (let i = 1; i < hours.length; i++) {
        if (hours[i] !== hours[i - 1] + 1) {
          newSlots.push({ dayOfWeek: day, startHour, endHour: hours[i - 1] + 1 });
          startHour = hours[i];
        }
      }
      newSlots.push({ dayOfWeek: day, startHour, endHour: hours[hours.length - 1] + 1 });
    });
    setSlotsToConfirm(newSlots);
    setShowConfirmDialog(true);
  };

  const convertToApiFormat = (slot: WeeklyAvailabilitySlot) => {
    return {
      dayOfWeek: DAY_OF_WEEK_REVERSE_MAP[slot.dayOfWeek] as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
      startTime: `${String(slot.startHour).padStart(2, '0')}:00`,
      endTime: `${String(slot.endHour).padStart(2, '0')}:00`,
    };
  };

  const formatHour = (hour: number): string => {
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const formatHourRange = (hour: number): string => {
    const nextHour = (hour + 1) % 24;
    return `${formatHour(hour)} - ${formatHour(nextHour)}`;
  };

  const handleConfirmAdd = () => {
    if (slotsToConfirm.length === 0) return;
    const createSequentially = async () => {
      for (const slot of slotsToConfirm) {
        const apiPayload = { locationId, ...convertToApiFormat(slot) };
        await new Promise<void>((resolve, reject) => {
          createWeeklyAvailability(apiPayload, {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          });
        });
      }
      setSelectedCells(new Set());
      setShowConfirmDialog(false);
      setSlotsToConfirm([]);
    };
    createSequentially();
  };

  const handleCancelDialog = () => {
    setSelectedCells(new Set());
    setShowConfirmDialog(false);
    setSlotsToConfirm([]);
  };

  const validateEditedTimes = (startHour: number, endHour: number, dayOfWeek: number, slotId?: number): { start?: string; end?: string; overlap?: string } => {
    const errors: { start?: string; end?: string; overlap?: string } = {};
    if (startHour >= endHour) {
      errors.end = "End time must be after start time";
      return errors;
    }
    if (endHour - startHour < 1) {
      errors.end = "Minimum duration is 1 hour";
      return errors;
    }
    if (startHour < 0 || startHour > 23) {
      errors.start = "Start time must be between 00:00 and 23:00";
    }
    if (endHour < 1 || endHour > 24) {
      errors.end = "End time must be between 01:00 and 24:00";
    }
    const otherSlots = availability.filter((s) => s.id !== slotId);
    for (let h = startHour; h < endHour; h++) {
      for (const otherSlot of otherSlots) {
        if (otherSlot.dayOfWeek === dayOfWeek && h >= otherSlot.startHour && h < otherSlot.endHour) {
          errors.overlap = `Overlaps with existing availability on ${DAYS_OF_WEEK[otherSlot.dayOfWeek]} (${formatHour(otherSlot.startHour)} - ${formatHour(otherSlot.endHour)})`;
          return errors;
        }
      }
    }
    return errors;
  };

  const handleStartTimeChange = (value: string) => {
    const hour = parseInt(value, 10);
    if (isNaN(hour)) return;
    const clampedHour = Math.max(0, Math.min(23, hour));
    setEditedStartHour(clampedHour);
  };

  const handleEndTimeChange = (value: string) => {
    const hour = parseInt(value, 10);
    if (isNaN(hour)) return;
    const clampedHour = Math.max(1, Math.min(24, hour));
    setEditedEndHour(clampedHour);
  };

  useEffect(() => {
    if (slotToEdit && editedStartHour !== undefined && editedEndHour !== undefined) {
      const errors = validateEditedTimes(editedStartHour, editedEndHour, slotToEdit.dayOfWeek, slotToEdit.id);
      setEditErrors(errors);
    }
  }, [editedStartHour, editedEndHour, slotToEdit, availability]);

  const handleConfirmUpdate = () => {
    if (!slotToEdit || !slotToEdit.id) return;
    const errors = validateEditedTimes(editedStartHour, editedEndHour, slotToEdit.dayOfWeek, slotToEdit.id);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    const payload = {
      startTime: `${String(editedStartHour).padStart(2, '0')}:00`,
      endTime: `${String(editedEndHour).padStart(2, '0')}:00`,
    };
    updateWeeklyAvailability(
      { id: slotToEdit.id, payload },
      {
        onSuccess: () => {
          setShowEditDialog(false);
          setSlotToEdit(null);
          setEditErrors({});
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!slotToEdit || !slotToEdit.id) return;
    deleteAvailability(slotToEdit.id, {
      onSuccess: () => {
        setShowEditDialog(false);
        setSlotToEdit(null);
        setEditErrors({});
      },
    });
  };

  const handleCancelEditDialog = () => {
    setShowEditDialog(false);
    setSlotToEdit(null);
    setEditErrors({});
  };

  const getCellClassName = (status: "available" | "saved", isSelected: boolean) => {
    return cn(
      "w-full h-full rounded border transition-all flex items-center justify-center text-[8px] font-medium",
      {
        "bg-green-500 border-green-600 border-2 text-white cursor-pointer": status === "saved",
        "bg-blue-400 border-blue-500 border-2 text-white": isSelected && status === "available",
        "bg-white border-gray-300 border-2 text-gray-700 hover:opacity-80 cursor-pointer": !isSelected && status === "available",
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold">Manage Weekly Availability</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 pb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Total weekly hours</span>
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="mt-1.5 text-xl font-semibold">
                {weeklyStats.totalHours}
                <span className="ml-1 text-xs font-normal text-muted-foreground">hrs</span>
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Active days</span>
                <CalendarDaysIcon className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="mt-1.5 text-xl font-semibold">
                {weeklyStats.activeDays}
                <span className="ml-1 text-xs font-normal text-muted-foreground">days</span>
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Availability blocks</span>
                <Layers className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <p className="text-xl font-semibold">{weeklyStats.slotCount}</p>
                <span className="text-xs text-muted-foreground">
                  longest block {weeklyStats.longestBlock || 0} hr{weeklyStats.longestBlock === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded bg-green-500 ring-1 ring-green-600" />
              Saved availability
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded bg-blue-400 ring-1 ring-blue-500" />
              Currently selected
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded bg-background ring-1 ring-border" />
              Empty slot
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="rounded-xl border border-border/60 bg-muted/10 p-2 shadow-sm">
                <div className="mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-1 border-b border-border/60 pb-2">
                  <div className="border-r border-border/60" />
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div key={index} className="py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                <div className="space-y-0.5">
                  {HOURS.map((hour) => {
                    const isNightTime = hour >= 21 || hour <= 5;
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "grid grid-cols-[80px_repeat(7,1fr)] gap-1 rounded-md px-0.5 py-0.5",
                          isNightTime && "bg-muted/40"
                        )}
                      >
                        <div className="flex items-center justify-center pr-2 text-xs font-medium text-muted-foreground">
                          {formatHourRange(hour)}
                        </div>
                        {DAYS_OF_WEEK.map((_, dayIndex) => {
                          const status = getCellStatus(dayIndex, hour);
                          const key = `${dayIndex}_${hour}`;
                          const isSelected = selectedCells.has(key);
                          return (
                            <div
                              key={`${dayIndex}_${hour}`}
                              className="h-[18px] cursor-pointer"
                              onClick={() => handleCellClick(dayIndex, hour)}
                            >
                              <div className={getCellClassName(status, isSelected)} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
            <DialogDescription>
              Confirm adding the following time ranges to your weekly availability:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
            {slotsToConfirm.map((slot, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="font-medium text-sm">{DAYS_OF_WEEK[slot.dayOfWeek]}</div>
                <div className="text-xs text-gray-600">
                  {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDialog} disabled={isCreating} size="sm">
              Cancel
            </Button>
            <Button onClick={handleConfirmAdd} disabled={isCreating} size="sm">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Availability</DialogTitle>
            <DialogDescription>
              Update the time range or delete this availability slot.
            </DialogDescription>
          </DialogHeader>
          {slotToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Day</Label>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-base font-semibold">{DAYS_OF_WEEK[slotToEdit.dayOfWeek]}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Time Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="start-time"
                        type="number"
                        min="0"
                        max="23"
                        value={editedStartHour}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className={cn("text-center font-mono h-8", editErrors.start && "border-destructive")}
                      />
                      <span className="text-xs text-muted-foreground">:00</span>
                    </div>
                    {editErrors.start && <p className="text-xs text-destructive">{editErrors.start}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-xs">End Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="end-time"
                        type="number"
                        min="1"
                        max="24"
                        value={editedEndHour}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className={cn("text-center font-mono h-8", editErrors.end && "border-destructive")}
                      />
                      <span className="text-xs text-muted-foreground">:00</span>
                    </div>
                    {editErrors.end && <p className="text-xs text-destructive">{editErrors.end}</p>}
                  </div>
                </div>
              </div>
              {editErrors.overlap && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs">{editErrors.overlap}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting || isUpdating}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 self-start"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleCancelEditDialog} disabled={isDeleting || isUpdating} size="sm" className="flex-1 sm:flex-initial">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={Object.keys(editErrors).length > 0 || !slotToEdit || (editedStartHour === slotToEdit.startHour && editedEndHour === slotToEdit.endHour) || isDeleting || isUpdating}
                size="sm"
                className="flex-1 sm:flex-initial"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LocationDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const { data: location, isLoading, isError } = useLocationById(locationId);
  const router = useRouter();
  const pathname = usePathname();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [currentImageAlt, setCurrentImageAlt] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (pathname.includes("/vouchers")) setActiveTab("vouchers");
    else if (pathname.includes("/missions")) setActiveTab("missions");
    else if (pathname.includes("/availability")) setActiveTab("availability");
    else if (pathname.includes("/booking-config")) setActiveTab("booking-config");
    else if (pathname.includes("/announcements")) setActiveTab("announcements");
    else if (pathname.includes("/edit")) setActiveTab("edit");
    else setActiveTab("overview");
  }, [pathname]);

  const heroImage = useMemo(
    () => location?.imageUrl?.[0] ?? "",
    [location?.imageUrl]
  );

  const totalCheckIns = useMemo(() => {
    const parsed = Number(location?.totalCheckIns ?? "0");
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [location?.totalCheckIns]);

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (isError || !location) {
    return (
      <div className="text-center py-20 text-red-500">
        Error loading location details.
      </div>
    );
  }

  const position = {
    lat: location.latitude,
    lng: location.longitude,
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="sr-only">Back</span>
        </Button>
        <p className="text-xs text-muted-foreground">Back to locations</p>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg">
        {heroImage && (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={location.name}
              className="h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/20" />
          </div>
        )}

        <div className="relative flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-white/35 backdrop-blur text-xs">
                  {location.isVisibleOnMap ? (
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      Visible on map
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <EyeOff className="h-3 w-3" />
                      Hidden from map
                    </span>
                  )}
                </Badge>
                <Badge variant="secondary" className="bg-white/35 backdrop-blur text-xs">
                  Created {formatDate(location.createdAt)}
                </Badge>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {location.name}
                </h1>
                <p className="mt-1.5 max-w-xl text-sm text-white/80">
                  {location.description || "No description provided for this location."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                <span>{location.addressLine}</span>
                <span>•</span>
                <span>
                  {location.addressLevel2}, {location.addressLevel1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-border/60 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="pb-3 pt-4 border-b bg-muted/20">
            <TabsList className="grid w-full grid-cols-7 h-auto p-1 bg-transparent">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Layers className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="vouchers" 
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Ticket className="h-3.5 w-3.5" />
                Vouchers
              </TabsTrigger>
              <TabsTrigger 
                value="missions" 
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Rocket className="h-3.5 w-3.5" />
                Missions
              </TabsTrigger>
              <TabsTrigger 
                value="availability" 
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Availability
              </TabsTrigger>
              <TabsTrigger 
                value="booking-config" 
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Booking
              </TabsTrigger>
              <TabsTrigger 
                value="announcements" 
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Megaphone className="h-3.5 w-3.5" />
                Announcements
              </TabsTrigger>
              <TabsTrigger 
                value="edit" 
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FilePenLine className="h-3.5 w-3.5" />
                Edit
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Total check-ins
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2 pt-0 pb-3">
                    <Users className="h-4 w-4 text-primary" />
                    <p className="text-xl font-semibold">{totalCheckIns.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Visibility status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2 pt-0 pb-3">
                    {location.isVisibleOnMap ? (
                      <>
                        <Eye className="h-4 w-4 text-emerald-500" />
                        <p className="text-sm font-semibold text-emerald-600">
                          Visible on map
                        </p>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold text-muted-foreground">
                          Hidden from map
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Service radius
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2 pt-0 pb-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">{location.radiusMeters} m</p>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      Last updated
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2 pt-0 pb-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold">
                      {formatDate(location.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* LEFT COLUMN: DETAILS */}
                <div className="space-y-4">
                  {/* Basic Information */}
                  <Card className="border-border/60 shadow-sm">
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Layers className="h-4 w-4" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 pb-4">
                      <InfoRow
                        label="Description"
                        value={location.description || "No description"}
                      />
                      <InfoRow
                        label="Category"
                        value={location.business?.category || "N/A"}
                      />
                      <InfoRow
                        label="Total Check-ins"
                        value={location.totalCheckIns || "0"}
                      />
                      <InfoRow
                        label="Visibility"
                        value={
                          location.isVisibleOnMap ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs">Visible on map</span>
                              <Eye className="h-3.5 w-3.5 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs">Hidden from map</span>
                              <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                          )
                        }
                      />
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  {location.tags && location.tags.length > 0 && (
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3 pt-4">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Tag className="h-4 w-4" />
                          Tags
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <DisplayTags tags={location.tags} maxCount={12} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Business Information */}
                  {location.business && (
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3 pt-4">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4" />
                          Business Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0 pb-4">
                        <div className="flex items-start gap-3">
                          {location.business.avatar && (
                            <img
                              src={location.business.avatar || "/placeholder.svg"}
                              alt={location.business.name}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {location.business.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {location.business.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t">
                          {location.business.email && (
                            <InfoRow
                              label="Email"
                              value={location.business.email}
                              icon={Mail}
                            />
                          )}
                          {location.business.phone && (
                            <InfoRow
                              label="Phone"
                              value={location.business.phone}
                              icon={Phone}
                            />
                          )}
                          {location.business.website && (
                            <InfoRow
                              label="Website"
                              value={
                                <a
                                  href={location.business.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  {location.business.website}
                                </a>
                              }
                              icon={Globe}
                            />
                          )}
                        </div>

                        {location.business.licenseNumber && (
                          <div className="space-y-2 pt-3 border-t">
                            <InfoRow
                              label="License Type"
                              value={location.business.licenseType}
                            />
                            <InfoRow
                              label="License Number"
                              value={location.business.licenseNumber}
                            />
                            <InfoRow
                              label="License Expiration"
                              value={formatDate(
                                location.business.licenseExpirationDate
                              )}
                            />
                          </div>
                        )}

                        <div className="pt-3 border-t">
                          <InfoRow
                            label="Status"
                            value={
                              <Badge
                                variant={
                                  location.business.status === "APPROVED"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {location.business.status}
                              </Badge>
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata */}
                  <Card className="border-border/60 shadow-sm">
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 pb-4">
                      <InfoRow label="Created" value={formatDate(location.createdAt)} />
                      <InfoRow
                        label="Last Updated"
                        value={formatDate(location.updatedAt)}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* RIGHT COLUMN: ADDRESS, MAP, AND STATS */}
                <div className="space-y-4">
                  {/* Address Information */}
                  <Card className="border-border/60 shadow-sm">
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 pb-4">
                      <InfoRow label="Address" value={location.addressLine} />
                      <InfoRow
                        label="District/Ward"
                        value={location.addressLevel1 || "N/A"}
                      />
                      <InfoRow
                        label="Province/City"
                        value={location.addressLevel2 || "N/A"}
                      />
                      <InfoRow label="Latitude" value={location.latitude} />
                      <InfoRow label="Longitude" value={location.longitude} />
                      <InfoRow
                        label="Service Radius"
                        value={`${location.radiusMeters} meters`}
                      />
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  {location.imageUrl && location.imageUrl.length > 0 && (
                    <Card className="border-border/60 shadow-sm">
                      <CardHeader className="pb-3 pt-4">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <ImageIcon className="h-4 w-4" />
                          Location Images
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {location.imageUrl.map((url, index) => (
                            <div key={index} className="flex flex-col gap-1">
                              <img
                                src={url || "/placeholder.svg"}
                                alt={`Location image ${index + 1}`}
                                onClick={() =>
                                  handleImageClick(url, `Location ${index + 1}`)
                                }
                                className="w-full h-24 object-cover rounded-md border cursor-pointer"
                              />
                              <p className="text-[10px] text-muted-foreground text-center">
                                Image {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Map */}
                  <Card className="border-border/60 shadow-sm sticky top-4">
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        Location Map
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 rounded-lg overflow-hidden pt-0 pb-4">
                      <GoogleMapsPicker
                        position={position}
                        onPositionChange={() => {}}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="vouchers" className="mt-0">
              <VouchersTab locationId={location.id} />
            </TabsContent>
            <TabsContent value="missions" className="mt-0">
              <MissionsTab locationId={location.id} />
            </TabsContent>
            <TabsContent value="availability" className="mt-0">
              <AvailabilityTab locationId={location.id} />
            </TabsContent>
            <TabsContent value="booking-config" className="mt-0">
              <BookingConfigTab locationId={location.id} />
            </TabsContent>
            <TabsContent value="announcements" className="mt-0">
              <AnnouncementsTab locationId={location.id} />
            </TabsContent>
            <TabsContent value="edit" className="mt-0">
              <EditLocationTab locationId={location.id} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}
