'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocationVouchers } from '@/hooks/vouchers/useLocationVouchers';
import { LocationVoucher, SortState } from '@/types';
import { useDebounce } from 'use-debounce';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  TicketPercent,
  Target,
  CalendarDays,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDeleteLocationVoucher } from '@/hooks/vouchers/useDeleteLocationVoucher';
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

export default function ManageVouchersPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [voucherToDelete, setVoucherToDelete] =
    useState<LocationVoucher | null>(null);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'scheduled' | 'expired'
  >('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

  const getVoucherTypeLabel = (voucherType: string) => {
    if (voucherType === 'public') {
      return 'Free';
    }
    if (voucherType === 'mission_only') {
      return 'Exchange';
    }
    return voucherType.replace(/_/g, ' ');
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

  const voucherTypes = useMemo(
    () =>
      Array.from(
        new Set(vouchers.map((voucher) => voucher.voucherType))
      ).sort(),
    [vouchers]
  );

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const status = getVoucherStatus(voucher.startDate, voucher.endDate);
      const statusMatch = statusFilter === 'all' || status === statusFilter;
      const typeMatch =
        typeFilter === 'all' || voucher.voucherType === typeFilter;
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

  function formatDate(dateString: string) {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  }

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
      onSuccess: () => {
        setVoucherToDelete(null);
      },
    });
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex-1'></div>
        <div className='flex gap-2'>
          <Button asChild variant='outline'>
            <Link
              href={`/dashboard/business/locations/${locationId}/vouchers/verify`}
            >
              <QrCode className='mr-2 h-4 w-4' />
              Verify Voucher
            </Link>
          </Button>
          <Button asChild>
            <Link
              href={`/dashboard/business/locations/${locationId}/vouchers/create`}
            >
              <PlusCircle className='mr-2 h-4 w-4' />
              Create voucher
            </Link>
          </Button>
        </div>
      </div>

      <Card className='border-border/60 shadow-sm'>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle className='text-xl font-semibold'>
                Vouchers ({filteredVouchers.length}/{meta?.totalItems || 0})
              </CardTitle>
              <CardDescription>
                Showing page {meta?.currentPage} of {meta?.totalPages}.
              </CardDescription>
            </div>
            <div className='flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center'>
              <Input
                placeholder='Search by code or title...'
                value={searchTerm}
                className='md:w-64'
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as typeof statusFilter)
                }
              >
                <SelectTrigger className='md:w-40'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='scheduled'>Scheduled</SelectItem>
                  <SelectItem value='expired'>Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value)}
              >
                <SelectTrigger className='md:w-44'>
                  <SelectValue placeholder='Voucher type' />
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='all'>All types</SelectItem>
                  {voucherTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        className='px-0'
                        onClick={() => handleSort('pricePoint')}
                      >
                        Price (pts) <SortIcon column='pricePoint' />
                      </Button>
                    </TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVouchers.length > 0 ? (
                    filteredVouchers.map((voucher) => (
                      <TableRow key={voucher.id} className='hover:bg-muted/20'>
                        <TableCell className='space-y-1'>
                          <div className='flex items-start gap-3'>
                            {voucher.imageUrl ? (
                              <img
                                src={voucher.imageUrl}
                                alt={voucher.title}
                                className='h-10 w-10 object-cover'
                              />
                            ) : (
                              <div className='flex h-full w-full items-center justify-center text-[10px] text-muted-foreground'>
                                No image
                              </div>
                            )}
                            <div className='space-y-1'>
                              <div className='flex items-center gap-2'>
                                <Link
                                  href={`/dashboard/business/locations/${voucher.locationId}/vouchers/${voucher.id}`}
                                  className='text-sm font-semibold leading-tight hover:text-primary hover:underline transition-colors'
                                >
                                  {voucher.title}
                                </Link>
                              </div>
                              {voucher.description && (
                                <p className='max-w-md text-xs text-muted-foreground line-clamp-2'>
                                  {voucher.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          <div className='flex items-center gap-2'>
                            <CalendarDays className='h-3 w-3 text-muted-foreground' />
                            <span>{formatDate(voucher.startDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          <div className='flex items-center gap-2'>
                            <CalendarDays className='h-3 w-3 text-muted-foreground' />
                            <span>{formatDate(voucher.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='text-xs'>
                            {getVoucherTypeLabel(voucher.voucherType)}
                          </Badge>
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
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              asChild
                            >
                              <Link
                                href={`/dashboard/business/locations/${voucher.locationId}/vouchers/${voucher.id}/edit`}
                                title='Edit'
                              >
                                <Edit className='h-4 w-4' />
                              </Link>
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                              onClick={() => setVoucherToDelete(voucher)}
                              title='Delete'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className='h-32'>
                        <div className='flex flex-col items-center justify-center gap-2 py-6 text-center'>
                          <div className='text-base font-semibold'>
                            No vouchers match your filters
                          </div>
                          <p className='max-w-sm text-sm text-muted-foreground'>
                            Adjust filters or create a new voucher to offer
                            fresh incentives for this location.
                          </p>
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

      {/* --- Phân trang --- */}
      <div className='flex items-center justify-end space-x-2 py-4'>
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
              This will permanently delete the voucher:
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
}
