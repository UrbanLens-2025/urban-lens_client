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
      <Card>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* Col 1: Voucher Details */}
            <section className='space-y-4 md:col-span-1'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Ticket className='h-5 w-5' />
                <span>Voucher Details</span>
              </h3>
              <InfoRow label='Description' value={voucher.description} />
              <div className='flex items-center gap-10 mt-6'>
                <div className='flex flex-col'>
                  <InfoRow
                    label='Type'
                    value={formatVoucherType(voucher.voucherType)}
                    icon={Layers}
                  />
                  <InfoRow
                    label='Quantity'
                    value={voucher.maxQuantity}
                    icon={Zap}
                  />
                </div>
                <div className='flex flex-col'>
                  <InfoRow
                    label='Price'
                    value={`${voucher.pricePoint} pts`}
                    icon={Star}
                  />
                  <InfoRow
                    label='Limit Redeem'
                    value={voucher.userRedeemedLimit}
                    icon={User}
                  />
                </div>
              </div>
            </section>

            {/* Col 2: Duration */}
            <section className='space-y-4 md:col-span-1'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <CalendarDaysIcon className='h-5 w-5' />
                <span>Duration</span>
              </h3>
              <div className='space-y-4'>
                <InfoRow
                  label='Start Date'
                  value={formatDate(voucher.startDate)}
                />
                <InfoRow label='End Date' value={formatDate(voucher.endDate)} />
              </div>
            </section>

            {/* Col 3: Voucher Image */}
            {voucher.imageUrl && (
              <section className='space-y-4 md:col-span-1'>
                <h3 className='flex items-center gap-2 text-lg font-semibold'>
                  <ImageIcon className='h-5 w-5' />
                  <span>Voucher Image</span>
                </h3>
                <div>
                  <img
                    src={voucher.imageUrl}
                    alt={voucher.title}
                    className='w-full max-w-xs md:max-w-full h-auto object-cover rounded-md border p-2'
                    onClick={() => handleImageClick(voucher.imageUrl)}
                  />
                </div>
              </section>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            <span className='text-lg font-semibold'>Exchange History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-lg border border-border/60'>
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
                      <TableHead>Contact</TableHead>
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
                          <TableCell>
                            <div className='text-sm'>
                              {item.user?.email || item.user?.phoneNumber || (
                                <span className='text-muted-foreground'>—</span>
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
