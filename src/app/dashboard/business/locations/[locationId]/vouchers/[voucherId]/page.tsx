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
import { formatDate } from '@/lib/utils';

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
      <div className='flex gap-2 mb-4'>
        {Icon && <Icon className='h-4 w-4 text-muted-foreground mt-0.5' />}
        <div className='flex-1'>
          <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
          <div className='text-base text-foreground break-words'>{value}</div>
        </div>
      </div>
    );
  }

  const badges = (
    <>
      <Badge variant='outline'>{voucher.voucherCode}</Badge>
      {isActive && <Badge className='bg-green-600'>Active</Badge>}
      {isScheduled && <Badge variant='outline'>Scheduled</Badge>}
      {isExpired && <Badge variant='secondary'>Expired</Badge>}
    </>
  );

  const mainContent = (
    <>
      <Card className='border-primary/20 shadow-sm p-0 overflow-hidden'>
        <div className='flex flex-col lg:flex-row'>
          {/* Left: Voucher Image - Edge to Edge */}
          <div className='flex-shrink-0 w-full lg:w-80'>
            {voucher.imageUrl ? (
              <img
                src={voucher.imageUrl}
                alt={voucher.title}
                className='w-full h-full min-h-[400px] lg:min-h-full object-cover cursor-pointer hover:opacity-90 transition-opacity'
                onClick={() => handleImageClick(voucher.imageUrl)}
              />
            ) : (
              <div className='w-full h-full min-h-[400px] lg:min-h-full bg-muted flex items-center justify-center'>
                <ImageIcon className='h-16 w-16 text-muted-foreground/50' />
              </div>
            )}
          </div>

          {/* Right: Voucher Details */}
          <div className='flex-1 p-6 space-y-6'>
              {/* Voucher Name */}
              <div>
                <h2 className='text-2xl font-bold text-foreground mb-4'>{voucher.title}</h2>
              </div>

              {/* Description */}
              <div>
                <p className='text-base text-foreground leading-relaxed'>{voucher.description || 'No description provided'}</p>
              </div>

              {/* Voucher Config */}
              <div className='pt-4 border-t border-primary/10'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/10'>
                    <div className='flex items-center gap-2'>
                      <Layers className='h-4 w-4 text-primary' />
                      <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Type</span>
                    </div>
                    <p className='text-base font-semibold text-foreground'>{formatVoucherType(voucher.voucherType)}</p>
                  </div>
                  <div className='space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/10'>
                    <div className='flex items-center gap-2'>
                      <Zap className='h-4 w-4 text-primary' />
                      <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Quantity</span>
                    </div>
                    <p className='text-base font-semibold text-foreground'>{voucher.maxQuantity}</p>
                  </div>
                  <div className='space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/10'>
                    <div className='flex items-center gap-2'>
                      <Star className='h-4 w-4 text-primary' />
                      <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Price</span>
                    </div>
                    <p className='text-base font-semibold text-foreground'>{voucher.pricePoint} pts</p>
                  </div>
                  <div className='space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/10'>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-primary' />
                      <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>Limit per Person</span>
                    </div>
                    <p className='text-base font-semibold text-foreground'>{voucher.userRedeemedLimit}</p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className='pt-4 border-t border-primary/10'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='p-3 rounded-lg bg-primary/5 border border-primary/10'>
                    <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>Start Date</p>
                    <p className='text-base font-semibold text-foreground'>{formatDate(voucher.startDate)}</p>
                  </div>
                  <div className='p-3 rounded-lg bg-primary/5 border border-primary/10'>
                    <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>End Date</p>
                    <p className='text-base font-semibold text-foreground'>{formatDate(voucher.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </Card>

      <Card className='border-primary/20 shadow-sm p-0'>
        <CardHeader className='border-b border-primary/10 px-6 pt-6 pb-4'>
          <CardTitle className='flex items-center gap-2 text-primary'>
            <Clock className='h-5 w-5' />
            <span className='text-lg font-semibold'>Exchange History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='px-6 pb-6'>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Redeemed At</TableHead>
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
                            <div className='space-y-1'>
                              <div className='font-medium'>
                                {item.user?.fullName ||
                                  `${item.user?.firstName || ''} ${
                                    item.user?.lastName || ''
                                  }`.trim() ||
                                  'Unknown User'}
                              </div>
                              {item.user?.username && (
                                <div className='text-xs text-muted-foreground'>
                                  @{item.user.username}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='text-sm'>
                            {item.userVoucherCode || '—'}
                          </TableCell>
                          <TableCell className='text-sm'>
                            <Badge
                              variant={
                                item.status === 'REDEEMED'
                                  ? 'default'
                                  : 'outline'
                              }
                              className='text-xs'
                            >
                              {item.status || 'PENDING'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {item.redeemedAt || item.createdAt
                              ? formatDate(item.redeemedAt || item.createdAt)
                              : '—'}
                          </TableCell>
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
                          exchangesMeta.currentPage === exchangesMeta.totalPages
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
    </>
  );

  return (
    <>
      <DetailViewLayout
        title={voucher.title}
        badges={badges}
        onClose={() => {
          router.push(`/dashboard/business/locations/${locationId}/vouchers`);
        }}
        onEdit={() => {
          router.push(
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
