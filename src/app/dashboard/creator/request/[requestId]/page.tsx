"use client";

import type React from "react";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// --- Hooks ---
import { useEventRequestById } from "@/hooks/events/useEventRequestById";
import { useTags } from "@/hooks/tags/useTags"; // Vẫn cần hook này (nếu `BookableLocation` có `tags`)

// --- Types ---
import { EventRequest, PaginatedData, Tag, BookableLocation } from "@/types";

// --- UI Components ---
import { Loader2, ArrowLeft, Calendar, MapPin, User, FileText, ImageIcon, Layers, Zap, Users, Building, Ticket, CreditCard, Phone, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { usePayForEventBooking } from "@/hooks/events/usePayForEventBooking";

// --- Component con: InfoRow ---
function InfoRow({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ComponentType<{ className?: string }> }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 mb-4">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-base text-foreground">{value}</div>
      </div>
    </div>
  );
}

// --- Component Trang Chính ---
export default function EventRequestDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  // 1. Gọi hook chính để lấy Event Request
  const { data: request, isLoading: isLoadingRequest, isError } = useEventRequestById(requestId);
  
  // 2. Lấy locationId từ request
  const locationId = request?.referencedLocationBooking?.locationId;

  // 3. Gọi hook phụ để lấy chi tiết Location (tên, địa chỉ, v.v.)
  const { data: location, isLoading: isLoadingLocation } = useBookableLocationById(locationId);
  
  const { data: allTagsResponse, isLoading: isLoadingTags } = useTags();

  // Payment hook
  const { mutate: payForBooking, isPending: isPaying } = usePayForEventBooking();

  const isLoading = isLoadingRequest || isLoadingLocation || isLoadingTags;
  
  // Check if payment is needed
  const needsPayment = request?.status?.toUpperCase() === "PROCESSED";

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatCurrency = (amount: string | number, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(num);
  };

  const statusVariant = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'CONFIRMED' || s === 'APPROVED' || s === 'PAYMENT_RECEIVED') return 'default' as const;
    if (s === 'PENDING' || s === 'UNDER_REVIEW' || s === 'SOFT_LOCKED' || s === 'PROCESSED') return 'secondary' as const;
    if (s === 'REJECTED' || s === 'CANCELLED') return 'destructive' as const;
    return 'secondary' as const;
  };

  const handlePayNow = () => {
    if (request?.id) {
      payForBooking(request.id);
    }
  };

  // Xử lý Tags (nếu `location` có `tags`)
//   const tagsMap = useMemo(() => {
//       const map = new Map<number, Tag>();
//       const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
//       allTags.forEach((tag) => map.set(tag.id, tag));
//       return map;
//     }, [allTagsResponse]);
  
//     const tags = useMemo(() => {
//       if (!request?.tags || !tagsMap) {
//         return [];
//       }
//       return request.tags
//         .map((tagLink) => tagsMap.get(tagLink.tagId))
//         .filter((tag): tag is Tag => !!tag)
//         .map((tag) => ({ tag: tag }));
//     }, [request?.tags, tagsMap]);


  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (isError || !request || !location) {
    return <div className="text-center py-20 text-red-500">Error loading details.</div>;
  }

//   const position = {
//     lat: location.latitude,
//     lng: location.longitude,
//   };

  return (
    <div className="space-y-8 p-6">
      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{request.eventName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Booking for: <strong>{location.name}</strong>
            </p>
          </div>
          <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
        </div>
      </div>

      {/* --- Grid Nội dung --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Trái */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/>Expected</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{request.expectedNumberOfParticipants}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/>Slots</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{request.referencedLocationBooking?.dates?.length || 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4"/>Amount</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(request.referencedLocationBooking.amountToPay, location.bookingConfig.currency)}</div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Layers /> Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={request.eventDescription} />
              <InfoRow label="Expected Attendees" value={request.expectedNumberOfParticipants} icon={Users} />
              <InfoRow label="Allow Ticketing" value={request.allowTickets ? "Yes" : "No"} icon={Ticket} />
              <InfoRow label="Special Requirements" value={request.specialRequirements} />
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Requested Time Slots</p>
                <div className="flex flex-wrap gap-2">
                  {request.referencedLocationBooking.dates.map((d, i) => (
                    <Badge key={i} variant="secondary" className="whitespace-nowrap">
                      {formatDateTime(d.startDateTime)} - {formatDateTime(d.endDateTime)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building /> Venue Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Venue Name" value={location.name} />
              <InfoRow label="Venue Address" value={location.addressLine} />
              <InfoRow label="Booking Status" value={<Badge variant={statusVariant(request.referencedLocationBooking.status)}>{request.referencedLocationBooking.status}</Badge>} />
              <InfoRow label="Amount to Pay" value={formatCurrency(request.referencedLocationBooking.amountToPay, location.bookingConfig.currency)} />
              {request.referencedLocationBooking.referencedTransactionId && (
                <InfoRow label="Transaction" value={<span className="font-mono text-sm">{request.referencedLocationBooking.referencedTransactionId}</span>} />
              )}
            </CardContent>
          </Card>

          {request.eventValidationDocuments && request.eventValidationDocuments.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Validation Documents</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {request.eventValidationDocuments[0]?.documentImageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Document ${index + 1}`}
                    onClick={() => handleImageClick(url)}
                    className="w-48 h-48 object-cover rounded-md border cursor-pointer"
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cột Phải */}
        <div className="lg:col-span-1 space-y-6">
          {/* Payment Card - Show when status is PROCESSED */}
          {needsPayment && (
            <Card className="border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <Wallet className="h-5 w-5" />
                  Payment Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    Your event request has been processed. Please complete payment to confirm your booking.
                  </p>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      {formatCurrency(request.referencedLocationBooking.amountToPay, location.bookingConfig.currency)}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handlePayNow} 
                  disabled={isPaying}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  size="lg"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Now
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-amber-700 dark:text-amber-300">
                  Payment will be deducted from your wallet balance
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User /> Requester</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <img src={request.createdBy?.avatarUrl || "/default-avatar.svg"} alt="avatar" className="h-10 w-10 rounded-full object-cover border" />
                <div>
                  <div className="font-medium">{request.createdBy?.firstName} {request.createdBy?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{request.createdBy?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {request.createdBy?.phoneNumber}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> Location Images</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {location.imageUrl.slice(0, 4).map((url, index) => ( // Chỉ hiển thị 4 ảnh
                <img
                  key={index}
                  src={url || "/placeholder.svg"}
                  alt={`Location ${index + 1}`}
                  onClick={() => handleImageClick(url)}
                  className="w-full h-32 object-cover rounded-md border cursor-pointer"
                />
              ))}
            </CardContent>
          </Card>
          
          <Card className="sticky top-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin /> Location Map</CardTitle></CardHeader>
            <CardContent className="h-80 rounded-lg overflow-hidden">
              {/* <GoogleMapsPicker 
                position={position}
                onPositionChange={() => {}} // Chế độ chỉ xem
              /> */}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <ImageViewer
        src={currentImageSrc}
        alt="Enlarged preview"
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}