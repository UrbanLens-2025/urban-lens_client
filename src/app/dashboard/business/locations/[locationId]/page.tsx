'use client';

import { useLocationById } from '@/hooks/locations/useLocationById';
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
  QrCode,
  Download,
  Copy,
  Search,
  ArrowRight,
  AlertCircle,
  Share2,
  TrendingUp,
  Activity,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GoogleMapsPicker } from '@/components/shared/GoogleMapsPicker';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { use, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DisplayTags } from '@/components/shared/DisplayTags';
import React from 'react';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { useLocationVouchers } from '@/hooks/vouchers/useLocationVouchers';
import { useLocationMissions } from '@/hooks/missions/useLocationMissions';
import { useDeleteLocationVoucher } from '@/hooks/vouchers/useDeleteLocationVoucher';
import { useDeleteLocationMission } from '@/hooks/missions/useDeleteLocationMission';
import { useGenerateOneTimeQRCode } from '@/hooks/missions/useGenerateOneTimeQRCode';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Pencil,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Building2,
  Filter,
  ImagePlus,
  List,
  CalendarIcon,
  User,
  Zap,
  Ruler,
  Star,
  RotateCcw,
  Info,
  Settings,
} from 'lucide-react';
import type {
  LocationVoucher,
  LocationMission,
  SortState,
  Announcement,
} from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOwnerLocationBookingConfig } from '@/hooks/locations/useOwnerLocationBookingConfig';
import {
  useCreateLocationBookingConfig,
  useUpdateLocationBookingConfig,
} from '@/hooks/locations/useCreateLocationBookingConfig';
import { useMyLocations } from '@/hooks/locations/useMyLocations';
import type { UpdateLocationBookingConfigPayload } from '@/types';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUpdateLocation } from '@/hooks/locations/useUpdateLocation';
import { FileUpload } from '@/components/shared/FileUpload';
import { SingleFileUpload } from '@/components/shared/SingleFileUpload';
import { useAddTagsToLocation } from '@/hooks/tags/useAddTagsToLocation';
import { useRemoveTagsFromLocation } from '@/hooks/tags/useRemoveTagsFromLocation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateLocationVoucher } from '@/hooks/vouchers/useCreateLocationVoucher';
import { useUpdateLocationVoucher } from '@/hooks/vouchers/useUpdateLocationVoucher';
import { useLocationVoucherById } from '@/hooks/vouchers/useLocationVoucherById';
import { useCreateLocationMission } from '@/hooks/missions/useCreateLocationMission';
import { useUpdateLocationMission } from '@/hooks/missions/useUpdateLocationMission';
import { useLocationMissionById } from '@/hooks/missions/useLocationMissionById';
import { CreateLocationVoucherPayload } from '@/types';
import { useResolvedTags } from '@/hooks/tags/useResolvedTags';
import { LocationTagsSelector } from '@/components/locations/LocationTagsSelector';
import { useWeeklyAvailabilities } from '@/hooks/availability/useWeeklyAvailabilities';
import { useCreateWeeklyAvailability } from '@/hooks/availability/useCreateWeeklyAvailability';
import { useDeleteAvailability } from '@/hooks/availability/useDeleteAvailability';
import { useUpdateWeeklyAvailability } from '@/hooks/availability/useUpdateWeeklyAvailability';
import type { WeeklyAvailabilityResponse } from '@/api/availability';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { useDeleteAnnouncement } from '@/hooks/announcements/useDeleteAnnouncement';
import { useCreateAnnouncement } from '@/hooks/announcements/useCreateAnnouncement';
import { formatDateTime } from '@/lib/utils';
import { useLocationTabs } from '@/contexts/LocationTabContext';
import { X, CheckCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { StatCard } from '@/components/shared/StatCard';

// Helper function to format voucher type for display
const formatVoucherType = (voucherType: string): string => {
  const typeMap: Record<string, string> = {
    public: 'Free Voucher',
    mission_only: 'Exchange Voucher',
  };
  return (
    typeMap[voucherType] ||
    voucherType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useOwnerLocationBookings } from '@/hooks/locations/useOwnerLocationBookings';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
  isSameDay,
  isSameWeek,
  isSameMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  getDay,
  endOfWeek,
  endOfMonth,
} from 'date-fns';
import { CurrencyInfo } from '@/components/ui/currency-display';

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
    <div className='flex gap-2'>
      {Icon && (
        <Icon className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1'>
        <p className='text-xs font-semibold text-muted-foreground mb-0.5'>
          {label}
        </p>
        <div className='text-sm text-foreground'>{value}</div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Visualization Components
const COLORS = {
  active: 'hsl(142, 76%, 36%)',
  scheduled: 'hsl(38, 92%, 50%)',
  expired: 'hsl(0, 84%, 60%)',
  completed: 'hsl(217, 91%, 60%)',
  primary: 'hsl(var(--primary))',
};

// Vouchers Tab Component - Memoized for performance
const VouchersTab = React.memo(function VouchersTab({
  locationId,
}: {
  locationId: string;
}) {
  const { openVoucherCreateTab, openVoucherEditTab, openVoucherDetailTab } =
    useLocationTabs();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'scheduled' | 'expired'
  >('all');
  const [voucherToDelete, setVoucherToDelete] =
    useState<LocationVoucher | null>(null);

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

  const { mutate: deleteVoucher, isPending: isDeleting } =
    useDeleteLocationVoucher(locationId);

  const vouchers = response?.data || [];
  const meta = response?.meta;

  const getVoucherStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > now) return 'scheduled';
    if (end < now) return 'expired';
    return 'active';
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    const status = getVoucherStatus(startDate, endDate);
    if (status === 'scheduled') {
      return (
        <Badge
          variant='outline'
          className='border-amber-200 bg-amber-50 text-amber-700'
        >
          Scheduled
        </Badge>
      );
    }
    if (status === 'expired') {
      return (
        <Badge variant='secondary' className='bg-muted text-muted-foreground'>
          Expired
        </Badge>
      );
    }
    return <Badge className='bg-emerald-500/90 text-white'>Active</Badge>;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      return `${format(new Date(startDate), 'MMM d, yyyy')} → ${format(
        new Date(endDate),
        'MMM d, yyyy'
      )}`;
    } catch {
      return `${startDate} → ${endDate}`;
    }
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const status = getVoucherStatus(voucher.startDate, voucher.endDate);
      return statusFilter === 'all' || status === statusFilter;
    });
  }, [vouchers, statusFilter]);

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
      averagePrice: vouchers.length
        ? Math.round((counts.totalPrice / vouchers.length) * 10) / 10
        : 0,
    };
  }, [vouchers, meta]);

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === 'DESC'
          ? 'ASC'
          : 'DESC',
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === 'ASC' ? (
      <ArrowUp className='ml-2 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-2 h-4 w-4' />
    );
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
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/business/locations/${voucher.locationId}/vouchers/${voucher.id}`}
            >
              <EyeIcon className='mr-2 h-4 w-4' /> View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openVoucherEditTab(voucher.id, voucher.title)}
          >
            <Edit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setVoucherToDelete(voucher)}
            className='text-red-500'
          >
            <Trash2 className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-end'>
        <Button size='sm' onClick={openVoucherCreateTab}>
          <PlusCircle className='mr-2 h-4 w-4' />
          Create voucher
        </Button>
      </div>

      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <Card className='border-border/60 shadow-sm'>
          <CardHeader className='pb-2 pt-3'>
            <CardTitle className='text-xs font-medium text-muted-foreground'>
              Total vouchers
            </CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-2 pt-0 pb-3'>
            <Sparkles className='h-4 w-4 text-primary' />
            <p className='text-xl font-semibold'>
              {voucherStats.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className='border-border/60 shadow-sm'>
          <CardHeader className='pb-2 pt-3'>
            <CardTitle className='text-xs font-medium text-muted-foreground'>
              Active vouchers
            </CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-2 pt-0 pb-3'>
            <Target className='h-4 w-4 text-emerald-500' />
            <p className='text-xl font-semibold'>
              {voucherStats.active.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className='border-border/60 shadow-sm'>
          <CardHeader className='pb-2 pt-3'>
            <CardTitle className='text-xs font-medium text-muted-foreground'>
              Scheduled / Expired
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0 pb-3'>
            <p className='text-xl font-semibold'>
              {voucherStats.scheduled}/{voucherStats.expired}
            </p>
          </CardContent>
        </Card>
        <Card className='border-border/60 shadow-sm'>
          <CardHeader className='pb-2 pt-3'>
            <CardTitle className='text-xs font-medium text-muted-foreground'>
              Reward supply
            </CardTitle>
          </CardHeader>
          <CardContent className='flex items-center gap-2 pt-0 pb-3'>
            <TicketPercent className='h-4 w-4 text-amber-500' />
            <p className='text-xl font-semibold'>
              {voucherStats.totalSupply.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/60 shadow-sm'>
        <CardHeader className='pb-3 pt-4'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <CardTitle className='text-sm font-semibold'>
              Vouchers ({filteredVouchers.length}/{meta?.totalItems || 0})
            </CardTitle>
            <div className='flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center'>
              <Input
                placeholder='Search by code or title...'
                value={searchTerm}
                className='h-8 md:w-64'
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as typeof statusFilter)
                }
              >
                <SelectTrigger className='h-8 md:w-40'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='expired'>Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0 pb-4'>
          {isLoading && !response ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : isError ? (
            <div className='py-12 text-center text-red-500'>
              Failed to load vouchers.
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-border/60'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead className='min-w-[220px]'>Voucher</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        className='px-0 h-auto'
                        onClick={() => handleSort('pricePoint')}
                      >
                        Price (pts) <SortIcon column='pricePoint' />
                      </Button>
                    </TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        className='px-0 h-auto'
                        onClick={() => handleSort('createdAt')}
                      >
                        Created <SortIcon column='createdAt' />
                      </Button>
                    </TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length > 0 ? (
                    filteredVouchers.map((voucher) => (
                      <TableRow key={voucher.id} className='hover:bg-muted/20'>
                        <TableCell className='space-y-1'>
                          <div
                            className='flex items-start gap-3 cursor-pointer'
                            onClick={() =>
                              openVoucherDetailTab(voucher.id, voucher.title)
                            }
                          >
                            <div className='h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-muted'>
                              {voucher.imageUrl ? (
                                <img
                                  src={voucher.imageUrl}
                                  alt={voucher.title}
                                  className='h-full w-full object-cover'
                                />
                              ) : (
                                <div className='flex h-full w-full items-center justify-center text-[10px] text-muted-foreground'>
                                  No image
                                </div>
                              )}
                            </div>
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2'>
                                <span className='text-sm font-semibold leading-tight hover:text-primary transition-colors'>
                                  {voucher.title}
                                </span>
                                <Badge
                                  variant='outline'
                                  className='text-[10px]'
                                >
                                  {formatVoucherType(voucher.voucherType)}
                                </Badge>
                              </div>
                              {voucher.description && (
                                <p className='max-w-md text-xs text-muted-foreground line-clamp-2'>
                                  {voucher.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='space-y-1 text-xs text-muted-foreground'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-sm'>Code</span>
                            <Badge
                              variant='secondary'
                              className='bg-secondary text-secondary-foreground'
                            >
                              {voucher.voucherCode}
                            </Badge>
                          </div>
                          <div className='flex items-center gap-2'>
                            <CalendarDaysIcon className='h-3 w-3 text-muted-foreground' />
                            <span>
                              {formatDateRange(
                                voucher.startDate,
                                voucher.endDate
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>
                          {voucher.pricePoint.toLocaleString()} pts
                        </TableCell>
                        <TableCell className='font-medium'>
                          {voucher.maxQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(voucher.startDate, voucher.endDate)}
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {format(new Date(voucher.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className='text-right'>
                          <VoucherActions voucher={voucher} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className='h-32'>
                        <div className='flex flex-col items-center justify-center gap-2 py-6 text-center'>
                          <div className='text-sm font-semibold'>
                            No vouchers match your filters
                          </div>
                          <Button asChild size='sm'>
                            <Link
                              href={`/dashboard/business/locations/${locationId}/vouchers/create`}
                            >
                              <PlusCircle className='mr-2 h-4 w-4' />
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

      <div className='flex items-center justify-end space-x-2 py-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setPage(page - 1)}
          disabled={!meta || meta.currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setPage(page + 1)}
          disabled={!meta || meta.currentPage >= meta.totalPages}
        >
          Next
        </Button>
      </div>

      <AlertDialog
        open={!!voucherToDelete}
        onOpenChange={() => setVoucherToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this voucher?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the voucher:{' '}
              <strong className='ml-1'>
                &quot;{voucherToDelete?.title}&quot;
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Yes, Delete Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
VouchersTab.displayName = 'VouchersTab';

// Missions Tab Component - Memoized for performance
const MissionsTab = React.memo(({ locationId }: { locationId: string }) => {
  const { openMissionCreateTab, openMissionEditTab, openMissionDetailTab } =
    useLocationTabs();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const [missionToDelete, setMissionToDelete] =
    useState<LocationMission | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [generatedQRCode, setGeneratedQRCode] = useState<{
    qrCodeData: string;
    qrCodeUrl: string;
    expiresAt: string;
    id: string;
    isUsed: boolean;
  } | null>(null);

  const {
    data: response,
    isLoading,
    isError,
  } = useLocationMissions({
    locationId,
    page,
    sortBy: `${sort.column}:${sort.direction}`,
    search: debouncedSearchTerm,
  });

  const { mutate: deleteMission, isPending: isDeleting } =
    useDeleteLocationMission(locationId);
  const { mutate: generateQRCode, isPending: isGeneratingQR } =
    useGenerateOneTimeQRCode(locationId);

  const missions = response?.data || [];
  const meta = response?.meta;

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > now) {
      return (
        <Badge
          variant='outline'
          className='border-amber-200 bg-amber-50 text-amber-700'
        >
          Scheduled
        </Badge>
      );
    }
    if (end < now) {
      return (
        <Badge variant='secondary' className='bg-muted text-muted-foreground'>
          Completed
        </Badge>
      );
    }
    return <Badge className='bg-emerald-500/90 text-white'>Active</Badge>;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      return `${format(new Date(startDate), 'MMM d, yyyy')} → ${format(
        new Date(endDate),
        'MMM d, yyyy'
      )}`;
    } catch {
      return `${startDate} → ${endDate}`;
    }
  };

  const missionStats = useMemo(() => {
    if (!missions.length) {
      return {
        total: 0,
        active: 0,
        scheduled: 0,
        completed: 0,
        totalReward: 0,
      };
    }
    const now = new Date();
    let active = 0,
      scheduled = 0,
      completed = 0;
    const totalReward = missions.reduce(
      (sum, mission) => sum + (mission.reward ?? 0),
      0
    );
    missions.forEach((mission) => {
      const start = new Date(mission.startDate);
      const end = new Date(mission.endDate);
      if (start > now) scheduled += 1;
      else if (end < now) completed += 1;
      else active += 1;
    });
    return {
      total: meta?.totalItems ?? missions.length,
      active,
      scheduled,
      completed,
      totalReward,
    };
  }, [missions, meta]);

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === 'DESC'
          ? 'ASC'
          : 'DESC',
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === 'ASC' ? (
      <ArrowUp className='ml-2 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-2 h-4 w-4' />
    );
  };

  const onConfirmDelete = () => {
    if (!missionToDelete) return;
    deleteMission(missionToDelete.id, {
      onSuccess: () => setMissionToDelete(null),
    });
  };

  const handleGenerateQRCode = () => {
    generateQRCode(
      selectedMissionId ? { missionId: selectedMissionId } : undefined,
      {
        onSuccess: (data) => {
          setGeneratedQRCode({
            qrCodeData: data.qrCodeData,
            qrCodeUrl: data.qrCodeUrl,
            expiresAt: data.expiresAt,
            id: data.id,
            isUsed: data.isUsed,
          });
          toast.success('QR code generated successfully!');
        },
      }
    );
  };

  const handleCopyQRCode = () => {
    if (generatedQRCode?.qrCodeData) {
      navigator.clipboard.writeText(generatedQRCode.qrCodeData);
      toast.success('QR code data copied to clipboard!');
    }
  };

  const handleDownloadQRCode = () => {
    if (!generatedQRCode) return;

    // Generate QR code image from data using a QR code API service
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      generatedQRCode.qrCodeData
    )}`;

    const link = document.createElement('a');
    link.href = qrCodeImageUrl;
    link.download = `qr-code-${locationId}-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  const getQRCodeImageUrl = () => {
    if (!generatedQRCode) return null;

    // If qrCodeUrl is provided, use it; otherwise generate from qrCodeData
    if (generatedQRCode.qrCodeUrl) {
      return generatedQRCode.qrCodeUrl;
    }

    // Generate QR code image from data using a QR code API service
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      generatedQRCode.qrCodeData
    )}`;
  };

  function MissionActions({ mission }: { mission: LocationMission }) {
    const handleGenerateQRCodeForMission = () => {
      generateQRCode(
        { missionId: mission.id },
        {
          onSuccess: (data) => {
            setGeneratedQRCode({
              qrCodeData: data.qrCodeData,
              qrCodeUrl: data.qrCodeUrl,
              expiresAt: data.expiresAt,
              id: data.id,
              isUsed: data.isUsed,
            });
            toast.success('QR code generated successfully!');
          },
        }
      );
    };

    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}`}
            >
              <EyeIcon className='mr-2 h-4 w-4' /> View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openMissionEditTab(mission.id, mission.title)}
          >
            <Edit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleGenerateQRCodeForMission}
            disabled={isGeneratingQR}
          >
            {isGeneratingQR ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Generating...
              </>
            ) : (
              <>
                <QrCode className='mr-2 h-4 w-4' /> Generate QR Code
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setMissionToDelete(mission)}
            className='text-red-500'
          >
            <Trash2 className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Missions</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage and track your location missions
          </p>
        </div>
        <Button
          size='default'
          className='shrink-0'
          onClick={openMissionCreateTab}
        >
          <PlusCircle className='mr-2 h-4 w-4' />
          Create Mission
        </Button>
      </div>

      {/* Stats Overview */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <Card className='border-border/60 shadow-sm hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Missions
            </CardTitle>
            <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
              <Sparkles className='h-4 w-4 text-primary' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {missionStats.total.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {meta?.totalItems
                ? `of ${meta.totalItems} total`
                : 'All missions'}
            </p>
          </CardContent>
        </Card>
        <Card className='border-border/60 shadow-sm hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Active Missions
            </CardTitle>
            <div className='h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center'>
              <Target className='h-4 w-4 text-emerald-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-emerald-600'>
              {missionStats.active.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Currently running
            </p>
          </CardContent>
        </Card>
        <Card className='border-border/60 shadow-sm hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Scheduled / Completed
            </CardTitle>
            <div className='h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center'>
              <Clock className='h-4 w-4 text-amber-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              <span className='text-amber-600'>{missionStats.scheduled}</span>
              <span className='text-muted-foreground mx-1'>/</span>
              <span className='text-muted-foreground'>
                {missionStats.completed}
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Upcoming / Finished
            </p>
          </CardContent>
        </Card>
        <Card className='border-border/60 shadow-sm hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Rewards
            </CardTitle>
            <div className='h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center'>
              <Trophy className='h-4 w-4 text-amber-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-600'>
              {missionStats.totalReward.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Points available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Generator */}
      <Card className='border-border/60 shadow-sm bg-gradient-to-br from-background to-muted/20'>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <div className='h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center'>
              <QrCode className='h-5 w-5 text-primary' />
            </div>
            <div>
              <CardTitle className='text-base font-semibold'>
                Generate One-Time QR Code
              </CardTitle>
              <CardDescription className='text-xs mt-0.5'>
                Create a QR code for location check-ins or specific missions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
            <div className='flex-1'>
              <label className='text-xs font-medium text-muted-foreground mb-1.5 block'>
                Select Mission (Optional)
              </label>
              <Select
                value={selectedMissionId || 'all'}
                onValueChange={(value) =>
                  setSelectedMissionId(value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='All missions (general QR code)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    All missions (general QR code)
                  </SelectItem>
                  {missions.map((mission) => (
                    <SelectItem key={mission.id} value={mission.id}>
                      {mission.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerateQRCode}
              disabled={isGeneratingQR}
              className='h-10'
            >
              {isGeneratingQR ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className='mr-2 h-4 w-4' />
                  Generate QR Code
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Missions Table */}
      <Card className='border-border/60 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='text-lg font-semibold'>
                All Missions
              </CardTitle>
              <CardDescription className='text-sm mt-1'>
                {meta?.totalItems
                  ? `${meta.totalItems} mission${
                      meta.totalItems !== 1 ? 's' : ''
                    } total`
                  : 'Manage your location missions'}
              </CardDescription>
            </div>
            <div className='w-full sm:w-80'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search missions by title...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='h-10 pl-9'
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          {isLoading && !response ? (
            <div className='flex flex-col justify-center items-center py-16'>
              <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-3' />
              <p className='text-sm text-muted-foreground'>
                Loading missions...
              </p>
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center justify-center py-16 text-center'>
              <AlertCircle className='h-10 w-10 text-red-500 mb-3' />
              <p className='text-sm font-medium text-red-500 mb-1'>
                Failed to load missions
              </p>
              <p className='text-xs text-muted-foreground'>
                Please try refreshing the page
              </p>
            </div>
          ) : (
            <>
              <div className='overflow-hidden rounded-lg border border-border/60'>
                <Table>
                  <TableHeader className='bg-muted/50'>
                    <TableRow className='hover:bg-muted/50'>
                      <TableHead className='min-w-[240px]'>
                        <Button
                          variant='ghost'
                          className='px-0 h-auto font-semibold hover:bg-transparent'
                          onClick={() => handleSort('title')}
                        >
                          Mission <SortIcon column='title' />
                        </Button>
                      </TableHead>
                      <TableHead className='min-w-[180px]'>
                        <span className='font-semibold'>Details</span>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          className='px-0 h-auto font-semibold hover:bg-transparent'
                          onClick={() => handleSort('target')}
                        >
                          Target <SortIcon column='target' />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant='ghost'
                          className='px-0 h-auto font-semibold hover:bg-transparent'
                          onClick={() => handleSort('reward')}
                        >
                          Reward <SortIcon column='reward' />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <span className='font-semibold'>Status</span>
                      </TableHead>
                      <TableHead className='text-right w-[80px]'>
                        <span className='font-semibold'>Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missions.length > 0 ? (
                      missions.map((mission) => (
                        <TableRow
                          key={mission.id}
                          className='hover:bg-muted/30 transition-colors'
                        >
                          <TableCell className='py-4'>
                            <div
                              className='space-y-1.5 cursor-pointer'
                              onClick={() =>
                                openMissionDetailTab(mission.id, mission.title)
                              }
                            >
                              <div className='flex items-center gap-2.5'>
                                <span className='font-semibold text-sm hover:text-primary transition-colors'>
                                  {mission.title}
                                </span>
                                <Badge
                                  variant='outline'
                                  className='text-[10px] px-1.5 py-0.5 font-medium'
                                >
                                  {mission.metric}
                                </Badge>
                              </div>
                              {mission.description && (
                                <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                                  {mission.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='py-4'>
                            <div className='space-y-1.5 text-xs'>
                              <div className='flex items-center gap-1.5 text-muted-foreground'>
                                <Target className='h-3.5 w-3.5' />
                                <span className='capitalize'>
                                  {mission.metric
                                    ?.split('_')
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1).toLowerCase()
                                    )
                                    .join(' ')}
                                </span>
                              </div>
                              <div className='flex items-center gap-1.5 text-muted-foreground'>
                                <CalendarDays className='h-3.5 w-3.5' />
                                <span>
                                  {formatDateRange(
                                    mission.startDate,
                                    mission.endDate
                                  )}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='py-4'>
                            <div className='font-semibold text-sm'>
                              {mission.target.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className='py-4'>
                            <div className='flex items-center gap-1.5'>
                              <Trophy className='h-4 w-4 text-amber-500' />
                              <span className='font-semibold text-sm text-amber-600'>
                                {mission.reward.toLocaleString()}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                pts
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='py-4'>
                            {getStatusBadge(mission.startDate, mission.endDate)}
                          </TableCell>
                          <TableCell className='text-right py-4'>
                            <MissionActions mission={mission} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className='h-64'>
                          <div className='flex flex-col items-center justify-center gap-4 py-12 text-center'>
                            <div className='h-16 w-16 rounded-full bg-muted flex items-center justify-center'>
                              <Target className='h-8 w-8 text-muted-foreground' />
                            </div>
                            <div className='space-y-1'>
                              <p className='text-base font-semibold'>
                                No missions found
                              </p>
                              <p className='text-sm text-muted-foreground max-w-sm'>
                                {searchTerm
                                  ? 'Try adjusting your search terms or create a new mission'
                                  : 'Get started by creating your first mission to engage with your customers'}
                              </p>
                            </div>
                            <Button asChild size='default'>
                              <Link
                                href={`/dashboard/business/locations/${locationId}/missions/create`}
                              >
                                <PlusCircle className='mr-2 h-4 w-4' />
                                Create Your First Mission
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className='flex items-center justify-between pt-4 border-t mt-4'>
                  <div className='text-sm text-muted-foreground'>
                    Showing{' '}
                    <span className='font-medium text-foreground'>
                      {(meta.currentPage - 1) * meta.itemsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className='font-medium text-foreground'>
                      {Math.min(
                        meta.currentPage * meta.itemsPerPage,
                        meta.totalItems
                      )}
                    </span>{' '}
                    of{' '}
                    <span className='font-medium text-foreground'>
                      {meta.totalItems}
                    </span>{' '}
                    missions
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page - 1)}
                      disabled={!meta || meta.currentPage <= 1}
                      className='h-9'
                    >
                      <ArrowLeft className='mr-1 h-4 w-4' />
                      Previous
                    </Button>
                    <div className='flex items-center gap-1'>
                      {Array.from(
                        { length: Math.min(5, meta.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (meta.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (meta.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (meta.currentPage >= meta.totalPages - 2) {
                            pageNum = meta.totalPages - 4 + i;
                          } else {
                            pageNum = meta.currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                meta.currentPage === pageNum
                                  ? 'default'
                                  : 'outline'
                              }
                              size='sm'
                              onClick={() => setPage(pageNum)}
                              className='h-9 w-9 p-0'
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page + 1)}
                      disabled={!meta || meta.currentPage >= meta.totalPages}
                      className='h-9'
                    >
                      Next
                      <ArrowRight className='ml-1 h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!missionToDelete}
        onOpenChange={() => setMissionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this mission?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mission:{' '}
              <strong className='ml-1'>
                &quot;{missionToDelete?.title}&quot;
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Yes, Delete Mission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Display Dialog */}
      <Dialog
        open={!!generatedQRCode}
        onOpenChange={(open) => !open && setGeneratedQRCode(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <QrCode className='h-5 w-5' />
              One-Time QR Code
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex justify-center p-4 bg-muted/30 rounded-lg'>
              {generatedQRCode && getQRCodeImageUrl() && (
                <img
                  src={getQRCodeImageUrl() || ''}
                  alt='QR Code'
                  className='w-64 h-64 object-contain'
                />
              )}
            </div>
            {generatedQRCode && (
              <>
                <div className='space-y-2'>
                  <label className='text-xs font-medium text-muted-foreground'>
                    QR Code Data
                  </label>
                  <div className='flex items-center gap-2 p-2 bg-muted/30 rounded-md'>
                    <code className='flex-1 text-xs break-all'>
                      {generatedQRCode.qrCodeData}
                    </code>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={handleCopyQRCode}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <div className='space-y-2 text-xs'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Expires at:</span>
                    <span className='font-medium'>
                      {new Date(generatedQRCode.expiresAt).toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Status:</span>
                    <Badge
                      variant={
                        generatedQRCode.isUsed ? 'destructive' : 'default'
                      }
                    >
                      {generatedQRCode.isUsed ? 'Used' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </>
            )}
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={handleDownloadQRCode}
              >
                <Download className='mr-2 h-4 w-4' />
                Download
              </Button>
              <Button
                variant='outline'
                className='flex-1'
                onClick={handleCopyQRCode}
              >
                <Copy className='mr-2 h-4 w-4' />
                Copy Data
              </Button>
            </div>
            <p className='text-xs text-muted-foreground text-center'>
              This is a one-time use QR code. It will expire after being scanned
              once.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
MissionsTab.displayName = 'MissionsTab';

// Booking Config Tab Component
const bookingConfigSchema = z
  .object({
    allowBooking: z.boolean(),
    baseBookingPrice: z
      .number()
      .positive('Base booking price must be greater than 0')
      .min(0.01, 'Base booking price must be at least 0.01'),
    currency: z.literal('VND'),
    minBookingDurationMinutes: z
      .number()
      .int('Must be a whole number')
      .positive('Must be greater than 0')
      .min(1, 'Minimum duration must be at least 1 minute'),
    maxBookingDurationMinutes: z
      .number()
      .int('Must be a whole number')
      .positive('Must be greater than 0'),
    minGapBetweenBookingsMinutes: z
      .number()
      .int('Must be a whole number')
      .min(0, 'Minimum gap cannot be negative'),
    maxCapacity: z
      .number()
      .int('Must be a whole number')
      .positive('Must be greater than 0')
      .optional(),
    refundEnabled: z.boolean().optional(),
    refundCutoffHours: z
      .number()
      .int('Must be a whole number')
      .min(0, 'Cannot be negative')
      .optional(),
    refundPercentageAfterCutoff: z
      .number()
      .min(0, 'Cannot be negative')
      .max(1, 'Cannot exceed 1 (100%)')
      .optional(),
    refundPercentageBeforeCutoff: z
      .number()
      .min(0, 'Cannot be negative')
      .max(1, 'Cannot exceed 1 (100%)')
      .optional(),
  })
  .refine(
    (data) => data.maxBookingDurationMinutes >= data.minBookingDurationMinutes,
    {
      message:
        'Maximum duration must be greater than or equal to minimum duration',
      path: ['maxBookingDurationMinutes'],
    }
  );

type BookingConfigForm = z.infer<typeof bookingConfigSchema>;

// Memoized currency formatter
const formatCurrency = (amount: number, currency: string) => {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Memoized Preview Card Component
const BookingPreviewCard = React.memo(
  ({
    allowBooking,
    basePrice,
    currency,
    minDuration,
    maxDuration,
    gapMinutes,
  }: {
    allowBooking: boolean;
    basePrice: number;
    currency: string;
    minDuration: number;
    maxDuration: number;
    gapMinutes: number;
  }) => {
    const formattedPrice = useMemo(
      () => formatCurrency(basePrice, currency),
      [basePrice, currency]
    );

    return (
      <Card className='border-border/60 shadow-sm sticky top-4'>
        <CardHeader className='pb-3 pt-4'>
          <CardTitle className='flex items-center gap-2 text-sm'>
            <CalendarDaysIcon className='h-4 w-4' />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 pt-0 pb-4'>
          <div className='space-y-2'>
            <div>
              <Label className='text-xs text-muted-foreground'>Status</Label>
              <p className='text-sm font-semibold'>
                {allowBooking ? (
                  <span className='text-green-600'>Booking Enabled</span>
                ) : (
                  <span className='text-gray-500'>Booking Disabled</span>
                )}
              </p>
            </div>

            <div>
              <Label className='text-xs text-muted-foreground'>
                Base Price
              </Label>
              <p className='text-xl font-bold'>{formattedPrice}</p>
              <p className='text-xs text-muted-foreground'>
                per {minDuration} minutes
              </p>
            </div>

            <div className='border-t pt-3 space-y-1.5'>
              <div className='flex justify-between text-xs'>
                <span className='text-muted-foreground'>Min Duration</span>
                <span className='font-medium'>{minDuration} min</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-muted-foreground'>Max Duration</span>
                <span className='font-medium'>{maxDuration} min</span>
              </div>
              <div className='flex justify-between text-xs'>
                <span className='text-muted-foreground'>Gap Required</span>
                <span className='font-medium'>{gapMinutes} min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
BookingPreviewCard.displayName = 'BookingPreviewCard';

function BookingConfigTab({ locationId }: { locationId: string }) {
  const {
    data: existingConfig,
    isLoading: isLoadingConfig,
    error: configError,
  } = useOwnerLocationBookingConfig(locationId);
  const { data: availabilities, isLoading: isLoadingAvailabilities } =
    useWeeklyAvailabilities(locationId);
  const createConfig = useCreateLocationBookingConfig();
  const updateConfig = useUpdateLocationBookingConfig();

  // Check if availability is configured
  const hasAvailability = useMemo(() => {
    return availabilities && availabilities.length > 0;
  }, [availabilities]);

  const form = useForm<BookingConfigForm>({
    resolver: zodResolver(bookingConfigSchema),
    defaultValues: {
      allowBooking: true,
      baseBookingPrice: 0,
      currency: 'VND',
      minBookingDurationMinutes: 30,
      maxBookingDurationMinutes: 240,
      minGapBetweenBookingsMinutes: 15,
      maxCapacity: undefined,
      refundEnabled: false,
      refundCutoffHours: 24,
      refundPercentageAfterCutoff: 0.8,
      refundPercentageBeforeCutoff: 1,
    },
  });

  // Memoize hasConfig to avoid recalculation
  const hasConfig = useMemo(
    () => existingConfig && !configError,
    [existingConfig, configError]
  );
  const isSubmitting = createConfig.isPending || updateConfig.isPending;

  // Create a stable key from config properties to track changes
  const configKey = useMemo(() => {
    if (!existingConfig) return null;
    return `${existingConfig.locationId}-${existingConfig.allowBooking}-${existingConfig.baseBookingPrice}-${existingConfig.currency}-${existingConfig.minBookingDurationMinutes}-${existingConfig.maxBookingDurationMinutes}-${existingConfig.minGapBetweenBookingsMinutes}`;
  }, [existingConfig]);

  // Only reset form when config actually changes
  useEffect(() => {
    if (existingConfig && !configError && configKey) {
      form.reset(
        {
          allowBooking: existingConfig.allowBooking,
          baseBookingPrice: parseFloat(existingConfig.baseBookingPrice),
          currency: 'VND',
          minBookingDurationMinutes: existingConfig.minBookingDurationMinutes,
          maxBookingDurationMinutes: existingConfig.maxBookingDurationMinutes,
          minGapBetweenBookingsMinutes:
            existingConfig.minGapBetweenBookingsMinutes,
          maxCapacity: existingConfig.maxCapacity,
          refundEnabled: existingConfig.refundEnabled ?? false,
          refundCutoffHours: existingConfig.refundCutoffHours ?? 24,
          refundPercentageAfterCutoff:
            existingConfig.refundPercentageAfterCutoff ?? 0.8,
          refundPercentageBeforeCutoff:
            existingConfig.refundPercentageBeforeCutoff ?? 1,
        },
        { keepDefaultValues: false }
      );
    }
  }, [configKey, configError, form]); // Only reset when config key changes

  const onSubmit = useCallback(
    (data: BookingConfigForm) => {
      if (hasConfig && existingConfig) {
        const updatePayload: UpdateLocationBookingConfigPayload = {
          allowBooking: data.allowBooking,
          baseBookingPrice: data.baseBookingPrice,
          currency: 'VND',
          minBookingDurationMinutes: data.minBookingDurationMinutes,
          maxBookingDurationMinutes: data.maxBookingDurationMinutes,
          minGapBetweenBookingsMinutes: data.minGapBetweenBookingsMinutes,
          maxCapacity: data.maxCapacity,
          refundEnabled: data.refundEnabled,
          refundCutoffHours: data.refundCutoffHours,
          refundPercentageAfterCutoff: data.refundPercentageAfterCutoff,
          refundPercentageBeforeCutoff: data.refundPercentageBeforeCutoff,
        };
        updateConfig.mutate({
          configId: existingConfig.id || locationId, // Use config ID if available, fallback to locationId
          locationId,
          payload: updatePayload,
        });
      } else {
        createConfig.mutate({
          locationId,
          ...data,
          currency: 'VND',
        });
      }
    },
    [hasConfig, locationId, updateConfig, createConfig]
  );

  // Watch form values with debouncing for preview
  const watchedValues = form.watch();
  const {
    baseBookingPrice,
    currency,
    minBookingDurationMinutes,
    maxBookingDurationMinutes,
    allowBooking,
    minGapBetweenBookingsMinutes,
  } = watchedValues;

  if (isLoadingConfig) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='lg:col-span-2 space-y-4'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <Card className='border-border/60 shadow-sm'>
                <CardHeader className='pb-3 pt-4'>
                  <CardTitle className='flex items-center gap-2 text-sm'>
                    <DollarSign className='h-4 w-4' />
                    Booking Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4 pt-0 pb-4'>
                  <FormField
                    control={form.control}
                    name='allowBooking'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                        <div className='space-y-0.5'>
                          <FormLabel className='text-sm'>
                            Allow Booking
                          </FormLabel>
                          <FormDescription className='text-xs'>
                            Enable or disable booking for this location
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className='space-y-3'>
                    <h3 className='text-sm font-semibold'>Pricing</h3>
                    <div className='grid grid-cols-2 gap-3'>
                      <FormField
                        control={form.control}
                        name='baseBookingPrice'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Base Booking Price (VND)/hour
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                step='0.01'
                                min='0.01'
                                placeholder='0.00'
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className='h-8'
                              />
                            </FormControl>
                            <FormDescription className='text-xs'>
                              Base price for minimum booking duration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Duration Settings - Hidden */}
                  {false && (
                    <div className='space-y-3'>
                      <h3 className='text-sm font-semibold flex items-center gap-2'>
                        <Clock className='h-4 w-4' />
                        Duration Settings
                      </h3>

                      <div className='grid grid-cols-2 gap-3'>
                        <FormField
                          control={form.control}
                          name='minBookingDurationMinutes'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Minimum Duration (minutes)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='1'
                                  placeholder='30'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className='h-8'
                                />
                              </FormControl>
                              <FormDescription className='text-xs'>
                                Minimum booking duration in minutes
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='maxBookingDurationMinutes'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Maximum Duration (minutes)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='1'
                                  placeholder='240'
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className='h-8'
                                />
                              </FormControl>
                              <FormDescription className='text-xs'>
                                Maximum booking duration in minutes
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name='minGapBetweenBookingsMinutes'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Minimum Gap Between Bookings (minutes)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min='0'
                                placeholder='15'
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                                className='h-8'
                              />
                            </FormControl>
                            <FormDescription className='text-xs'>
                              Minimum time required between consecutive bookings
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className='space-y-3 pt-3 border-t'>
                    <h3 className='text-sm font-semibold flex items-center gap-2'>
                      <Users className='h-4 w-4' />
                      Capacity
                    </h3>
                    <FormField
                      control={form.control}
                      name='maxCapacity'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-xs'>
                            Maximum Capacity
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min='1'
                              placeholder='100'
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
                                )
                              }
                              className='h-8'
                            />
                          </FormControl>
                          <FormDescription className='text-xs'>
                            Maximum number of participants allowed (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='space-y-3 pt-3 border-t'>
                    <h3 className='text-sm font-semibold flex items-center gap-2'>
                      <RotateCcw className='h-4 w-4' />
                      Refund Settings
                    </h3>
                    <FormField
                      control={form.control}
                      name='refundEnabled'
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                          <div className='space-y-0.5'>
                            <FormLabel className='text-sm'>
                              Enable Refunds
                            </FormLabel>
                            <FormDescription className='text-xs'>
                              Allow customers to receive refunds for
                              cancellations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className='space-y-3 pt-3 border-t'>
                      <Alert className='bg-primary/5 border-primary/20'>
                        <Info className='h-4 w-4 text-primary' />
                        <AlertDescription className='text-xs'>
                          Configure refund percentages based on cancellation
                          timing
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={form.control}
                        name='refundCutoffHours'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-xs'>
                              Refund Cutoff (hours)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min='0'
                                placeholder='24'
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                                className='h-8'
                              />
                            </FormControl>
                            <FormDescription className='text-xs'>
                              Hours before booking start time for refund cutoff
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='grid grid-cols-2 gap-3'>
                        <FormField
                          control={form.control}
                          name='refundPercentageBeforeCutoff'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Refund % Before Cutoff
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.1'
                                  min='0'
                                  max='1'
                                  placeholder='0.9'
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined
                                    )
                                  }
                                  className='h-8'
                                />
                              </FormControl>
                              <FormDescription className='text-xs'>
                                Refund percentage (0-1) before cutoff time
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='refundPercentageAfterCutoff'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-xs'>
                                Refund % After Cutoff
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.1'
                                  min='0'
                                  max='1'
                                  placeholder='0.8'
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined
                                    )
                                  }
                                  className='h-8'
                                />
                              </FormControl>
                              <FormDescription className='text-xs'>
                                Refund percentage (0-1) after cutoff time
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className='flex justify-end gap-2 pt-3 border-t'>
                    <Button
                      type='submit'
                      disabled={isSubmitting}
                      size='sm'
                      className='h-8'
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className='mr-2 h-3.5 w-3.5' />
                          {hasConfig
                            ? 'Update Configuration'
                            : 'Create Configuration'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className='lg:col-span-1'>
          <BookingPreviewCard
            allowBooking={allowBooking}
            basePrice={baseBookingPrice}
            currency={currency}
            minDuration={minBookingDurationMinutes}
            maxDuration={maxBookingDurationMinutes}
            gapMinutes={minGapBetweenBookingsMinutes}
          />
        </div>
      </div>
    </div>
  );
}

// Edit Location Tab Component
const updateLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.array(z.string().url()).min(1, 'At least one image is required'),
  isVisibleOnMap: z.boolean().optional(),
  tagIds: z.array(z.number()).min(1, 'At least one tag is required'),
});
type FormValues = z.infer<typeof updateLocationSchema>;

function EditLocationTab({ locationId }: { locationId: string }) {
  const queryClient = useQueryClient();
  const { data: location, isLoading: isLoadingData } =
    useLocationById(locationId);
  const { mutateAsync: updateLocation, isPending: isUpdating } =
    useUpdateLocation();
  const { mutateAsync: addTags, isPending: isAddingTags } =
    useAddTagsToLocation();
  const { mutateAsync: removeTags, isPending: isRemovingTags } =
    useRemoveTagsFromLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(updateLocationSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
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

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!location) return;

      try {
        const {
          name,
          description,
          imageUrl,
          isVisibleOnMap,
          tagIds: newTagIds,
        } = values;
        const mainPayload = {
          name,
          description,
          imageUrl,
          isVisibleOnMap: isVisibleOnMap ?? false,
          tagIds: newTagIds,
        };

        const originalTagIds = location.tags.map((t) => t.id);
        const tagsToAdd = newTagIds.filter(
          (id) => !originalTagIds.includes(id)
        );
        const tagsToRemove = originalTagIds.filter(
          (id) => !newTagIds.includes(id)
        );

        const mutationPromises = [];
        mutationPromises.push(
          updateLocation({ locationId, payload: mainPayload })
        );

        if (tagsToAdd.length > 0) {
          mutationPromises.push(addTags({ locationId, tagIds: tagsToAdd }));
        }

        if (tagsToRemove.length > 0) {
          mutationPromises.push(
            removeTags({ locationId, tagIds: tagsToRemove })
          );
        }

        await Promise.all(mutationPromises);
        queryClient.invalidateQueries({ queryKey: ['myLocations'] });
        queryClient.invalidateQueries({ queryKey: ['location', locationId] });
      } catch (err) {
        toast.error('An error occurred while saving. Please try again.');
      }
    },
    [location, locationId, updateLocation, addTags, removeTags, queryClient]
  );

  if (isLoadingData) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }
  if (!location) {
    return <div>Location not found.</div>;
  }

  return (
    <div className='space-y-4'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <Card className='border-border/60 shadow-sm'>
            <CardHeader className='pb-3 pt-4'>
              <CardTitle className='flex items-center gap-2 text-sm'>
                <Tag className='h-4 w-4' />
                Core details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-0 pb-4'>
              <FormField
                name='name'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Location name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Skyline Rooftop Venue'
                        {...field}
                        className='h-8'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='description'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder='Describe the ambiance, capacity, and unique features guests should know.'
                        {...field}
                        className='text-sm resize-none'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='tagIds'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-xs'>Tags</FormLabel>
                    <FormControl>
                      <LocationTagsSelector
                        value={field.value}
                        onChange={(ids) => field.onChange(ids)}
                        error={form.formState.errors.tagIds?.message}
                        helperText='Select the location type and other relevant categories.'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='rounded-lg border border-dashed border-border/60 bg-muted/20 p-2'>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2'>
                  Selected tag categories
                </p>
                <div>
                  {tags.length > 0 ? (
                    <DisplayTags tags={tags} maxCount={10} />
                  ) : (
                    <p className='text-xs text-muted-foreground'>
                      No tags selected yet.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-sm'>
            <CardHeader className='pb-3 pt-4'>
              <CardTitle className='flex items-center gap-2 text-sm'>
                <ImagePlus className='h-4 w-4' />
                Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4'>
              <FormField
                name='imageUrl'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-sm'>
            <CardHeader className='pb-3 pt-4'>
              <CardTitle className='text-sm'>Visibility & publishing</CardTitle>
            </CardHeader>
            <CardContent className='pt-0 pb-4'>
              <FormField
                name='isVisibleOnMap'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border border-border/60 bg-muted/10 p-3'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-xs'>Visible on map</FormLabel>
                      <p className='text-xs text-muted-foreground'>
                        Toggle off if you want to temporarily hide this location
                        from creators.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className='mt-3 flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground'>
                {watchedValues.isVisibleOnMap ? (
                  <>
                    <Eye className='h-3.5 w-3.5 text-emerald-500' />
                    <span>
                      This location will appear in venue search results.
                    </span>
                  </>
                ) : (
                  <>
                    <EyeOff className='h-3.5 w-3.5' />
                    <span>
                      This location is hidden and only accessible via direct
                      links.
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className='flex flex-col-reverse items-stretch gap-2 border-t pt-3 sm:flex-row sm:justify-end'>
            <Button
              type='submit'
              disabled={!isDirty || isUpdating}
              size='sm'
              className='h-8 sm:min-w-[140px]'
            >
              {isUpdating ? (
                <>
                  <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
                  Saving…
                </>
              ) : (
                <>
                  <Save className='mr-2 h-3.5 w-3.5' />
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

// Create Announcement Form Component
const announcementCreateSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z
    .string()
    .min(10, 'Description should be at least 10 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  imageUrl: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
  isHidden: z.boolean(),
});

function CreateAnnouncementForm({
  locationId,
  locationName,
  onSuccess,
}: {
  locationId: string;
  locationName: string;
  onSuccess: () => void;
}) {
  const { mutate: createAnnouncement, isPending } = useCreateAnnouncement();
  const { closeAnnouncementCreateTab } = useLocationTabs();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof announcementCreateSchema>>({
    resolver: zodResolver(announcementCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      imageUrl: '',
      isHidden: false,
    },
  });

  const onSubmit = (values: z.infer<typeof announcementCreateSchema>) => {
    createAnnouncement(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        imageUrl: values.imageUrl?.trim() ? values.imageUrl.trim() : undefined,
        isHidden: values.isHidden,
        locationId,
      },
      {
        onSuccess: () => {
          toast.success('Announcement created successfully');
          queryClient.invalidateQueries({ queryKey: ['announcements'] });
          onSuccess(); // Set active tab first
          closeAnnouncementCreateTab(); // Then close create tab
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to create announcement');
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Megaphone className='h-5 w-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <FormField
              name='title'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Announcement headline'
                      className='h-11'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Share the announcement details'
                      rows={6}
                      className='resize-none'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                name='startDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        {...field}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='endDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        {...field}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name='isHidden'
              control={form.control}
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel>Hide announcement</FormLabel>
                    <p className='text-xs text-muted-foreground'>
                      Hidden announcements will not appear to visitors until you
                      publish them.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name='imageUrl'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image (optional)</FormLabel>
                  <FormControl>
                    <SingleFileUpload
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={closeAnnouncementCreateTab}
          >
            Cancel
          </Button>
          <Button type='submit' size='lg' disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create Announcement
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Announcements Tab Component
function AnnouncementsTab({ locationId }: { locationId: string }) {
  const { openAnnouncementDetailTab, openAnnouncementCreateTab } =
    useLocationTabs();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('startDate:DESC');
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);
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

  const { mutate: deleteAnnouncement, isPending: isDeleting } =
    useDeleteAnnouncement();

  const announcements = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = () => {
    if (!announcementToDelete) return;
    deleteAnnouncement(announcementToDelete.id, {
      onSuccess: () => setAnnouncementToDelete(null),
    });
  };

  const renderPublishWindow = (announcement: Announcement) => {
    const start = announcement.startDate
      ? formatDateTime(announcement.startDate)
      : '—';
    const end = announcement.endDate
      ? formatDateTime(announcement.endDate)
      : '—';
    return (
      <div className='text-xs text-muted-foreground space-y-0.5'>
        <p>
          <span className='font-medium'>Starts:</span> {start}
        </p>
        <p>
          <span className='font-medium'>Ends:</span> {end}
        </p>
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-end'>
        <Button size='sm' onClick={openAnnouncementCreateTab}>
          <PlusCircle className='mr-2 h-4 w-4' />
          Create announcement
        </Button>
      </div>

      <Card className='border-border/60 shadow-sm'>
        <CardHeader className='pb-3 pt-4'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <CardTitle className='text-sm font-semibold'>
              Announcements
            </CardTitle>
            <div className='flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center'>
              <Input
                placeholder='Search announcements...'
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className='h-8 md:w-64'
              />
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='h-8 md:w-48'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='startDate:DESC'>
                    Start date (newest)
                  </SelectItem>
                  <SelectItem value='startDate:ASC'>
                    Start date (oldest)
                  </SelectItem>
                  <SelectItem value='createdAt:DESC'>
                    Created (newest)
                  </SelectItem>
                  <SelectItem value='createdAt:ASC'>
                    Created (oldest)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0 pb-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-12 text-muted-foreground'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : isError ? (
            <div className='py-12 text-center text-sm text-destructive'>
              Failed to load announcements. Please try again shortly.
            </div>
          ) : announcements.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-12 text-center'>
              <Megaphone className='h-8 w-8 text-muted-foreground/70' />
              <div>
                <p className='text-sm font-semibold'>No announcements yet</p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Create your first announcement to keep visitors informed.
                </p>
              </div>
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-border/60'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead>Announcement</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow
                      key={announcement.id}
                      className='hover:bg-muted/20'
                    >
                      <TableCell>
                        <div
                          className='flex items-start gap-3 cursor-pointer'
                          onClick={() =>
                            openAnnouncementDetailTab(
                              announcement.id,
                              announcement.title
                            )
                          }
                        >
                          {announcement.imageUrl ? (
                            <img
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              className='h-12 w-16 flex-shrink-0 rounded-md border object-cover'
                            />
                          ) : (
                            <div className='flex h-12 w-16 flex-shrink-0 items-center justify-center rounded-md border border-dashed text-[10px] text-muted-foreground'>
                              No image
                            </div>
                          )}
                          <div>
                            <div className='flex items-center gap-2'>
                              <span className='font-semibold text-sm leading-tight hover:text-primary transition-colors'>
                                {announcement.title}
                              </span>
                            </div>
                            <p className='text-xs text-muted-foreground line-clamp-2 mt-1'>
                              {announcement.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{renderPublishWindow(announcement)}</TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className='border-border bg-muted/40 text-muted-foreground text-xs'
                        >
                          {announcement.isHidden ? 'Hidden' : 'Visible'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='text-xs text-muted-foreground'>
                          <p>
                            Created {formatDateTime(announcement.createdAt)}
                          </p>
                          <p>
                            Updated {formatDateTime(announcement.updatedAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button size='sm' asChild className='h-7 text-xs'>
                            <Link
                              href={`/dashboard/business/locations/${locationId}/announcements/${announcement.id}/edit`}
                            >
                              Manage
                            </Link>
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='text-destructive h-7 text-xs'
                            onClick={() =>
                              setAnnouncementToDelete(announcement)
                            }
                            disabled={
                              isDeleting &&
                              announcementToDelete?.id === announcement.id
                            }
                          >
                            {isDeleting &&
                            announcementToDelete?.id === announcement.id ? (
                              <Loader2 className='h-3.5 w-3.5 animate-spin' />
                            ) : (
                              <>
                                <Trash2 className='mr-1.5 h-3.5 w-3.5' /> Delete
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

        <div className='flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground'>
          <div>
            {meta ? (
              <span>
                Showing page {meta.currentPage} of {meta.totalPages} (
                {meta.totalItems} total)
              </span>
            ) : (
              <span>No data</span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!meta || meta.currentPage <= 1 || isFetching}
              className='h-7 text-xs'
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setPage((prev) =>
                  meta ? Math.min(meta.totalPages, prev + 1) : prev + 1
                )
              }
              disabled={
                !meta || meta.currentPage >= meta.totalPages || isFetching
              }
              className='h-7 text-xs'
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog
        open={!!announcementToDelete}
        onOpenChange={(open) => !open && setAnnouncementToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement
              {announcementToDelete && ` "${announcementToDelete.title}"`} will
              be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='mr-2 h-4 w-4' />
              )}
              Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Booking & Availability Tab Component with Subtabs
function BookingAndAvailabilityTab({ locationId }: { locationId: string }) {
  const [subTab, setSubTab] = useState('current');

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <div className='flex items-center gap-2 text-lg font-semibold'>
          <MapPin className='h-5 w-5 text-primary' />
          <span>Venue Booking</span>
        </div>
        <p className='text-sm text-muted-foreground'>
          Current booking status and venue details
        </p>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab} className='w-full'>
        <TabsList className='grid w-full max-w-md grid-cols-3'>
          <TabsTrigger value='current'>Current Booking</TabsTrigger>
          <TabsTrigger value='history'>
            <List className='h-4 w-4 mr-2' />
            Booking History
          </TabsTrigger>
          <TabsTrigger value='settings'>
            <Settings className='h-4 w-4 mr-2' />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value='current' className='mt-6'>
          <CurrentBookingTab locationId={locationId} />
        </TabsContent>
        <TabsContent value='history' className='mt-6'>
          <BookingHistoryTab locationId={locationId} />
        </TabsContent>
        <TabsContent value='settings' className='mt-6'>
          <BookingConfigTab locationId={locationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Current Booking Tab Component
function CurrentBookingTab({ locationId }: { locationId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const { data: bookingsData, isLoading } = useOwnerLocationBookings({
    page,
    limit: 10,
    search: debouncedSearchTerm || undefined,
    sortBy: 'createdAt:DESC',
    status: 'ALL',
  });

  const allBookings = bookingsData?.data || [];
  // Filter for current bookings (not cancelled, not in the past) and filter by locationId
  const currentBookings = allBookings.filter((booking) => {
    if (booking.locationId !== locationId) return false;
    if (booking.status?.toUpperCase() === 'CANCELLED') return false;
    // Check if any date is in the future
    const hasFutureDate = booking.dates?.some((dateSlot) => {
      const endDate = new Date(dateSlot.endDateTime);
      return endDate >= new Date();
    });
    return hasFutureDate;
  });

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PAYMENT_RECEIVED':
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700'
          >
            <CheckCircle className='h-3 w-3 mr-1' />
            Payment Received
          </Badge>
        );
      case 'AWAITING_BUSINESS_PROCESSING':
        return (
          <Badge
            variant='outline'
            className='bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700'
          >
            <Clock className='h-3 w-3 mr-1' />
            Awaiting Processing
          </Badge>
        );
      case 'SOFT_LOCKED':
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
          >
            <Clock className='h-3 w-3 mr-1' />
            Soft Locked
          </Badge>
        );
      default:
        return (
          <Badge variant='outline'>
            {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() ||
              status}
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const formatBookingDateRange = (
    dates: { startDateTime: string; endDateTime: string }[]
  ) => {
    if (!dates || dates.length === 0) return { from: 'N/A', to: 'N/A' };

    const startDates = dates.map((d) => new Date(d.startDateTime));
    const endDates = dates.map((d) => new Date(d.endDateTime));

    const earliestStart = new Date(
      Math.min(...startDates.map((d) => d.getTime()))
    );
    const latestEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

    return {
      from: format(earliestStart, 'MMM dd, yyyy'),
      to: format(latestEnd, 'MMM dd, yyyy'),
    };
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (currentBookings.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <CalendarDays className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-lg font-medium text-muted-foreground'>
            No current bookings
          </p>
          <p className='text-sm text-muted-foreground mt-1'>
            There are no active or upcoming bookings for this location.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search bookings...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      <div className='space-y-4'>
        {currentBookings.map((booking) => {
          const dateRange = formatBookingDateRange(booking.dates);
          return (
            <Card
              key={booking.id}
              className='hover:shadow-md transition-shadow'
            >
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg mb-2'>
                      {booking.referencedEventRequest?.eventName ||
                        'Unnamed Event'}
                    </CardTitle>
                    <div className='flex items-center gap-4 flex-wrap'>
                      {getStatusBadge(booking.status || '')}
                      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                        <CalendarDays className='h-4 w-4' />
                        <span>
                          {dateRange.from} - {dateRange.to}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                        <DollarSign className='h-4 w-4' />
                        <span>
                          {formatCurrency(booking.amountToPay || '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      href={`/dashboard/business/location-bookings/${booking.id}`}
                    >
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Booking History Tab Component
function BookingHistoryTab({ locationId }: { locationId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const { data: bookingsData, isLoading } = useOwnerLocationBookings({
    page,
    limit: 10,
    search: debouncedSearchTerm || undefined,
    sortBy: 'createdAt:DESC',
    status: 'ALL',
  });

  const allBookings = bookingsData?.data || [];
  // Filter for past bookings (cancelled or dates in the past) and filter by locationId
  const historyBookings = allBookings.filter((booking) => {
    if (booking.locationId !== locationId) return false;
    if (booking.status?.toUpperCase() === 'CANCELLED') return true;
    // Check if all dates are in the past
    const allPastDates = booking.dates?.every((dateSlot) => {
      const endDate = new Date(dateSlot.endDateTime);
      return endDate < new Date();
    });
    return allPastDates;
  });

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PAYMENT_RECEIVED':
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700'
          >
            <CheckCircle className='h-3 w-3 mr-1' />
            Payment Received
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge
            variant='outline'
            className='bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700'
          >
            <AlertCircle className='h-3 w-3 mr-1' />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant='outline'>
            {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() ||
              status}
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const formatBookingDateRange = (
    dates: { startDateTime: string; endDateTime: string }[] | undefined
  ) => {
    if (!dates || dates.length === 0) return { from: 'N/A', to: 'N/A' };

    const startDates = dates.map((d) => new Date(d.startDateTime));
    const endDates = dates.map((d) => new Date(d.endDateTime));

    const earliestStart = new Date(
      Math.min(...startDates.map((d) => d.getTime()))
    );
    const latestEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

    return {
      from: format(earliestStart, 'MMM dd, yyyy'),
      to: format(latestEnd, 'MMM dd, yyyy'),
    };
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (historyBookings.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <List className='h-12 w-12 text-muted-foreground mb-4' />
          <p className='text-lg font-medium text-muted-foreground'>
            No booking history
          </p>
          <p className='text-sm text-muted-foreground mt-1'>
            There are no past bookings for this location.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search booking history...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      <div className='space-y-4'>
        {historyBookings.map((booking) => {
          const dateRange = formatBookingDateRange(booking.dates);
          return (
            <Card
              key={booking.id}
              className='hover:shadow-md transition-shadow'
            >
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg mb-2'>
                      {booking.referencedEventRequest?.eventName ||
                        'Unnamed Event'}
                    </CardTitle>
                    <div className='flex items-center gap-4 flex-wrap'>
                      {getStatusBadge(booking.status || '')}
                      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                        <CalendarDays className='h-4 w-4' />
                        <span>
                          {dateRange.from} - {dateRange.to}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                        <DollarSign className='h-4 w-4' />
                        <span>
                          {formatCurrency(booking.amountToPay || '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      href={`/dashboard/business/location-bookings/${booking.id}`}
                    >
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function BookingCalendarTab({ locationId }: { locationId: string }) {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: bookingsData } = useOwnerLocationBookings({
    page: 1,
    limit: 200,
    sortBy: 'createdAt:DESC',
    status: 'ALL',
  });

  interface CalendarBookingEvent {
    id: string;
    title: string;
    startDateTime: Date;
    endDateTime: Date;
    customerName: string;
    status: string;
  }

  const calendarEvents: CalendarBookingEvent[] = useMemo(() => {
    const allBookings = bookingsData?.data || [];

    return allBookings
      .filter((booking: any) => booking.locationId === locationId)
      .flatMap((booking: any) =>
        (booking.dates || []).map((dateSlot: any) => ({
          id: booking.id,
          title:
            booking.event?.displayName ||
            booking.referencedEventRequest?.eventName ||
            booking.bookingObject ||
            'Booking',
          startDateTime: new Date(dateSlot.startDateTime),
          endDateTime: new Date(dateSlot.endDateTime),
          customerName:
            (booking.createdBy as any)?.creatorProfile?.displayName ||
            (booking.createdBy as any)?.displayName ||
            `${(booking.createdBy as any)?.firstName || ''} ${
              (booking.createdBy as any)?.lastName || ''
            }`.trim() ||
            booking.createdBy?.email ||
            'Customer',
          status: booking.status ?? 'UNKNOWN',
        }))
      );
  }, [bookingsData, locationId]);

  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'day') {
      setCurrentDate(
        direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1)
      );
    } else if (view === 'week') {
      setCurrentDate(
        direction === 'next'
          ? addWeeks(currentDate, 1)
          : subWeeks(currentDate, 1)
      );
    } else {
      setCurrentDate(
        direction === 'next'
          ? addMonths(currentDate, 1)
          : subMonths(currentDate, 1)
      );
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date): CalendarBookingEvent[] => {
    if (!calendarEvents.length) return [];
    return calendarEvents.filter((event) => {
      if (view === 'day') {
        return isSameDay(event.startDateTime, date);
      } else if (view === 'week') {
        return isSameWeek(event.startDateTime, date, { weekStartsOn: 1 });
      } else {
        return isSameMonth(event.startDateTime, date);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 border-green-500 text-green-700';
      case 'pending':
        return 'bg-amber-500/20 border-amber-500 text-amber-700';
      case 'cancelled':
        return 'bg-red-500/20 border-red-500 text-red-700';
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-700';
    }
  };

  const renderDayView = () => {
    const dayStart = startOfDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className='space-y-4'>
        <div className='border rounded-lg overflow-hidden'>
          <div className='grid grid-cols-[80px_1fr] gap-0'>
            {hours.map((hour) => {
              const hourDate = new Date(dayStart);
              hourDate.setHours(hour, 0, 0, 0);
              const hourEvents = dayEvents.filter(
                (event) =>
                  event.startDateTime.getHours() <= hour &&
                  event.endDateTime.getHours() > hour
              );

              return (
                <div
                  key={hour}
                  className='grid grid-cols-2 border-b last:border-0'
                >
                  <div className='p-2 text-xs font-medium text-muted-foreground border-r bg-muted/20'>
                    {format(hourDate, 'HH:mm')}
                  </div>
                  <div className='p-2 min-h-[60px] relative'>
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'p-1.5 rounded border text-xs mb-1',
                          getStatusColor(event.status)
                        )}
                      >
                        <div className='font-semibold'>{event.title}</div>
                        <div className='text-[10px] opacity-75'>
                          {format(event.startDateTime, 'HH:mm')} -{' '}
                          {format(event.endDateTime, 'HH:mm')}
                        </div>
                        <div className='text-[10px] opacity-75'>
                          {event.customerName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className='space-y-4'>
        <div className='border rounded-lg overflow-hidden'>
          <div className='grid grid-cols-[80px_repeat(7,1fr)] gap-0'>
            <div className='border-r border-b bg-muted/20 p-2'></div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-b p-2 text-center text-xs font-semibold',
                  isSameDay(day, new Date()) && 'bg-primary/10'
                )}
              >
                <div className='text-muted-foreground'>
                  {format(day, 'EEE')}
                </div>
                <div className='text-base'>{format(day, 'd')}</div>
              </div>
            ))}
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className='p-1.5 text-xs font-medium text-muted-foreground border-r border-b bg-muted/20'>
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDate(day).filter(
                    (event) =>
                      isSameDay(event.startDateTime, day) &&
                      event.startDateTime.getHours() <= hour &&
                      event.endDateTime.getHours() > hour
                  );
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className='border-b border-r p-1 min-h-[40px] relative'
                    >
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'p-1 rounded border text-[10px] mb-0.5',
                            getStatusColor(event.status)
                          )}
                        >
                          <div className='font-semibold truncate'>
                            {event.title}
                          </div>
                          <div className='opacity-75 truncate'>
                            {event.customerName}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weeks = eachWeekOfInterval(
      { start: calendarStart, end: calendarEnd },
      { weekStartsOn: 1 }
    );

    return (
      <div className='space-y-4'>
        <div className='border rounded-lg overflow-hidden'>
          <div className='grid grid-cols-7 gap-0'>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className='p-2 text-center text-xs font-semibold border-b bg-muted/20'
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[100px] border-b border-r p-1.5',
                    !isCurrentMonth && 'bg-muted/10 opacity-50',
                    isToday && 'bg-primary/5 border-primary border-2'
                  )}
                >
                  <div
                    className={cn(
                      'text-xs font-semibold mb-1',
                      isToday && 'text-primary'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className='space-y-0.5'>
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'p-1 rounded border text-[10px] truncate',
                          getStatusColor(event.status)
                        )}
                        title={`${event.title} - ${event.customerName}`}
                      >
                        {format(event.startDateTime, 'HH:mm')} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className='text-[10px] text-muted-foreground'>
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigateDate('prev')}
            className='h-8'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={goToToday}
            className='h-8 text-xs'
          >
            Today
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigateDate('next')}
            className='h-8'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
          <div className='ml-4 text-sm font-semibold'>
            {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            {view === 'week' &&
              `${format(
                startOfWeek(currentDate, { weekStartsOn: 1 }),
                'MMM d'
              )} - ${format(
                endOfWeek(currentDate, { weekStartsOn: 1 }),
                'MMM d, yyyy'
              )}`}
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setView('day')}
            className='h-8 text-xs'
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setView('week')}
            className='h-8 text-xs'
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setView('month')}
            className='h-8 text-xs'
          >
            Month
          </Button>
        </div>
      </div>

      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
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
  0: 'MONDAY',
  1: 'TUESDAY',
  2: 'WEDNESDAY',
  3: 'THURSDAY',
  4: 'FRIDAY',
  5: 'SATURDAY',
  6: 'SUNDAY',
};

const transformApiResponse = (
  apiData: WeeklyAvailabilityResponse[]
): WeeklyAvailabilitySlot[] => {
  return apiData.map((item) => {
    const startHour = parseInt(item.startTime.split(':')[0], 10);
    const endHour = parseInt(item.endTime.split(':')[0], 10);
    return {
      id: item.id,
      dayOfWeek: DAY_OF_WEEK_MAP[item.dayOfWeek],
      startHour,
      endHour,
    };
  });
};

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function AvailabilityTab({ locationId }: { locationId: string }) {
  const { data: apiAvailability, isLoading } =
    useWeeklyAvailabilities(locationId);
  const { mutate: createWeeklyAvailability, isPending: isCreating } =
    useCreateWeeklyAvailability();
  const { mutate: deleteAvailability, isPending: isDeleting } =
    useDeleteAvailability(locationId);
  const { mutate: updateWeeklyAvailability, isPending: isUpdating } =
    useUpdateWeeklyAvailability(locationId);

  // Local availability is kept in sync with API data for interactive updates during resize
  const [localAvailability, setLocalAvailability] = useState<
    WeeklyAvailabilitySlot[]
  >([]);

  useEffect(() => {
    if (apiAvailability) {
      setLocalAvailability(transformApiResponse(apiAvailability));
    } else {
      setLocalAvailability([]);
    }
  }, [apiAvailability]);

  const availability = useMemo(() => {
    if (!apiAvailability) return [];
    return transformApiResponse(apiAvailability);
  }, [apiAvailability]);

  const displayAvailability =
    localAvailability.length > 0 ? localAvailability : availability;

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [slotsToConfirm, setSlotsToConfirm] = useState<
    WeeklyAvailabilitySlot[]
  >([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<WeeklyAvailabilitySlot | null>(
    null
  );
  const [editedStartHour, setEditedStartHour] = useState<number>(0);
  const [editedEndHour, setEditedEndHour] = useState<number>(0);
  const [editErrors, setEditErrors] = useState<{
    start?: string;
    end?: string;
    overlap?: string;
  }>({});

  // Track hovered block for highlighting
  const [hoveredBlock, setHoveredBlock] =
    useState<WeeklyAvailabilitySlot | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we should show dialog after selection
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if user is dragging to select multiple cells
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    day: number;
    hour: number;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ day: number; hour: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Track resize state (resizing an existing slot)
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSlot, setResizeSlot] = useState<WeeklyAvailabilitySlot | null>(
    null
  );
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null);
  const isResizingRef = useRef(false);
  const resizeSlotRef = useRef<WeeklyAvailabilitySlot | null>(null);
  const resizeEdgeRef = useRef<'start' | 'end' | null>(null);

  const availabilityCellsSet = useMemo(() => {
    const set = new Set<string>();
    displayAvailability.forEach((slot) => {
      for (let hour = slot.startHour; hour < slot.endHour; hour++) {
        set.add(`${slot.dayOfWeek}_${hour}`);
      }
    });
    return set;
  }, [displayAvailability]);

  const weeklyStats = useMemo(() => {
    if (displayAvailability.length === 0) {
      return { totalHours: 0, activeDays: 0, slotCount: 0, longestBlock: 0 };
    }
    const activeDaysSet = new Set<number>();
    let totalHours = 0;
    let longestBlock = 0;
    displayAvailability.forEach((slot) => {
      activeDaysSet.add(slot.dayOfWeek);
      const duration = slot.endHour - slot.startHour;
      totalHours += duration;
      if (duration > longestBlock) longestBlock = duration;
    });
    return {
      totalHours,
      activeDays: activeDaysSet.size,
      slotCount: displayAvailability.length,
      longestBlock,
    };
  }, [displayAvailability]);

  const getCellStatus = (day: number, hour: number): 'available' | 'saved' => {
    const key = `${day}_${hour}`;
    return availabilityCellsSet.has(key) ? 'saved' : 'available';
  };

  const getSlotAtCell = (
    day: number,
    hour: number
  ): WeeklyAvailabilitySlot | null => {
    return (
      displayAvailability.find(
        (slot) =>
          slot.dayOfWeek === day &&
          hour >= slot.startHour &&
          hour < slot.endHour
      ) || null
    );
  };

  // Check if a cell is on the left edge (startHour) or right edge (endHour) of a slot
  const getEdgeAtCell = (day: number, hour: number): 'start' | 'end' | null => {
    const slot = getSlotAtCell(day, hour);
    if (!slot) return null;
    if (hour === slot.startHour) return 'start';
    if (hour === slot.endHour - 1) return 'end';
    return null;
  };

  // Round hour to nearest integer
  const roundHour = (hour: number): number => {
    return Math.round(hour);
  };

  // Handle mouse down (start drag or resize)
  const handleMouseDown = (day: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const roundedHour = roundHour(hour);
    const key = `${day}_${roundedHour}`;

    // Check if we're on an edge of an existing slot (resize mode)
    const edge = getEdgeAtCell(day, roundedHour);
    if (edge) {
      const slot = getSlotAtCell(day, roundedHour);
      if (slot) {
        setIsResizing(true);
        setResizeSlot(slot);
        setResizeEdge(edge);
        isResizingRef.current = true;
        resizeSlotRef.current = slot;
        resizeEdgeRef.current = edge;
        hasMovedRef.current = false;
        return;
      }
    }

    // Don't allow dragging from already saved cells (unless we're resizing)
    if (availabilityCellsSet.has(key)) {
      return;
    }

    const dragStartValue = { day, hour: roundedHour };
    setIsDragging(true);
    setDragStart(dragStartValue);
    isDraggingRef.current = true;
    dragStartRef.current = dragStartValue;
    hasMovedRef.current = false;
    setSelectedCells(new Set([key]));
  };

  // Handle mouse enter (during drag or resize)
  const handleMouseEnter = (day: number, hour: number) => {
    // Check if we're resizing
    if (
      isResizingRef.current &&
      resizeSlotRef.current &&
      resizeEdgeRef.current
    ) {
      hasMovedRef.current = true;
      const roundedHour = roundHour(hour);

      // Only allow resizing within the same day
      if (resizeSlotRef.current.dayOfWeek !== day) {
        return;
      }

      // Get the current slot from local state
      const currentSlot = localAvailability.find(
        (s) => s.id === resizeSlotRef.current?.id
      );
      if (!currentSlot) return;

      // Update the slot based on which edge is being dragged
      let newStartHour = currentSlot.startHour;
      let newEndHour = currentSlot.endHour;

      if (resizeEdgeRef.current === 'start') {
        newStartHour = Math.min(roundedHour, currentSlot.endHour - 1);
        if (newStartHour >= currentSlot.endHour) {
          newStartHour = currentSlot.endHour - 1;
        }
      } else {
        newEndHour = Math.max(roundedHour + 1, currentSlot.startHour + 1);
        if (newEndHour <= currentSlot.startHour) {
          newEndHour = currentSlot.startHour + 1;
        }
      }

      // Check for overlaps with other slots
      const otherSlots = displayAvailability.filter(
        (s) => s.id !== currentSlot.id
      );
      let hasOverlap = false;

      for (let h = newStartHour; h < newEndHour; h++) {
        for (const otherSlot of otherSlots) {
          if (
            otherSlot.dayOfWeek === day &&
            h >= otherSlot.startHour &&
            h < otherSlot.endHour
          ) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      // If no overlap, update the slot
      if (!hasOverlap) {
        setLocalAvailability((prev) =>
          prev.map((s) =>
            s.id === currentSlot.id
              ? { ...s, startHour: newStartHour, endHour: newEndHour }
              : s
          )
        );
      }

      return;
    }

    // Check if we're dragging
    if (!isDraggingRef.current || !dragStartRef.current) return;

    // Only allow selecting cells within the same day as the drag start
    if (dragStartRef.current.day !== day) {
      return;
    }

    hasMovedRef.current = true;

    const roundedHour = roundHour(hour);
    const newSelectedCells = new Set<string>();

    // Select all cells between drag start and current position (same day only)
    const startHour = Math.min(dragStartRef.current.hour, roundedHour);
    const endHour = Math.max(dragStartRef.current.hour, roundedHour);

    // Check if any cell in the range overlaps with existing availability
    let hasOverlap = false;
    for (let h = startHour; h <= endHour; h++) {
      const key = `${day}_${h}`;
      if (availabilityCellsSet.has(key)) {
        hasOverlap = true;
        break;
      }
    }

    // If there's an overlap, don't allow the selection
    if (hasOverlap) {
      return;
    }

    // Only allow selecting cells that aren't already saved
    for (let h = startHour; h <= endHour; h++) {
      const key = `${day}_${h}`;
      if (!availabilityCellsSet.has(key)) {
        newSelectedCells.add(key);
      }
    }

    setSelectedCells(newSelectedCells);
  };

  // Handle mouse up (end drag or resize)
  const handleMouseUp = useCallback(() => {
    // Handle resize end
    if (isResizingRef.current && resizeSlotRef.current) {
      const finalSlot = localAvailability.find(
        (s) => s.id === resizeSlotRef.current?.id
      );
      const originalSlot = availability.find(
        (s) => s.id === resizeSlotRef.current?.id
      );

      if (finalSlot && originalSlot) {
        // Always open edit dialog after resize
        setSlotToEdit(originalSlot);
        setEditedStartHour(finalSlot.startHour);
        setEditedEndHour(finalSlot.endHour);
        setEditErrors({});
        setShowEditDialog(true);
      }

      // Reset resize state
      setIsResizing(false);
      isResizingRef.current = false;
      resizeSlotRef.current = null;
      resizeEdgeRef.current = null;
      hasMovedRef.current = false;
      return;
    }

    const wasDragging = isDraggingRef.current;
    const hadMoved = hasMovedRef.current;
    const currentSelectedCells = new Set(selectedCells);

    setIsDragging(false);
    setDragStart(null);
    isDraggingRef.current = false;
    dragStartRef.current = null;

    // If mouse moved during drag, or if we have multiple selected cells, it was a drag
    const shouldProcess =
      (wasDragging && hadMoved) || currentSelectedCells.size > 1;

    if (shouldProcess && currentSelectedCells.size > 0) {
      // Clear any existing timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      // Show dialog after a short delay
      selectionTimeoutRef.current = setTimeout(() => {
        processSelectedCellsWithSet(currentSelectedCells);
      }, 100);
    }

    hasMovedRef.current = false;
  }, [selectedCells, localAvailability, availability]);

  // Process a specific set of selected cells
  const processSelectedCellsWithSet = useCallback(
    (cellsToProcess: Set<string>) => {
      if (cellsToProcess.size === 0) return;

      // Group consecutive hours per day into slots
      const slotsByDay = new Map<number, number[]>();

      cellsToProcess.forEach((key) => {
        const [dayStr, hourStr] = key.split('_');
        const day = parseInt(dayStr, 10);
        const hour = parseInt(hourStr, 10);

        if (!slotsByDay.has(day)) {
          slotsByDay.set(day, []);
        }
        slotsByDay.get(day)!.push(hour);
      });

      // Create slots from consecutive hours
      const newSlots: WeeklyAvailabilitySlot[] = [];
      slotsByDay.forEach((hours, day) => {
        if (hours.length === 0) return;

        hours.sort((a, b) => a - b);

        let startHour = hours[0];
        for (let i = 1; i < hours.length; i++) {
          if (hours[i] !== hours[i - 1] + 1) {
            // Gap found, create slot
            newSlots.push({
              dayOfWeek: day,
              startHour,
              endHour: hours[i - 1] + 1,
            });
            startHour = hours[i];
          }
        }
        // Add final slot
        newSlots.push({
          dayOfWeek: day,
          startHour,
          endHour: hours[hours.length - 1] + 1,
        });
      });

      // Show confirmation dialog
      setSlotsToConfirm(newSlots);
      setShowConfirmDialog(true);
    },
    [availabilityCellsSet]
  );

  // Handle single cell click - show dialog immediately
  const handleCellClick = (day: number, hour: number) => {
    // If we were resizing, don't treat it as a click
    if (isResizingRef.current || hasMovedRef.current || isDraggingRef.current) {
      return;
    }

    const roundedHour = roundHour(hour);
    const key = `${day}_${roundedHour}`;

    // If clicking on a saved cell (and not on an edge), show edit dialog
    if (availabilityCellsSet.has(key)) {
      const edge = getEdgeAtCell(day, roundedHour);
      // Only show edit dialog if not clicking on an edge
      if (!edge) {
        const block = getSlotAtCell(day, roundedHour);
        if (block) {
          setSlotToEdit(block);
          setEditedStartHour(block.startHour);
          setEditedEndHour(block.endHour);
          setEditErrors({});
          setShowEditDialog(true);
        }
      }
      return;
    }

    // If clicking on a single cell, select just that one and show dialog
    const newSelectedCells = new Set([key]);
    setSelectedCells(newSelectedCells);

    // Process and show dialog immediately for single clicks
    setTimeout(() => {
      const currentSelected = new Set([key]);
      processSelectedCellsWithSet(currentSelected);
    }, 50);
  };

  // Find the block of saved cells in the same day starting from a given hour
  const findSavedBlockInDay = (
    day: number,
    startHour: number
  ): WeeklyAvailabilitySlot | null => {
    const matchingSlot = displayAvailability.find((slot) => {
      return (
        slot.dayOfWeek === day &&
        startHour >= slot.startHour &&
        startHour < slot.endHour
      );
    });

    return matchingSlot || null;
  };

  // Check if a cell belongs to the hovered block
  const isCellInHoveredBlock = (day: number, hour: number): boolean => {
    if (!hoveredBlock) return false;
    return (
      hoveredBlock.dayOfWeek === day &&
      hour >= hoveredBlock.startHour &&
      hour < hoveredBlock.endHour
    );
  };

  // Handle cell hover
  const handleCellHover = (day: number, hour: number) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    const key = `${day}_${hour}`;

    // Only show hover effect for saved cells
    if (availabilityCellsSet.has(key)) {
      const block = findSavedBlockInDay(day, hour);
      if (block) {
        setHoveredBlock(block);
      }
    } else {
      setHoveredBlock(null);
    }
  };

  // Handle cell hover leave
  const handleCellHoverLeave = () => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Small delay to allow mouse to move to adjacent cells in the same block
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBlock(null);
      hoverTimeoutRef.current = null;
    }, 100);
  };

  // Check if a cell is the start or end of the hovered block
  const isEdgeOfHoveredBlock = (day: number, hour: number): boolean => {
    if (!hoveredBlock) return false;
    if (hoveredBlock.dayOfWeek !== day) return false;
    return hour === hoveredBlock.startHour || hour === hoveredBlock.endHour - 1;
  };

  const processSelectedCells = (cellsToProcess: Set<string>) => {
    if (cellsToProcess.size === 0) return;
    const slotsByDay = new Map<number, number[]>();
    cellsToProcess.forEach((key) => {
      const [dayStr, hourStr] = key.split('_');
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
          newSlots.push({
            dayOfWeek: day,
            startHour,
            endHour: hours[i - 1] + 1,
          });
          startHour = hours[i];
        }
      }
      newSlots.push({
        dayOfWeek: day,
        startHour,
        endHour: hours[hours.length - 1] + 1,
      });
    });
    setSlotsToConfirm(newSlots);
    setShowConfirmDialog(true);
  };

  const convertToApiFormat = (slot: WeeklyAvailabilitySlot) => {
    return {
      dayOfWeek: DAY_OF_WEEK_REVERSE_MAP[slot.dayOfWeek] as
        | 'MONDAY'
        | 'TUESDAY'
        | 'WEDNESDAY'
        | 'THURSDAY'
        | 'FRIDAY'
        | 'SATURDAY'
        | 'SUNDAY',
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

  const validateEditedTimes = (
    startHour: number,
    endHour: number,
    dayOfWeek: number,
    slotId?: number
  ): { start?: string; end?: string; overlap?: string } => {
    const errors: { start?: string; end?: string; overlap?: string } = {};
    if (startHour >= endHour) {
      errors.end = 'End time must be after start time';
      return errors;
    }
    if (endHour - startHour < 1) {
      errors.end = 'Minimum duration is 1 hour';
      return errors;
    }
    if (startHour < 0 || startHour > 23) {
      errors.start = 'Start time must be between 00:00 and 23:00';
    }
    if (endHour < 1 || endHour > 24) {
      errors.end = 'End time must be between 01:00 and 24:00';
    }
    const otherSlots = displayAvailability.filter((s) => s.id !== slotId);
    for (let h = startHour; h < endHour; h++) {
      for (const otherSlot of otherSlots) {
        if (
          otherSlot.dayOfWeek === dayOfWeek &&
          h >= otherSlot.startHour &&
          h < otherSlot.endHour
        ) {
          errors.overlap = `Overlaps with existing availability on ${
            DAYS_OF_WEEK[otherSlot.dayOfWeek]
          } (${formatHour(otherSlot.startHour)} - ${formatHour(
            otherSlot.endHour
          )})`;
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
    if (
      slotToEdit &&
      editedStartHour !== undefined &&
      editedEndHour !== undefined
    ) {
      const errors = validateEditedTimes(
        editedStartHour,
        editedEndHour,
        slotToEdit.dayOfWeek,
        slotToEdit.id
      );
      setEditErrors(errors);
    }
  }, [editedStartHour, editedEndHour, slotToEdit, displayAvailability]);

  const handleConfirmUpdate = () => {
    if (!slotToEdit || !slotToEdit.id) return;
    const errors = validateEditedTimes(
      editedStartHour,
      editedEndHour,
      slotToEdit.dayOfWeek,
      slotToEdit.id
    );
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
    // If we were resizing, revert localAvailability back to API data
    if (apiAvailability) {
      setLocalAvailability(transformApiResponse(apiAvailability));
    }
    setShowEditDialog(false);
    setSlotToEdit(null);
    setEditErrors({});
  };

  // Get cell class names
  const getCellClassName = (
    status: 'available' | 'saved',
    isSelected: boolean,
    day: number,
    hour: number
  ) => {
    const isHovered = isCellInHoveredBlock(day, hour);
    const edge = getEdgeAtCell(day, hour);
    const isEdgeOfHovered = isEdgeOfHoveredBlock(day, hour);

    return cn(
      'w-full h-full rounded border transition-all flex items-center justify-center text-[8px] font-medium relative',
      {
        'bg-green-500 border-green-600 border-2 text-white cursor-pointer':
          status === 'saved' && !isEdgeOfHovered,
        'bg-green-600 border-green-700 border-2 text-white shadow-md cursor-pointer':
          status === 'saved' && isHovered && !isEdgeOfHovered,
        'bg-green-600 border-green-700 border-2 text-white shadow-md cursor-col-resize':
          status === 'saved' && isEdgeOfHovered,
        'bg-blue-400 border-blue-500 border-2 text-white':
          isSelected && status === 'available',
        'bg-white border-gray-300 border-2 text-gray-700 hover:opacity-80 cursor-grab':
          !isSelected && status === 'available',
      }
    );
  };

  // Add global mouse up handler to end dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleMouseUp]);

  // Update document cursor during drag/resize
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <Card className='border-border/60 shadow-sm'>
        <CardHeader className='pb-3 pt-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex-1'>
              <CardTitle className='text-sm font-semibold'>
                Manage Weekly Availability
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4 pt-0 pb-4'>
          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='rounded-lg border border-border/60 bg-muted/30 p-3'>
              <div className='flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground'>
                <span>Total weekly hours</span>
                <Clock className='h-3.5 w-3.5 text-primary' />
              </div>
              <p className='mt-1.5 text-xl font-semibold'>
                {weeklyStats.totalHours}
                <span className='ml-1 text-xs font-normal text-muted-foreground'>
                  hrs
                </span>
              </p>
            </div>
            <div className='rounded-lg border border-border/60 bg-muted/30 p-3'>
              <div className='flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground'>
                <span>Active days</span>
                <CalendarDaysIcon className='h-3.5 w-3.5 text-primary' />
              </div>
              <p className='mt-1.5 text-xl font-semibold'>
                {weeklyStats.activeDays}
                <span className='ml-1 text-xs font-normal text-muted-foreground'>
                  days
                </span>
              </p>
            </div>
            <div className='rounded-lg border border-border/60 bg-muted/30 p-3'>
              <div className='flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground'>
                <span>Availability blocks</span>
                <Layers className='h-3.5 w-3.5 text-primary' />
              </div>
              <div className='mt-1.5 flex items-baseline gap-2'>
                <p className='text-xl font-semibold'>{weeklyStats.slotCount}</p>
                <span className='text-xs text-muted-foreground'>
                  longest block {weeklyStats.longestBlock || 0} hr
                  {weeklyStats.longestBlock === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <span className='inline-block h-3 w-3 rounded bg-green-500 ring-1 ring-green-600' />
              Saved availability
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-block h-3 w-3 rounded bg-blue-400 ring-1 ring-blue-500' />
              Currently selected
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-block h-3 w-3 rounded bg-background ring-1 ring-border' />
              Empty slot
            </div>
          </div>

          <div className='overflow-x-auto'>
            <div className='inline-block min-w-full'>
              <div
                className={cn(
                  'rounded-xl border border-border/60 bg-muted/10 p-2 shadow-sm',
                  isDragging && 'cursor-grabbing select-none',
                  isResizing && 'cursor-col-resize select-none'
                )}
                style={{
                  userSelect: isDragging || isResizing ? 'none' : 'auto',
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  handleMouseUp();
                }}
              >
                <div className='mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-1 border-b border-border/60 pb-2'>
                  <div className='border-r border-border/60' />
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div
                      key={index}
                      className='py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground'
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                <div className='space-y-0.5'>
                  {HOURS.map((hour) => {
                    const isNightTime = hour >= 21 || hour <= 5;
                    return (
                      <div
                        key={hour}
                        className={cn(
                          'grid grid-cols-[80px_repeat(7,1fr)] gap-1 rounded-md px-0.5 py-0.5',
                          isNightTime && 'bg-muted/40'
                        )}
                      >
                        <div className='flex items-center justify-center pr-2 text-xs font-medium text-muted-foreground'>
                          {formatHourRange(hour)}
                        </div>
                        {DAYS_OF_WEEK.map((_, dayIndex) => {
                          const status = getCellStatus(dayIndex, hour);
                          const key = `${dayIndex}_${hour}`;
                          const isSelected = selectedCells.has(key);
                          const edge = getEdgeAtCell(dayIndex, hour);
                          const isResizeEdge = edge !== null && !isResizing;
                          const isHovered = isCellInHoveredBlock(
                            dayIndex,
                            hour
                          );
                          const isEdgeOfHovered = isEdgeOfHoveredBlock(
                            dayIndex,
                            hour
                          );
                          // Show icon only on the start/end cells of the hovered block
                          const showResizeIcon =
                            isHovered && isEdgeOfHovered && status === 'saved';
                          // Determine which icon to show based on which edge of the hovered block
                          const isStartEdge =
                            hoveredBlock &&
                            hoveredBlock.dayOfWeek === dayIndex &&
                            hour === hoveredBlock.startHour;
                          const isEndEdge =
                            hoveredBlock &&
                            hoveredBlock.dayOfWeek === dayIndex &&
                            hour === hoveredBlock.endHour - 1;

                          return (
                            <div
                              key={`${dayIndex}_${hour}`}
                              className={cn(
                                'h-[18px] select-none',
                                !isResizeEdge &&
                                  !isDragging &&
                                  !isResizing &&
                                  !availabilityCellsSet.has(key) &&
                                  'cursor-grab',
                                isDragging && 'cursor-grabbing',
                                isResizing && 'cursor-col-resize'
                              )}
                              onClick={() => handleCellClick(dayIndex, hour)}
                              onMouseDown={(e) =>
                                handleMouseDown(dayIndex, hour, e)
                              }
                              onMouseEnter={() => {
                                handleMouseEnter(dayIndex, hour);
                                handleCellHover(dayIndex, hour);
                              }}
                              onMouseLeave={handleCellHoverLeave}
                            >
                              <div
                                className={getCellClassName(
                                  status,
                                  isSelected,
                                  dayIndex,
                                  hour
                                )}
                              >
                                {showResizeIcon && (
                                  <>
                                    {isStartEdge ? (
                                      <ChevronLeft className='h-3 w-3 text-white drop-shadow-md' />
                                    ) : isEndEdge ? (
                                      <ChevronRight className='h-3 w-3 text-white drop-shadow-md' />
                                    ) : null}
                                  </>
                                )}
                              </div>
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
              Confirm adding the following time ranges to your weekly
              availability:
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2 py-4 max-h-[400px] overflow-y-auto'>
            {slotsToConfirm.map((slot, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-2 bg-gray-50 rounded'
              >
                <div className='font-medium text-sm'>
                  {DAYS_OF_WEEK[slot.dayOfWeek]}
                </div>
                <div className='text-xs text-gray-600'>
                  {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={handleCancelDialog}
              disabled={isCreating}
              size='sm'
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmAdd} disabled={isCreating} size='sm'>
              {isCreating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Edit Availability</DialogTitle>
            <DialogDescription>
              Update the time range or delete this availability slot.
            </DialogDescription>
          </DialogHeader>
          {slotToEdit && (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label className='text-xs font-medium text-muted-foreground'>
                  Day
                </Label>
                <div className='rounded-lg bg-muted/50 p-3'>
                  <p className='text-base font-semibold'>
                    {DAYS_OF_WEEK[slotToEdit.dayOfWeek]}
                  </p>
                </div>
              </div>
              <div className='space-y-2'>
                <Label className='text-xs font-medium text-muted-foreground'>
                  Time Range
                </Label>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-2'>
                    <Label htmlFor='start-time' className='text-xs'>
                      Start Time
                    </Label>
                    <div className='flex items-center gap-2'>
                      <Input
                        id='start-time'
                        type='number'
                        min='0'
                        max='23'
                        value={editedStartHour}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className={cn(
                          'text-center font-mono h-8',
                          editErrors.start && 'border-destructive'
                        )}
                      />
                      <span className='text-xs text-muted-foreground'>:00</span>
                    </div>
                    {editErrors.start && (
                      <p className='text-xs text-destructive'>
                        {editErrors.start}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='end-time' className='text-xs'>
                      End Time
                    </Label>
                    <div className='flex items-center gap-2'>
                      <Input
                        id='end-time'
                        type='number'
                        min='1'
                        max='24'
                        value={editedEndHour}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className={cn(
                          'text-center font-mono h-8',
                          editErrors.end && 'border-destructive'
                        )}
                      />
                      <span className='text-xs text-muted-foreground'>:00</span>
                    </div>
                    {editErrors.end && (
                      <p className='text-xs text-destructive'>
                        {editErrors.end}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {editErrors.overlap && (
                <Alert variant='destructive'>
                  <AlertDescription className='text-xs'>
                    {editErrors.overlap}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter className='flex-col-reverse sm:flex-row gap-2 sm:justify-between'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleConfirmDelete}
              disabled={isDeleting || isUpdating}
              className='text-destructive hover:text-destructive hover:bg-destructive/10 self-start'
            >
              {isDeleting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='h-4 w-4' />
              )}
            </Button>
            <div className='flex gap-2 w-full sm:w-auto'>
              <Button
                variant='outline'
                onClick={handleCancelEditDialog}
                disabled={isDeleting || isUpdating}
                size='sm'
                className='flex-1 sm:flex-initial'
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={
                  Object.keys(editErrors).length > 0 ||
                  !slotToEdit ||
                  (editedStartHour === slotToEdit.startHour &&
                    editedEndHour === slotToEdit.endHour) ||
                  isDeleting ||
                  isUpdating
                }
                size='sm'
                className='flex-1 sm:flex-initial'
              >
                {isUpdating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className='mr-2 h-4 w-4' />
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

// Voucher Create Form Component
const voucherCreateSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    voucherCode: z.string().min(1, 'Voucher code is required'),
    imageUrl: z
      .string()
      .url('Please provide a valid image URL')
      .optional()
      .or(z.literal('')),
    pricePoint: z.number().min(0, 'Price must be 0 or more'),
    maxQuantity: z.number().min(1, 'Max quantity must be at least 1'),
    userRedeemedLimit: z.number().min(1, 'Limit must be at least 1'),
    voucherType: z.string().min(1, 'Type is required'),
    startDate: z.date({ error: 'Start date is required.' }),
    endDate: z.date({ error: 'End date is required.' }),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

function CreateVoucherForm({
  locationId,
  locationName,
  onSuccess,
}: {
  locationId: string;
  locationName: string;
  onSuccess: () => void;
}) {
  const { mutate: createVoucher, isPending } =
    useCreateLocationVoucher(locationId);
  const queryClient = useQueryClient();
  const { closeVoucherCreateTab } = useLocationTabs();

  const form = useForm<z.infer<typeof voucherCreateSchema>>({
    resolver: zodResolver(voucherCreateSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      voucherCode: '',
      imageUrl: '',
      pricePoint: 0,
      maxQuantity: 100,
      userRedeemedLimit: 1,
      voucherType: 'public',
    },
  });

  const voucherType = form.watch('voucherType');
  const isPublicVoucher = voucherType === 'public';

  useEffect(() => {
    if (isPublicVoucher) {
      form.setValue('pricePoint', 0);
    }
  }, [isPublicVoucher, form]);

  function onSubmit(values: z.infer<typeof voucherCreateSchema>) {
    const payload: CreateLocationVoucherPayload = {
      title: values.title.trim(),
      description: values.description.trim(),
      voucherCode: values.voucherCode.trim().toUpperCase(),
      imageUrl: values.imageUrl?.trim() || '',
      pricePoint: isPublicVoucher ? 0 : values.pricePoint,
      maxQuantity: values.maxQuantity,
      userRedeemedLimit: values.userRedeemedLimit,
      voucherType: values.voucherType,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    createVoucher(payload, {
      onSuccess: () => {
        toast.success('Voucher created successfully');
        queryClient.invalidateQueries({
          queryKey: ['locationVouchers', locationId],
        });
        onSuccess(); // Set active tab first
        closeVoucherCreateTab(); // Then close create tab
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to create voucher');
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TicketPercent className='h-5 w-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <FormField
              name='title'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='e.g., 20% off drinks'
                      className='h-11'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Describe what this voucher includes...'
                      rows={4}
                      className='resize-none'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                name='voucherCode'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='e.g., SUMMER20'
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='voucherType'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='h-11'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='public'>Free Voucher</SelectItem>
                        <SelectItem value='mission_only'>
                          Exchange Voucher
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <FormField
                name='pricePoint'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Points)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={isNaN(field.value) ? '' : field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : Number(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                        disabled={isPublicVoucher}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='maxQuantity'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={isNaN(field.value) ? '' : field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : Number(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='userRedeemedLimit'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit per User</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={isNaN(field.value) ? '' : field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : Number(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                name='startDate'
                control={form.control}
                render={({ field }) => {
                  const hasError = !!form.formState.errors.startDate;
                  return (
                    <FormItem className='flex flex-col'>
                      <FormLabel className={cn(hasError && 'text-destructive')}>
                        Start Date *
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              type='button'
                              className={cn(
                                'pl-3 text-left font-normal h-11 w-full justify-start',
                                !field.value && 'text-muted-foreground',
                                hasError &&
                                  'border-destructive focus-visible:ring-destructive'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span className='text-muted-foreground'>
                                  Select start date
                                </span>
                              )}
                              <CalendarIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  hasError ? 'text-destructive' : 'opacity-50'
                                )}
                              />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <CalendarComponent
                            mode='single'
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              if (
                                date &&
                                form.getValues('endDate') &&
                                date >= form.getValues('endDate')
                              ) {
                                form.setError('endDate', {
                                  type: 'manual',
                                  message: 'End date must be after start date',
                                });
                              } else {
                                form.clearErrors('endDate');
                              }
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                name='endDate'
                control={form.control}
                render={({ field }) => {
                  const hasError = !!form.formState.errors.endDate;
                  const startDate = form.getValues('startDate');
                  return (
                    <FormItem className='flex flex-col'>
                      <FormLabel className={cn(hasError && 'text-destructive')}>
                        End Date *
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              type='button'
                              className={cn(
                                'pl-3 text-left font-normal h-11 w-full justify-start',
                                !field.value && 'text-muted-foreground',
                                hasError &&
                                  'border-destructive focus-visible:ring-destructive'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span className='text-muted-foreground'>
                                  Select end date
                                </span>
                              )}
                              <CalendarIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  hasError ? 'text-destructive' : 'opacity-50'
                                )}
                              />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <CalendarComponent
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = new Date(
                                new Date().setHours(0, 0, 0, 0)
                              );
                              if (date < today) return true;
                              if (startDate && date <= startDate) return true;
                              return false;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              name='imageUrl'
              control={form.control}
              render={({ field }) => {
                const hasError = !!form.formState.errors.imageUrl;
                return (
                  <FormItem>
                    <FormLabel className={cn(hasError && 'text-destructive')}>
                      Voucher Image
                      <span className='text-muted-foreground font-normal ml-1 text-xs'>
                        (optional)
                      </span>
                    </FormLabel>
                    <FormDescription className='text-xs text-muted-foreground mb-2'>
                      Upload an image to showcase your voucher. This helps
                      attract more customers.
                    </FormDescription>
                    <FormControl>
                      <div
                        className={cn(
                          hasError && 'rounded-md border border-destructive p-1'
                        )}
                      >
                        <SingleFileUpload
                          value={field.value || undefined}
                          onChange={(url) => field.onChange(url || '')}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={closeVoucherCreateTab}
          >
            Cancel
          </Button>
          <Button type='submit' size='lg' disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create Voucher
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Voucher Edit Form Component
const voucherEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  voucherCode: z.string().min(1, 'Voucher code is required'),
  imageUrl: z.string().url('Image URL is required').nullable(),
  pricePoint: z.number().min(0, 'Price must be 0 or more'),
  maxQuantity: z.number().min(1, 'Max quantity must be at least 1'),
  userRedeemedLimit: z.number().min(1, 'Limit must be at least 1'),
  voucherType: z.string().min(1, 'Type is required'),
  startDate: z.date({ error: 'Start date is required.' }),
  endDate: z.date({ error: 'End date is required.' }),
});

function EditVoucherForm({
  locationId,
  voucherId,
  locationName,
  onSuccess,
}: {
  locationId: string;
  voucherId: string;
  locationName: string;
  onSuccess: () => void;
}) {
  const { data: voucher, isLoading: isLoadingData } =
    useLocationVoucherById(voucherId);
  const { mutate: updateVoucher, isPending: isUpdating } =
    useUpdateLocationVoucher();
  const queryClient = useQueryClient();
  const { closeVoucherEditTab } = useLocationTabs();

  const form = useForm<z.infer<typeof voucherEditSchema>>({
    resolver: zodResolver(voucherEditSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      voucherCode: '',
      imageUrl: null,
      pricePoint: 0,
      maxQuantity: 1,
      userRedeemedLimit: 1,
      voucherType: 'public',
    },
  });

  useEffect(() => {
    if (voucher) {
      form.reset(
        {
          title: voucher.title,
          description: voucher.description,
          voucherCode: voucher.voucherCode,
          imageUrl: voucher.imageUrl || null,
          pricePoint: voucher.pricePoint,
          maxQuantity: voucher.maxQuantity,
          userRedeemedLimit: voucher.userRedeemedLimit,
          voucherType: voucher.voucherType || 'public',
          startDate: new Date(voucher.startDate),
          endDate: new Date(voucher.endDate),
        },
        { keepDefaultValues: false }
      );
    }
  }, [voucher, form]);

  const voucherType = form.watch('voucherType');
  const isPublicVoucher = voucherType === 'public';

  // Only reset pricePoint when user changes voucher type to public, not on initial load
  const prevVoucherTypeRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      prevVoucherTypeRef.current !== undefined &&
      voucherType === 'public' &&
      prevVoucherTypeRef.current !== 'public'
    ) {
      form.setValue('pricePoint', 0, { shouldDirty: false });
    }
    prevVoucherTypeRef.current = voucherType;
  }, [voucherType, form]);

  function onSubmit(values: z.infer<typeof voucherEditSchema>) {
    const payload = {
      ...values,
      imageUrl: values.imageUrl || '',
      pricePoint: isPublicVoucher ? 0 : values.pricePoint,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    updateVoucher(
      { locationId, voucherId, payload },
      {
        onSuccess: () => {
          toast.success('Voucher updated successfully');
          queryClient.invalidateQueries({
            queryKey: ['locationVouchers', locationId],
          });
          onSuccess(); // Set active tab first
          closeVoucherEditTab(); // Then close edit tab
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to update voucher');
        },
      }
    );
  }

  if (isLoadingData) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className='text-center py-12 text-red-500'>
        <p className='font-medium'>Voucher not found</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TicketPercent className='h-5 w-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <FormField
              name='title'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='e.g., 20% off drinks'
                      className='h-11'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Describe what this voucher includes...'
                      rows={4}
                      className='resize-none'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                name='voucherCode'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='e.g., SUMMER20'
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='voucherType'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      key={field.value || 'default'}
                    >
                      <FormControl>
                        <SelectTrigger className='h-11'>
                          <SelectValue placeholder='Select voucher type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='public'>Free Voucher</SelectItem>
                        <SelectItem value='mission_only'>
                          Exchange Voucher
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <FormField
                name='pricePoint'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Points)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={isNaN(field.value) ? '' : field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : Number(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                        disabled={isPublicVoucher}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='maxQuantity'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={isNaN(field.value) ? '' : field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : Number(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='userRedeemedLimit'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit per User</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={isNaN(field.value) ? '' : field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === '' ? 0 : Number(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                name='startDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'pl-3 text-left font-normal h-11',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <CalendarComponent
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='endDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'pl-3 text-left font-normal h-11',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <CalendarComponent
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name='imageUrl'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voucher Image</FormLabel>
                  <FormControl>
                    <SingleFileUpload
                      value={field.value || ''}
                      onChange={(value) => field.onChange(value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Button type='button' variant='outline' onClick={closeVoucherEditTab}>
            Cancel
          </Button>
          <Button type='submit' size='lg' disabled={isUpdating}>
            {isUpdating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Mission Create Form Component
const missionCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  metric: z.string().min(1, 'Metric is required'),
  target: z.number().min(1, 'Target must be at least 1'),
  reward: z.number().min(1, 'Reward must be at least 1'),
  startDate: z.date({ error: 'Start date is required.' }),
  endDate: z.date({ error: 'End date is required.' }),
  imageUrls: z
    .array(z.string().url())
    .min(1, 'At least one image is required.'),
});

function CreateMissionForm({
  locationId,
  locationName,
  onSuccess,
}: {
  locationId: string;
  locationName: string;
  onSuccess: () => void;
}) {
  const { mutate: createMission, isPending } =
    useCreateLocationMission(locationId);
  const queryClient = useQueryClient();
  const { closeMissionCreateTab } = useLocationTabs();

  const form = useForm<z.infer<typeof missionCreateSchema>>({
    resolver: zodResolver(missionCreateSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      metric: 'order_count',
      target: 1,
      reward: 0,
      imageUrls: [],
    },
  });

  function onSubmit(values: z.infer<typeof missionCreateSchema>) {
    const payload = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    createMission(payload, {
      onSuccess: () => {
        toast.success('Mission created successfully');
        queryClient.invalidateQueries({
          queryKey: ['locationMissions', locationId],
        });
        onSuccess(); // Set active tab first
        closeMissionCreateTab(); // Then close create tab
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to create mission');
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Rocket className='h-5 w-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <FormField
              name='title'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='e.g., Check-in 5 times'
                      className='h-11'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Describe what this mission includes...'
                      rows={4}
                      className='resize-none'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <FormField
                name='metric'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metric</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='h-11'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='order_count'>Order Count</SelectItem>
                        <SelectItem value='check_in_count'>
                          Check-in Count
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='target'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='reward'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward (Points)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                name='startDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'pl-3 text-left font-normal h-11',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <CalendarComponent
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='endDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'pl-3 text-left font-normal h-11',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <CalendarComponent
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name='imageUrls'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission Images</FormLabel>
                  <FormControl>
                    <FileUpload value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={closeMissionCreateTab}
          >
            Cancel
          </Button>
          <Button type='submit' size='lg' disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create Mission
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Mission Edit Form Component
const missionEditSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  metric: z.string().min(1, 'Metric is required'),
  target: z.number().min(1, 'Target must be at least 1'),
  reward: z.number().min(1, 'Reward must be at least 1'),
  startDate: z.date({ error: 'Start date is required.' }),
  endDate: z.date({ error: 'End date is required.' }),
  imageUrls: z
    .array(z.string().url())
    .min(1, 'At least one image is required.'),
});

function EditMissionForm({
  locationId,
  missionId,
  locationName,
  onSuccess,
}: {
  locationId: string;
  missionId: string;
  locationName: string;
  onSuccess: () => void;
}) {
  const { data: mission, isLoading: isLoadingData } =
    useLocationMissionById(missionId);
  const { mutate: updateMission, isPending: isUpdating } =
    useUpdateLocationMission();
  const queryClient = useQueryClient();
  const { closeMissionEditTab } = useLocationTabs();

  const form = useForm<z.infer<typeof missionEditSchema>>({
    resolver: zodResolver(missionEditSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      metric: '',
      target: 1,
      reward: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      imageUrls: [],
    },
  });

  useEffect(() => {
    if (mission) {
      form.reset({
        title: mission.title ?? '',
        description: mission.description ?? '',
        metric: mission.metric ?? '',
        target: mission.target ?? 1,
        reward: mission.reward ?? 1,
        startDate: mission.startDate ? new Date(mission.startDate) : new Date(),
        endDate: mission.endDate
          ? new Date(mission.endDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
        imageUrls: Array.isArray(mission.imageUrls) ? mission.imageUrls : [],
      });
    }
  }, [mission, form]);

  function onSubmit(values: z.infer<typeof missionEditSchema>) {
    const payload = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    updateMission(
      { missionId, payload },
      {
        onSuccess: () => {
          toast.success('Mission updated successfully');
          queryClient.invalidateQueries({
            queryKey: ['locationMissions', locationId],
          });
          onSuccess(); // Set active tab first
          closeMissionEditTab(); // Then close edit tab
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to update mission');
        },
      }
    );
  }

  if (isLoadingData) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className='text-center py-12 text-red-500'>
        <p className='font-medium'>Mission not found</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Rocket className='h-5 w-5' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <FormField
              name='title'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='e.g., Check-in 5 times'
                      className='h-11'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Describe what this mission includes...'
                      rows={4}
                      className='resize-none'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <FormField
                name='metric'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metric</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='h-11'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='order_count'>Order Count</SelectItem>
                        <SelectItem value='check_in_count'>
                          Check-in Count
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='target'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='reward'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward (Points)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                name='startDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'pl-3 text-left font-normal h-11',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <CalendarComponent
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='endDate'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            className={cn(
                              'pl-3 text-left font-normal h-11',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <CalendarComponent
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name='imageUrls'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission Images</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Button type='button' variant='outline' onClick={closeMissionEditTab}>
            Cancel
          </Button>
          <Button type='submit' size='lg' disabled={isUpdating}>
            {isUpdating && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Voucher Detail View Component
function VoucherDetailView({
  voucherId,
  locationId,
  onClose,
}: {
  voucherId: string;
  locationId: string;
  onClose: () => void;
}) {
  const {
    data: voucher,
    isLoading,
    isError,
  } = useLocationVoucherById(voucherId);
  const { openVoucherEditTab } = useLocationTabs();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isError || !voucher) {
    return (
      <div className='text-center py-12 text-red-500'>
        <p className='font-medium'>Voucher not found</p>
      </div>
    );
  }

  const position = {
    lat: voucher.location?.latitude,
    lng: voucher.location?.longitude,
  };

  const now = new Date();
  const isExpired = new Date(voucher.endDate) < now;
  const isScheduled = new Date(voucher.startDate) > now;
  const isActive = !isExpired && !isScheduled;

  function InfoRow({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }) {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className='flex gap-3 mb-4'>
        {Icon && (
          <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
        )}
        <div className='flex-1'>
          <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
          <div className='text-base text-foreground break-words'>{value}</div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4 flex-wrap'>
          <Button variant='outline' size='icon' onClick={onClose}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <Badge variant='outline'>{voucher.voucherCode}</Badge>
          {isActive && <Badge className='bg-green-600'>Active</Badge>}
          {isScheduled && <Badge variant='outline'>Scheduled</Badge>}
          {isExpired && <Badge variant='secondary'>Expired</Badge>}
        </div>
        <Button onClick={() => openVoucherEditTab(voucher.id, voucher.title)}>
          <Edit className='mr-2 h-4 w-4' /> Edit Voucher
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Ticket /> Voucher Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow label='Description' value={voucher.description} />
              <InfoRow
                label='Type'
                value={formatVoucherType(voucher.voucherType)}
                icon={Layers}
              />
              <InfoRow
                label='Price'
                value={`${voucher.pricePoint} points`}
                icon={Star}
              />
              <InfoRow
                label='Max Quantity'
                value={voucher.maxQuantity}
                icon={Zap}
              />
              <InfoRow
                label='Limit Per User'
                value={voucher.userRedeemedLimit}
                icon={User}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CalendarDaysIcon /> Duration
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4'>
              <InfoRow
                label='Start Date'
                value={format(new Date(voucher.startDate), 'PPP p')}
              />
              <InfoRow
                label='End Date'
                value={format(new Date(voucher.endDate), 'PPP p')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock /> Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4'>
              <InfoRow
                label='Created At'
                value={format(new Date(voucher.createdAt), 'PPP p')}
              />
              <InfoRow
                label='Updated At'
                value={format(new Date(voucher.updatedAt), 'PPP p')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ImageIcon /> Voucher Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={voucher.imageUrl}
                alt={voucher.title}
                className='w-full max-w-sm h-auto object-cover rounded-md border cursor-pointer'
                onClick={() => handleImageClick(voucher.imageUrl)}
              />
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-1 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building /> Associated Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label='Location Name' value={voucher.location?.name} />
              <InfoRow label='Address' value={voucher.location?.addressLine} />
              <InfoRow
                label='District/Ward'
                value={voucher.location?.addressLevel1}
              />
              <InfoRow
                label='Province/City'
                value={voucher.location?.addressLevel2}
              />
              <InfoRow
                label='Radius (m)'
                value={voucher.location?.radiusMeters}
                icon={Ruler}
              />
              <InfoRow
                label='Visible on Map'
                value={voucher.location?.isVisibleOnMap ? 'Yes' : 'No'}
                icon={EyeIcon}
              />
              {voucher.location?.imageUrl?.length > 0 && (
                <div className='mt-4 space-y-2'>
                  <p className='text-sm font-semibold text-muted-foreground'>
                    Location Images
                  </p>
                  <div className='flex flex-wrap gap-3'>
                    {voucher.location?.imageUrl.map((url: string) => (
                      <img
                        key={url}
                        src={url}
                        alt='Location'
                        onClick={() => handleImageClick(url)}
                        className='w-24 h-24 rounded-md border object-cover cursor-pointer'
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin /> Location Map
              </CardTitle>
            </CardHeader>
            <CardContent className='h-80 rounded-lg overflow-hidden'>
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt={voucher.title}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}

// Mission Detail View Component
function MissionDetailView({
  missionId,
  locationId,
  onClose,
}: {
  missionId: string;
  locationId: string;
  onClose: () => void;
}) {
  const {
    data: mission,
    isLoading,
    isError,
  } = useLocationMissionById(missionId);
  const { openMissionEditTab } = useLocationTabs();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isError || !mission) {
    return (
      <div className='text-center py-12 text-red-500'>
        <p className='font-medium'>Mission not found</p>
      </div>
    );
  }

  const position = {
    lat: mission.location?.latitude,
    lng: mission.location?.longitude,
  };

  const now = new Date();
  const isExpired = new Date(mission.endDate) < now;
  const isScheduled = new Date(mission.startDate) > now;
  const isActive = !isExpired && !isScheduled;

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
      <div className='flex gap-3'>
        {Icon && (
          <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
        )}
        <div className='flex-1'>
          <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
          <div className='text-base text-foreground'>{value}</div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='icon' onClick={onClose}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          {isActive && <Badge className='bg-green-600'>Active</Badge>}
          {isScheduled && <Badge variant='outline'>Scheduled</Badge>}
          {isExpired && <Badge variant='secondary'>Completed</Badge>}
        </div>
        <Button onClick={() => openMissionEditTab(mission.id, mission.title)}>
          Edit Mission
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Layers /> Mission Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow label='Description' value={mission.description} />
              <InfoRow
                label='Metric (How to complete)'
                value={<Badge variant='outline'>{mission.metric}</Badge>}
                icon={Zap}
              />
              <InfoRow label='Target' value={mission.target} icon={Zap} />
              <InfoRow
                label='Reward'
                value={`${mission.reward} points`}
                icon={Star}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CalendarDaysIcon /> Duration
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4'>
              <InfoRow
                label='Start Date'
                value={format(new Date(mission.startDate), 'PPP p')}
              />
              <InfoRow
                label='End Date'
                value={format(new Date(mission.endDate), 'PPP p')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ImageIcon /> Mission Images
              </CardTitle>
            </CardHeader>
            <CardContent className='flex flex-wrap gap-2'>
              {mission.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Mission image ${index + 1}`}
                  className='w-40 h-40 object-cover rounded-md border cursor-pointer'
                  onClick={() =>
                    handleImageClick(url, `Mission image ${index + 1}`)
                  }
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-1 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building /> Associated Location
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow label='Address' value={mission.location?.addressLine} />
              <InfoRow
                label='District/Ward'
                value={mission.location?.addressLevel1 || 'N/A'}
              />
              <InfoRow
                label='Province/City'
                value={mission.location?.addressLevel2 || 'N/A'}
              />
              <InfoRow
                label='Service Radius'
                value={`${mission.location?.radiusMeters} meters`}
              />
            </CardContent>
          </Card>

          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin /> Location Map
              </CardTitle>
            </CardHeader>
            <CardContent className='h-80 rounded-lg overflow-hidden'>
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}

// Announcement Detail View Component
function AnnouncementDetailView({
  announcementId,
  locationId,
  onClose,
}: {
  announcementId: string;
  locationId: string;
  onClose: () => void;
}) {
  const { data: announcements } = useAnnouncements({
    page: 1,
    limit: 1000,
    locationId,
  });
  const announcement = announcements?.data?.find(
    (a) => a.id === announcementId
  );
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (!announcement) {
    return (
      <div className='text-center py-12 text-red-500'>
        <p className='font-medium'>Announcement not found</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='icon' onClick={onClose}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <Badge
            variant='outline'
            className={
              announcement.isHidden
                ? 'border-border bg-muted/40 text-muted-foreground'
                : ''
            }
          >
            {announcement.isHidden ? 'Hidden' : 'Visible'}
          </Badge>
        </div>
        <Button asChild>
          <Link
            href={`/dashboard/business/locations/${locationId}/announcements/${announcement.id}/edit`}
          >
            <Edit className='mr-2 h-4 w-4' /> Edit Announcement
          </Link>
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Megaphone /> Announcement Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <p className='text-sm font-semibold text-muted-foreground mb-1'>
                  Title
                </p>
                <p className='text-base text-foreground'>
                  {announcement.title}
                </p>
              </div>
              <div>
                <p className='text-sm font-semibold text-muted-foreground mb-1'>
                  Description
                </p>
                <p className='text-base text-foreground'>
                  {announcement.description}
                </p>
              </div>
              {announcement.imageUrl && (
                <div>
                  <p className='text-sm font-semibold text-muted-foreground mb-2'>
                    Image
                  </p>
                  <img
                    src={announcement.imageUrl}
                    alt={announcement.title}
                    className='w-full max-w-md h-auto object-cover rounded-md border cursor-pointer'
                    onClick={() => handleImageClick(announcement.imageUrl!)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CalendarDaysIcon /> Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-semibold text-muted-foreground mb-1'>
                  Start Date
                </p>
                <p className='text-base text-foreground'>
                  {announcement.startDate
                    ? formatDateTime(announcement.startDate)
                    : '—'}
                </p>
              </div>
              <div>
                <p className='text-sm font-semibold text-muted-foreground mb-1'>
                  End Date
                </p>
                <p className='text-base text-foreground'>
                  {announcement.endDate
                    ? formatDateTime(announcement.endDate)
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock /> Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-semibold text-muted-foreground mb-1'>
                  Created
                </p>
                <p className='text-base text-foreground'>
                  {formatDateTime(announcement.createdAt)}
                </p>
              </div>
              <div>
                <p className='text-sm font-semibold text-muted-foreground mb-1'>
                  Updated
                </p>
                <p className='text-base text-foreground'>
                  {formatDateTime(announcement.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt={announcement.title}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
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
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all vouchers and missions for visualizations
  const { data: allVouchersResponse } = useLocationVouchers({
    locationId,
    page: 1,
    limit: 1000,
    sortBy: 'createdAt:DESC',
  });

  const { data: allMissionsResponse } = useLocationMissions({
    locationId,
    page: 1,
    limit: 1000,
    sortBy: 'createdAt:DESC',
  });

  const allVouchers = allVouchersResponse?.data || [];
  const allMissions = allMissionsResponse?.data || [];

  // Fetch announcements for overview statistics (use meta totalItems for count)
  const { data: announcementsOverviewData } = useAnnouncements(
    {
      page: 1,
      limit: 1,
      sortBy: 'createdAt:DESC',
      search: '',
      locationId,
    },
    { enabled: Boolean(locationId) }
  );

  const totalAnnouncements =
    announcementsOverviewData?.meta?.totalItems ?? 0;

  const {
    voucherCreateTab,
    openVoucherCreateTab,
    closeVoucherCreateTab,
    voucherEditTab,
    closeVoucherEditTab,
    voucherDetailTab,
    closeVoucherDetailTab,
    missionCreateTab,
    openMissionCreateTab,
    closeMissionCreateTab,
    missionEditTab,
    closeMissionEditTab,
    missionDetailTab,
    closeMissionDetailTab,
    announcementCreateTab,
    closeAnnouncementCreateTab,
    announcementDetailTab,
    closeAnnouncementDetailTab,
  } = useLocationTabs();

  useEffect(() => {
    if (pathname.includes('/vouchers')) setActiveTab('vouchers');
    else if (pathname.includes('/missions')) setActiveTab('missions');
    else if (
      pathname.includes('/availability') ||
      pathname.includes('/booking-config')
    )
      setActiveTab('booking');
    else if (pathname.includes('/announcements')) setActiveTab('announcements');
    else if (pathname.includes('/edit')) setActiveTab('edit');
    else setActiveTab('overview');
  }, [pathname]);

  const totalCheckIns = useMemo(() => {
    const parsed = Number(location?.totalCheckIns ?? '0');
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [location?.totalCheckIns]);

  // Get bookings data for calculations
  const { data: bookingsData } = useOwnerLocationBookings({
    page: 1,
    limit: 100,
    sortBy: 'createdAt:DESC',
    status: 'ALL',
  });

  // Calculate revenue from bookings
  const revenueData = useMemo(() => {
    const allBookings = bookingsData?.data || [];
    const locationBookings = allBookings.filter(
      (b: any) => b.locationId === location?.id
    );

    const totalRevenue = locationBookings.reduce(
      (sum: number, booking: any) => {
        const amount = parseFloat(booking.amountToPay || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      },
      0
    );

    const thisMonthRevenue = locationBookings
      .filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        const now = new Date();
        return (
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum: number, booking: any) => {
        const amount = parseFloat(booking.amountToPay || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    return {
      total: totalRevenue,
      thisMonth: thisMonthRevenue,
      change: 12.3,
    };
  }, [bookingsData, location?.id]);

  // Get upcoming bookings
  const upcomingBookings = useMemo(() => {
    const allBookings = bookingsData?.data || [];
    const locationBookings = allBookings
      .filter((booking: any) => {
        if (booking.locationId !== location?.id) return false;
        if (booking.status?.toUpperCase() === 'CANCELLED') return false;
        const hasFutureDate = booking.dates?.some((dateSlot: any) => {
          const endDate = new Date(dateSlot.endDateTime);
          return endDate >= new Date();
        });
        return hasFutureDate;
      })
      .slice(0, 5);

    return locationBookings.map((booking: any) => {
      const earliestDate = booking.dates?.[0]?.startDateTime
        ? new Date(booking.dates[0].startDateTime)
        : new Date();
      return {
        id: booking.id,
        eventName: booking.event?.displayName || 'Unnamed Event',
        date: earliestDate,
        amount: parseFloat(booking.amountToPay || '0'),
        status: booking.status,
      };
    });
  }, [bookingsData, location?.id]);

  // Calculate active bookings count
  const activeBookingsCount = useMemo(() => {
    const allBookings = bookingsData?.data || [];
    return allBookings.filter((booking: any) => {
      if (booking.locationId !== location?.id) return false;
      if (booking.status?.toUpperCase() === 'CANCELLED') return false;
      const hasFutureDate = booking.dates?.some((dateSlot: any) => {
        const endDate = new Date(dateSlot.endDateTime);
        return endDate >= new Date();
      });
      return hasFutureDate;
    }).length;
  }, [bookingsData, location?.id]);

  // Format currency helper for overview
  const formatCurrencyOverview = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  // Mock recent activity (replace with real API later)
  const recentActivity = [
    {
      id: '1',
      type: 'checkin',
      message: 'New check-in by John Doe',
      time: '2 minutes ago',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      id: '2',
      type: 'booking',
      message: 'New booking: Summer Music Festival',
      time: '1 hour ago',
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      id: '3',
      type: 'voucher',
      message: 'Voucher redeemed: 20% Off',
      time: '3 hours ago',
      icon: Ticket,
      color: 'text-purple-600',
    },
    {
      id: '4',
      type: 'mission',
      message: 'Mission completed: Check-in Challenge',
      time: '5 hours ago',
      icon: Rocket,
      color: 'text-orange-600',
    },
    {
      id: '5',
      type: 'checkin',
      message: 'New check-in by Jane Smith',
      time: '1 day ago',
      icon: Users,
      color: 'text-blue-600',
    },
  ];

  if (isLoading) {
    return null; // Layout handles loading state
  }
  if (isError || !location) {
    return null; // Layout handles error state
  }

  const position = {
    lat: location.latitude,
    lng: location.longitude,
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
      {/* Tab Content */}
      <div className='animate-in fade-in-0 slide-in-from-bottom-2 duration-300'>
        <TabsContent value='overview' className='mt-0'>
          <div className='space-y-6'>
            {/* Enhanced Stats Cards - 8 Cards in 2 rows */}
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
              {/* Row 1 */}
              <StatCard
                title='Total Check-ins'
                value={totalCheckIns.toLocaleString()}
                icon={Users}
                color='red'
                description='All time check-ins'
              />

              <StatCard
                title='Total Revenue'
                value={formatCurrencyOverview(revenueData.total)}
                icon={DollarSign}
                color='emerald'
                description={`+${revenueData.change}% vs last month`}
              />

              <StatCard
                title='Total Announcements'
                value={totalAnnouncements}
                icon={Megaphone}
                color='amber'
                description='Announcements for this location'
              />

              <StatCard
                title='Total Vouchers'
                value={allVouchers.length}
                icon={Ticket}
                color='orange'
                description={`${allVouchers.filter((v: any) => v.status === 'ACTIVE').length} active`}
              />

              <StatCard
                title='Total Missions'
                value={allMissions.length}
                icon={Rocket}
                color='purple'
                description={`${allMissions.filter((m: any) => m.status === 'ACTIVE').length} active`}
              />
            </div>

            {/* Upcoming Bookings & Recent Activity */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              {/* Images & Tags */}
              <div className='space-y-4'>
                {location.imageUrl && location.imageUrl.length > 0 && (
                  <Card className='border-border/60 shadow-sm'>
                    <CardHeader className='pb-3 pt-4'>
                      <CardTitle className='flex items-center gap-2 text-sm'>
                        <ImageIcon className='h-4 w-4' />
                        Location Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-0 pb-4'>
                      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 pb-4'>
                        {location.imageUrl.map((url, index) => (
                          <div key={index} className='flex flex-col gap-1'>
                            <img
                              src={url || '/placeholder.svg'}
                              alt={`Location image ${index + 1}`}
                              // Image viewer is handled in layout
                              className='w-full h-24 object-cover rounded-md border cursor-pointer'
                            />
                            <p className='text-[10px] text-muted-foreground text-center'>
                              Image {index + 1}
                            </p>
                          </div>
                        ))}
                      </div>
                      {location.tags && location.tags.length > 0 && (
                        <div className='border-t pt-3'>
                          <div className='pb-3 pt-4'>
                            <div className='flex items-center gap-2 text-sm font-semibold'>
                              <Tag className='h-4 w-4' />
                              Tags
                            </div>
                          </div>
                          <div className='pt-0 pb-4'>
                            <DisplayTags tags={location.tags} maxCount={12} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Upcoming Bookings Widget */}
              <Card className='border-border/60 shadow-sm'>
                <CardHeader className='pb-3 pt-4'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Calendar className='h-5 w-5 text-primary' />
                    Upcoming Bookings
                  </CardTitle>
                  <CardDescription>Next 5 upcoming bookings</CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {upcomingBookings.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground'>
                      <Calendar className='h-12 w-12 mx-auto mb-2 opacity-50' />
                      <p className='text-sm'>No upcoming bookings</p>
                    </div>
                  ) : (
                    upcomingBookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        onClick={() =>
                          router.push(
                            `/dashboard/business/location-bookings/${booking.id}`
                          )
                        }
                        className='flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer'
                      >
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-sm truncate'>
                            {booking.eventName}
                          </p>
                          <div className='flex items-center gap-3 mt-1 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'>
                              <Calendar className='h-3 w-3' />
                              {format(booking.date, 'MMM dd, yyyy')}
                            </span>
                            <span className='flex items-center gap-1 text-emerald-600 font-medium'>
                              <DollarSign className='h-3 w-3' />
                              {formatCurrencyOverview(booking.amount)}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            booking.status === 'PAYMENT_RECEIVED'
                              ? 'default'
                              : booking.status ===
                                'AWAITING_BUSINESS_PROCESSING'
                              ? 'secondary'
                              : 'outline'
                          }
                          className='ml-2 shrink-0'
                        >
                          {booking.status === 'PAYMENT_RECEIVED'
                            ? 'Paid'
                            : booking.status === 'AWAITING_BUSINESS_PROCESSING'
                            ? 'Pending'
                            : booking.status}
                        </Badge>
                      </div>
                    ))
                  )}
                  {upcomingBookings.length > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full mt-2'
                      onClick={() =>
                        router.push(
                          `/dashboard/business/locations/${locationId}/availability?tab=calendar`
                        )
                      }
                    >
                      View All Bookings
                      <ArrowRight className='h-4 w-4 ml-2' />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Map - Main Component */}
            <Card className='border-border/60 shadow-sm'>
              <CardHeader className='pt-4'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <MapPin className='h-5 w-5 text-primary' />
                  Location Map
                </CardTitle>
                <CardDescription className='text-sm'>
                  {location.addressLine}
                  {location.addressLevel1 &&
                    location.addressLevel2 &&
                    `, ${location.addressLevel1}, ${location.addressLevel2}`}
                </CardDescription>
              </CardHeader>
              <CardContent className='h-[500px] md:h-[600px] rounded-lg overflow-hidden pt-0 pb-4'>
                <GoogleMapsPicker
                  position={position}
                  onPositionChange={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value='vouchers' className='mt-0'>
          {voucherCreateTab.isOpen ? (
            <div className='space-y-8 p-6 max-w-4xl mx-auto'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={closeVoucherCreateTab}
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </Button>
                  <div>
                    <h1 className='text-3xl font-bold'>Create Voucher</h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Add a new voucher for {location.name}
                    </p>
                  </div>
                </div>
              </div>
              <CreateVoucherForm
                locationId={location.id}
                locationName={location.name}
                onSuccess={() => setActiveTab('vouchers')}
              />
            </div>
          ) : voucherEditTab.isOpen && voucherEditTab.voucherId ? (
            <div className='space-y-8 p-6 max-w-4xl mx-auto'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={closeVoucherEditTab}
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </Button>
                  <div>
                    <h1 className='text-3xl font-bold'>Edit Voucher</h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Update voucher details for {location.name}
                    </p>
                  </div>
                </div>
              </div>
              <EditVoucherForm
                locationId={location.id}
                voucherId={voucherEditTab.voucherId}
                locationName={location.name}
                onSuccess={() => setActiveTab('vouchers')}
              />
            </div>
          ) : voucherDetailTab.isOpen && voucherDetailTab.voucherId ? (
            <div className='space-y-6 p-6'>
              <VoucherDetailView
                voucherId={voucherDetailTab.voucherId}
                locationId={location.id}
                onClose={() => {
                  closeVoucherDetailTab();
                  setActiveTab('vouchers');
                }}
              />
            </div>
          ) : (
            <VouchersTab locationId={location.id} />
          )}
        </TabsContent>
        <TabsContent value='missions' className='mt-0'>
          {missionCreateTab.isOpen ? (
            <div className='space-y-8 p-6 max-w-4xl mx-auto'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={closeMissionCreateTab}
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </Button>
                  <div>
                    <h1 className='text-3xl font-bold'>Create Mission</h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Add a new mission for {location.name}
                    </p>
                  </div>
                </div>
              </div>
              <CreateMissionForm
                locationId={location.id}
                locationName={location.name}
                onSuccess={() => setActiveTab('missions')}
              />
            </div>
          ) : missionEditTab.isOpen && missionEditTab.missionId ? (
            <div className='space-y-8 p-6 max-w-4xl mx-auto'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={closeMissionEditTab}
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </Button>
                  <div>
                    <h1 className='text-3xl font-bold'>Edit Mission</h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Update mission details for {location.name}
                    </p>
                  </div>
                </div>
              </div>
              <EditMissionForm
                locationId={location.id}
                missionId={missionEditTab.missionId}
                locationName={location.name}
                onSuccess={() => setActiveTab('missions')}
              />
            </div>
          ) : missionDetailTab.isOpen && missionDetailTab.missionId ? (
            <div className='space-y-6 p-6'>
              <MissionDetailView
                missionId={missionDetailTab.missionId}
                locationId={location.id}
                onClose={() => {
                  closeMissionDetailTab();
                  setActiveTab('missions');
                }}
              />
            </div>
          ) : (
            <MissionsTab locationId={location.id} />
          )}
        </TabsContent>
        <TabsContent value='booking' className='mt-0'>
          <BookingAndAvailabilityTab locationId={location.id} />
        </TabsContent>
        <TabsContent value='announcements' className='mt-0'>
          {announcementCreateTab.isOpen ? (
            <div className='space-y-8 p-6 max-w-4xl mx-auto'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={closeAnnouncementCreateTab}
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </Button>
                  <div>
                    <h1 className='text-3xl font-bold'>Create Announcement</h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                      Publish news and updates for {location.name}
                    </p>
                  </div>
                </div>
              </div>
              <CreateAnnouncementForm
                locationId={location.id}
                locationName={location.name}
                onSuccess={() => setActiveTab('announcements')}
              />
            </div>
          ) : announcementDetailTab.isOpen &&
            announcementDetailTab.announcementId ? (
            <div className='space-y-6 p-6'>
              <AnnouncementDetailView
                announcementId={announcementDetailTab.announcementId}
                locationId={location.id}
                onClose={() => {
                  closeAnnouncementDetailTab();
                  setActiveTab('announcements');
                }}
              />
            </div>
          ) : (
            <AnnouncementsTab locationId={location.id} />
          )}
        </TabsContent>
        <TabsContent value='edit' className='mt-0'>
          <EditLocationTab locationId={location.id} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
