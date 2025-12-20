'use client';

import type React from 'react';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { useLocationVoucherById } from '@/hooks/vouchers/useLocationVoucherById';
import { useLocationVoucherExchangeHistory } from '@/hooks/vouchers/useLocationVouchers';
import { useLocationTabs } from '@/contexts/LocationTabContext';

// --- Import UI Components ---
import {
  Loader2,
  CalendarDays as CalendarDaysIcon,
  Layers,
  Zap,
  Star,
  Ticket,
  User,
  Clock,
  ImageIcon,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { DetailViewLayout } from '@/components/shared/DetailViewLayout';
import ErrorCustom from '@/components/shared/ErrorCustom';
import LoadingCustom from '@/components/shared/LoadingCustom';
import { formatDate, formatDateTime } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import { IconTicket } from '@tabler/icons-react';

const formatVoucherType = (voucherType: string): string => {
  if (voucherType === 'public') return 'Free';
  if (voucherType === 'mission_only') return 'Exchange';
  return voucherType;
};

export default function VoucherDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string; voucherId: string }>;
}) {
  const { locationId, voucherId } = use(params);
  const router = useRouter();
  const { openVoucherDetailTab } = useLocationTabs();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [exchangePage, setExchangePage] = useState(1);
  const exchangeLimit = 10;

  const {
    data: voucher,
    isLoading,
    isError,
  } = useLocationVoucherById(voucherId);

  const { data: exchangeHistoryResponse, isLoading: isLoadingExchangeHistory } =
    useLocationVoucherExchangeHistory({
      page: exchangePage,
      limit: exchangeLimit,
      'filter.voucherId': `$eq:${voucherId}`,
      sortBy: 'createdAt:DESC',
    });

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  useEffect(() => {
    if (voucher && voucher.title) {
      openVoucherDetailTab(voucherId, 'View Voucher');
    }
  }, [voucher, voucherId, openVoucherDetailTab]);

  if (isLoading) {
    return <LoadingCustom />;
  }
  if (isError || !voucher) {
    return <ErrorCustom />;
  }

  const now = new Date();
  const isExpired = new Date(voucher.endDate) < now;
  const isScheduled = new Date(voucher.startDate) > now;
  const isActive = !isExpired && !isScheduled;

  const exchanges = exchangeHistoryResponse?.data ?? [];
  const exchangesMeta = exchangeHistoryResponse?.meta;

  const mainContent = (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        {/* Voucher Info Card - Compact Sidebar */}
        <Card className='lg:col-span-1'>
          <CardContent className='space-y-2'>
            <CardTitle className='text-base font-semibold flex gap-2 items-center'>
              <IconTicket className='h-5 w-5 text-primary' />
              <p className='text-base font-semibold'>Voucher Information</p>
            </CardTitle>
            {/* Image */}
            {voucher.imageUrl ? (
              <Image
                src={voucher.imageUrl}
                alt={voucher.title}
                width={144}
                height={144}
                className='w-48 h-36 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity'
                onClick={() => handleImageClick(voucher.imageUrl)}
              />
            ) : (
              <div className='w-48 h-36 bg-muted flex items-center justify-center rounded-md border'>
                <ImageIcon className='h-8 w-8 text-muted-foreground/50' />
              </div>
            )}
            {/* Title */}
            {voucher.title && (
              <p className='text-base text-foreground font-semibold'>
                {voucher.title}
              </p>
            )}
            {/* Code */}
            <div className='flex items-center justify-between gap-2'>
              <div className='flex gap-2 '>
                <Badge variant='outline' className='text-xs'>
                  {voucher.voucherCode}
                </Badge>
                <>
                  {isActive && <Badge className='bg-green-600'>Active</Badge>}
                  {isScheduled && <Badge variant='outline'>Scheduled</Badge>}
                  {isExpired && <Badge variant='secondary'>Expired</Badge>}
                </>
              </div>
              <Badge variant='default' className='text-xs'>
                {formatVoucherType(voucher.voucherType)}
              </Badge>
            </div>
            {/* Description */}
            {voucher.description && (
              <p className='text-sm line-clamp-3 text-muted-foreground'>
                {voucher.description}
              </p>
            )}

            {/* Key Stats */}
            <div className='space-y-3 pt-2 border-t border-primary/10'>
              {voucher.statistics && (
                <>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Package className='h-4 w-4 text-primary' />
                      <span className='text-xs font-semibold text-muted-foreground'>
                        Total
                      </span>
                    </div>
                    <span className='text-sm font-semibold text-foreground'>
                      {voucher.statistics.total}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle2 className='h-4 w-4 text-green-600' />
                      <span className='text-xs font-semibold text-muted-foreground'>
                        Used
                      </span>
                    </div>
                    <span className='text-sm font-semibold text-foreground'>
                      {voucher.statistics.used}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Ticket className='h-4 w-4 text-orange-600' />
                      <span className='text-xs font-semibold text-muted-foreground'>
                        Remaining
                      </span>
                    </div>
                    <span className='text-sm font-semibold text-foreground'>
                      {voucher.statistics.remaining}
                    </span>
                  </div>
                </>
              )}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Star className='h-4 w-4 text-primary' />
                  <span className='text-xs font-semibold text-muted-foreground'>
                    Price
                  </span>
                </div>
                <span className='text-sm font-semibold text-foreground'>
                  {voucher.pricePoint} pts
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <User className='h-4 w-4 text-primary' />
                  <span className='text-xs font-semibold text-muted-foreground'>
                    Limit/Person
                  </span>
                </div>
                <span className='text-sm font-semibold text-foreground'>
                  {voucher.userRedeemedLimit}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CalendarDaysIcon className='h-4 w-4 text-primary' />
                  <span className='text-xs font-semibold text-muted-foreground'>
                    Start Date
                  </span>
                </div>
                <span className='text-xs text-foreground'>
                  {formatDate(voucher.startDate)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CalendarDaysIcon className='h-4 w-4 text-primary' />
                  <span className='text-xs font-semibold text-muted-foreground'>
                    End Date
                  </span>
                </div>
                <span className='text-xs text-foreground'>
                  {formatDate(voucher.endDate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange History Card - Main Content */}
        <Card className='lg:col-span-3'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              <span className='text-lg font-semibold'>Exchange History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-hidden rounded-lg border border-primary/20'>
              {isLoadingExchangeHistory ? (
                <div className='flex items-center justify-center py-8 text-muted-foreground gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span className='text-sm'>Loading exchange history...</span>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader className='bg-muted/40'>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Point</TableHead>
                        <TableHead>Redeemed At</TableHead>
                        <TableHead>Used At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exchanges.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className='py-8 text-center text-sm text-muted-foreground'
                          >
                            No exchange history yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        exchanges.map((item: any) => (
                          <TableRow key={item.id} className='hover:bg-muted/20'>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <Image
                                  src={item.user.avatarUrl || ''}
                                  alt={item.user.fullName || ''}
                                  width={32}
                                  height={32}
                                  className='w-8 h-8 rounded-md border'
                                />
                                <span className='font-medium text-sm'>
                                  {item.user.firstName || ''}{' '}
                                  {item.user.lastName || ''}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className='text-sm'>
                              {item.userVoucherCode || '—'}
                            </TableCell>
                            <TableCell className='text-sm'>
                              <span className='font-medium text-sm'>
                                {item.pointSpent || 0} pts
                              </span>
                            </TableCell>
                            <TableCell className='text-sm text-muted-foreground'>
                              {formatDateTime(item.createdAt) || '—'}
                            </TableCell>
                            {item.usedAt ? (
                              <TableCell className='text-sm text-muted-foreground'>
                                {formatDateTime(item.usedAt) || '—'}
                              </TableCell>
                            ) : (
                              <TableCell className='text-sm text-muted-foreground'>
                                -
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {exchangesMeta && exchangesMeta.totalPages > 1 && (
                    <div className='flex items-center justify-between mt-6 px-4 py-4 border-t bg-background/40'>
                      <div className='text-sm text-muted-foreground'>
                        Showing{' '}
                        {(exchangesMeta.currentPage - 1) * exchangeLimit + 1} to{' '}
                        {Math.min(
                          exchangesMeta.currentPage * exchangeLimit,
                          exchangesMeta.totalItems
                        )}{' '}
                        of {exchangesMeta.totalItems} exchanges
                      </div>
                      <div className='flex items-center gap-2'>
                        <button
                          className='px-3 py-1 text-sm border rounded-md disabled:opacity-50'
                          onClick={() =>
                            setExchangePage((p) => Math.max(1, p - 1))
                          }
                          disabled={exchangesMeta.currentPage === 1}
                        >
                          Previous
                        </button>
                        <div className='text-sm text-muted-foreground px-2'>
                          Page {exchangesMeta.currentPage} of{' '}
                          {exchangesMeta.totalPages}
                        </div>
                        <button
                          className='px-3 py-1 text-sm border rounded-md disabled:opacity-50'
                          onClick={() =>
                            setExchangePage((p) =>
                              Math.min(exchangesMeta.totalPages, p + 1)
                            )
                          }
                          disabled={
                            exchangesMeta.currentPage ===
                            exchangesMeta.totalPages
                          }
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <>
      <DetailViewLayout
        title={'Voucher Details'}
        badges={''}
        onClose={() => {
          router.push(`/dashboard/business/locations/${locationId}/vouchers`);
        }}
        onEdit={() => {
          voucher.statistics?.used && voucher.statistics?.used > 0
            ? toast.error('Voucher has been used')
            : router.push(
                `/dashboard/business/locations/${locationId}/vouchers/${voucherId}/edit`
              );
        }}
        editLabel='Edit Voucher'
        mainContent={mainContent}
        location={voucher.location}
        onImageClick={handleImageClick}
      />
      <ImageViewer
        src={currentImageSrc}
        alt={voucher.title}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </>
  );
}
