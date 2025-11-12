"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

import { useLocationVoucherById } from "@/hooks/vouchers/useLocationVoucherById";

// --- Import UI Components ---
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  ImageIcon,
  Layers,
  Zap,
  Star,
  Ticket,
  Edit,
  User,
  Eye,
  Ruler,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { ImageViewer } from "@/components/shared/ImageViewer";

// --- Component con ---
function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex gap-3 mb-4">
      {Icon && (
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-base text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

// --- Component chính ---
export default function VoucherDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string; voucherId: string }>;
}) {
  const { locationId, voucherId } = use(params);
  const router = useRouter();

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (isError || !voucher) {
    return (
      <div className="text-center py-20 text-red-500">
        Error loading voucher details.
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

  return (
    <div className="space-y-8">
      {/* --- Header --- */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Badge variant="outline">
            {voucher.voucherCode}
          </Badge>
          {isActive && <Badge className="bg-green-600">Active</Badge>}
          {isScheduled && <Badge variant="outline">Scheduled</Badge>}
          {isExpired && <Badge variant="secondary">Expired</Badge>}
        </div>
        <Link
          href={`/dashboard/business/locations/${locationId}/vouchers/${voucherId}/edit`}
        >
          <Button>
            <Edit className="mr-2 h-4 w-4" /> Edit Voucher
          </Button>
        </Link>
      </div>

      {/* --- Grid Nội dung --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Trái */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voucher Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket /> Voucher Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={voucher.description} />
              <InfoRow label="Type" value={voucher.voucherType} icon={Layers} />
              <InfoRow
                label="Price"
                value={`${voucher.pricePoint} points`}
                icon={Star}
              />
              <InfoRow
                label="Max Quantity"
                value={voucher.maxQuantity}
                icon={Zap}
              />
              <InfoRow
                label="Limit Per User"
                value={voucher.userRedeemedLimit}
                icon={User}
              />
            </CardContent>
          </Card>

          {/* Thời gian hiệu lực */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar /> Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Start Date"
                value={format(new Date(voucher.startDate), "PPP p")}
              />
              <InfoRow
                label="End Date"
                value={format(new Date(voucher.endDate), "PPP p")}
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock /> Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Created At"
                value={format(new Date(voucher.createdAt), "PPP p")}
              />
              <InfoRow
                label="Updated At"
                value={format(new Date(voucher.updatedAt), "PPP p")}
              />
            </CardContent>
          </Card>

          {/* Ảnh Voucher */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon /> Voucher Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={voucher.imageUrl}
                alt={voucher.title}
                className="w-full max-w-sm h-auto object-cover rounded-md border cursor-pointer"
                onClick={() => handleImageClick(voucher.imageUrl)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cột Phải */}
        <div className="lg:col-span-1 space-y-6">
          {/* Location Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building /> Associated Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Location Name" value={voucher.location?.name} />
              <InfoRow label="Address" value={voucher.location?.addressLine} />
              <InfoRow
                label="District/Ward"
                value={voucher.location?.addressLevel1}
              />
              <InfoRow
                label="Province/City"
                value={voucher.location?.addressLevel2}
              />
              <InfoRow
                label="Radius (m)"
                value={voucher.location?.radiusMeters}
                icon={Ruler}
              />
              <InfoRow
                label="Visible on Map"
                value={voucher.location?.isVisibleOnMap ? "Yes" : "No"}
                icon={Eye}
              />

              {/* Ảnh địa điểm */}
              {voucher.location?.imageUrl?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Location Images
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {voucher.location?.imageUrl.map((url: string) => (
                      <img
                        key={url}
                        src={url}
                        alt="Location"
                        onClick={() => handleImageClick(url)}
                        className="w-24 h-24 rounded-md border object-cover cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bản đồ */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Location Map
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 rounded-lg overflow-hidden">
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- Modal Phóng to ảnh --- */}
      <ImageViewer
        src={currentImageSrc}
        alt={voucher.title}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}
