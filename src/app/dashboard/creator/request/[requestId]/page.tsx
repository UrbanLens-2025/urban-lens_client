"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";

// --- Hooks ---
import { useEventRequestById } from "@/hooks/events/useEventRequestById";

// --- Types ---
import { EventRequest } from "@/types";

// --- UI Components ---
import { Loader2, ArrowLeft, Calendar, MapPin, User, FileText, ImageIcon, Layers, Users, Building, Ticket, CreditCard, Phone, Wallet, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { usePayForEventBooking } from "@/hooks/events/usePayForEventBooking";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

  // Payment hook
  const { mutate: payForBooking, isPending: isPaying } = usePayForEventBooking();

  // Only wait for request and location, tags are optional
  const isLoading = isLoadingRequest || (locationId && isLoadingLocation);
  
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

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (isError || !request) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500 font-medium">Error loading event request details.</div>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }
  
  // Location might not be available if locationId is missing
  if (!locationId) {
    return (
      <div className="text-center py-20">
        <div className="text-muted-foreground">Location information not available.</div>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }
  
  if (!location && !isLoadingLocation) {
    return (
      <div className="text-center py-20">
        <div className="text-muted-foreground">Unable to load location details.</div>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  // At this point, location should be available if locationId exists
  // But TypeScript doesn't know that, so we assert it's defined
  if (!location) {
    return null; // This shouldn't happen due to early returns, but TypeScript needs this
  }

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
                <div className="text-2xl font-bold">
                  {location?.bookingConfig 
                    ? formatCurrency(request.referencedLocationBooking?.amountToPay || "0", location.bookingConfig.currency)
                    : "N/A"}
                </div>
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
              {request.referencedLocationBooking?.dates && request.referencedLocationBooking.dates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">Requested Time Slots</p>
                    <Badge variant="secondary" className="text-xs">
                      {request.referencedLocationBooking.dates.length} slot{request.referencedLocationBooking.dates.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const sortedDates = [...request.referencedLocationBooking.dates].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
                      return sortedDates.map((d, i) => {
                        const startDate = new Date(d.startDateTime);
                        const endDate = new Date(d.endDateTime);
                        const prevDate = i > 0 ? new Date(sortedDates[i - 1].startDateTime) : null;
                        const isSameDay = prevDate && format(prevDate, "yyyy-MM-dd") === format(startDate, "yyyy-MM-dd");
                        
                        return (
                          <div 
                            key={i} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors",
                              !isSameDay && i > 0 && "mt-3 border-t-2 border-t-muted-foreground/20 pt-3"
                            )}
                          >
                            {!isSameDay && (
                              <div className="flex-shrink-0">
                                <div className="text-xs font-semibold text-muted-foreground">
                                  {format(startDate, "MMM dd")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(startDate, "EEEE")}
                                </div>
                              </div>
                            )}
                            {isSameDay && <div className="w-[70px]"></div>}
                            <div className="flex-1 flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="font-mono text-sm">
                                {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                              </span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} min
                              </Badge>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {location && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building /> Venue Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Venue Name" value={location.name} />
                <InfoRow label="Venue Address" value={location.addressLine} />
              {request.referencedLocationBooking && (
                <>
                  <InfoRow label="Booking Status" value={<Badge variant={statusVariant(request.referencedLocationBooking.status)}>{request.referencedLocationBooking.status}</Badge>} />
                  {location?.bookingConfig && (
                    <InfoRow 
                      label="Amount to Pay" 
                      value={formatCurrency(request.referencedLocationBooking.amountToPay || "0", location.bookingConfig.currency)} 
                    />
                  )}
                </>
              )}
                {request.referencedLocationBooking?.referencedTransactionId && (
                  <InfoRow label="Transaction" value={<span className="font-mono text-sm">{request.referencedLocationBooking.referencedTransactionId}</span>} />
                )}
              </CardContent>
            </Card>
          )}

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
                  {location?.bookingConfig && (
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
                      <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                        {formatCurrency(request.referencedLocationBooking?.amountToPay || "0", location.bookingConfig.currency)}
                      </p>
                    </div>
                  )}
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

          {/* Requester Info - Show if available from API (may not be in type definition) */}
          {(request as any).createdBy && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User /> Requester</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <img 
                    src={(request as any).createdBy?.avatarUrl || "/default-avatar.svg"} 
                    alt="avatar" 
                    className="h-10 w-10 rounded-full object-cover border" 
                  />
                  <div>
                    <div className="font-medium">
                      {(request as any).createdBy?.firstName || ""} {(request as any).createdBy?.lastName || ""}
                    </div>
                    <div className="text-xs text-muted-foreground">{(request as any).createdBy?.email || ""}</div>
                  </div>
                </div>
                {(request as any).createdBy?.phoneNumber && (
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> 
                      {(request as any).createdBy.phoneNumber}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {location && location.imageUrl && location.imageUrl.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> Location Images</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {location.imageUrl.slice(0, 4).map((url, index) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Location ${index + 1}`}
                    onClick={() => handleImageClick(url)}
                    className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </CardContent>
            </Card>
          )}
          
          {location && (location as any).latitude && (location as any).longitude && (
            <Card className="sticky top-6">
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin /> Location Map</CardTitle></CardHeader>
              <CardContent className="h-80 rounded-lg overflow-hidden">
                <GoogleMapsPicker 
                  position={{
                    lat: Number((location as any).latitude),
                    lng: Number((location as any).longitude),
                  }}
                  onPositionChange={() => {}} // Read-only mode
                />
              </CardContent>
            </Card>
          )}
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