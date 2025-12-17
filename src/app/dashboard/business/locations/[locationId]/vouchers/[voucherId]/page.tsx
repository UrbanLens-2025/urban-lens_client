"use client";

import type React from "react";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { useLocationVoucherById } from "@/hooks/vouchers/useLocationVoucherById";
import { useLocationTabs } from "@/contexts/LocationTabContext";

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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { DetailViewLayout } from "@/components/shared/DetailViewLayout";

const formatVoucherType = (voucherType: string): string => {
  if (voucherType === 'public') return 'Free Voucher';
  if (voucherType === 'mission_only') return 'Exchange Voucher';
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
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  const {
    data: voucher,
    isLoading,
    isError,
  } = useLocationVoucherById(voucherId);

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  // Update tab name when voucher data loads
  useEffect(() => {
    if (voucher && voucher.title) {
      openVoucherDetailTab(voucherId, 'View Voucher');
    }
  }, [voucher, voucherId, openVoucherDetailTab]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !voucher) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
        <p>We couldn&apos;t load this voucher. It may have been removed.</p>
      </div>
    );
  }

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

      {voucher.imageUrl && (
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
              className='w-full max-w-md h-auto object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => handleImageClick(voucher.imageUrl)}
            />
          </CardContent>
        </Card>
      )}
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
