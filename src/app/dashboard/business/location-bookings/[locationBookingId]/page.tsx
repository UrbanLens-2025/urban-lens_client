"use client";

import type React from "react";
import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocationBookingById } from "@/hooks/locations/useLocationBookingById";
import { useApproveLocationBooking } from "@/hooks/locations/useApproveLocationBooking";
import { useRejectLocationBookings } from "@/hooks/locations/useRejectLocationBookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ImageViewer } from "@/components/shared/ImageViewer";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  User,
  ImageIcon,
  Calendar,
  Phone,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Globe,
  CreditCard,
  X,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatDocumentType } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";

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
    <div className="flex gap-3 mb-4">
      {Icon && (
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-base text-foreground">{value}</div>
      </div>
    </div>
  );
}

const getStatusBadge = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case "PAYMENT_RECEIVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Payment Received
        </Badge>
      );
    case "AWAITING_BUSINESS_PROCESSING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Processing
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case "SOFT_LOCKED":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Soft Locked
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() ||
            status}
        </Badge>
      );
  }
};

const formatCurrency = (amount: string, currency: string = "VND") => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
  }).format(num);
};

const formatDateTime = (iso: string) => {
  return format(new Date(iso), "MMM dd, yyyy HH:mm");
};

const formatBookingObject = (bookingObject: string | null | undefined): string => {
  if (!bookingObject) return "N/A";
  
  // Convert FOR_EVENT, FOR_OTHER, etc. to user-friendly format
  const formatted = bookingObject
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return formatted;
};


export default function LocationBookingDetailPage({
  params,
}: {
  params: Promise<{ locationBookingId: string }>;
}) {
  const { locationBookingId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"APPROVED" | "REJECTED" | null>(null);

  const { data: booking, isLoading, isError } =
    useLocationBookingById(locationBookingId);
  const approveBooking = useApproveLocationBooking();
  const rejectBookings = useRejectLocationBookings();

  const canProcess = booking?.status === "AWAITING_BUSINESS_PROCESSING";

  const handleProcessClick = (status: "APPROVED" | "REJECTED") => {
    setPendingStatus(status);
    setProcessDialogOpen(true);
  };

  // UUID validation helper
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleProcessConfirm = () => {
    if (!pendingStatus || !booking) return;

    const bookingId = booking.id;
    if (!bookingId || typeof bookingId !== 'string' || !isValidUUID(bookingId)) {
      console.error('Invalid booking ID:', bookingId);
      return;
    }

    if (pendingStatus === "APPROVED") {
          approveBooking.mutate(bookingId, {
            onSuccess: () => {
              setProcessDialogOpen(false);
              setPendingStatus(null);
          },
        });
    } else {
      // Reject the current booking
      rejectBookings.mutate([bookingId], {
        onSuccess: () => {
          setProcessDialogOpen(false);
          setPendingStatus(null);
        },
      });
    }
  };

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading booking details</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar /> Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="Booking Status"
                value={getStatusBadge(booking.status)}
              />
              <InfoRow
                label="Amount"
                value={
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(booking.amountToPay)}
                  </span>
                }
                icon={DollarSign}
              />
              <InfoRow
                label="Booking Type"
                value={formatBookingObject(booking.bookingObject)}
              />
              <InfoRow
                label="Created At"
                value={formatDateTime(booking.createdAt)}
                icon={Calendar}
              />
              <InfoRow
                label="Last Updated"
                value={formatDateTime(booking.updatedAt)}
                icon={Calendar}
              />
              {booking.softLockedUntil && (
                <InfoRow
                  label="Soft Locked Until"
                  value={formatDateTime(booking.softLockedUntil)}
                  icon={Clock}
                />
              )}

              {/* Booking Time Slots Table */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    Booking Time Slots
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {booking.dates.length} slot{booking.dates.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Date</TableHead>
                        <TableHead className="w-[100px]">Day</TableHead>
                        <TableHead className="w-[100px]">Start Time</TableHead>
                        <TableHead className="w-[100px]">End Time</TableHead>
                        <TableHead className="w-[100px]">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const sortedDates = [...booking.dates].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
                        return sortedDates.map((dateSlot, index) => {
                        const startDate = new Date(dateSlot.startDateTime);
                        const endDate = new Date(dateSlot.endDateTime);
                        const durationMs = endDate.getTime() - startDate.getTime();
                        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                        const durationText = durationHours > 0 
                          ? `${durationHours}h ${durationMinutes > 0 ? `${durationMinutes}m` : ''}`.trim()
                          : `${durationMinutes}m`;
                        
                        // Check if this is a different date from the previous slot
                        const prevSlot = index > 0 ? sortedDates[index - 1] : null;
                        const prevDate = prevSlot ? format(new Date(prevSlot.startDateTime), "yyyy-MM-dd") : null;
                        const currentDate = format(startDate, "yyyy-MM-dd");
                        const isNewDate = prevDate !== currentDate;
                        
                        return (
                          <TableRow 
                            key={index}
                            className={isNewDate ? "border-t-2 border-t-muted" : ""}
                          >
                            <TableCell className="font-medium">
                              {format(startDate, "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(startDate, "EEEE")}
                            </TableCell>
                            <TableCell className="font-mono">
                              {format(startDate, "HH:mm")}
                            </TableCell>
                            <TableCell className="font-mono">
                              {format(endDate, "HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {durationText}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      });})()}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Request Information */}
          {booking.referencedEventRequest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText /> Event Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Event Name"
                  value={booking.referencedEventRequest.eventName}
                />
                <InfoRow
                  label="Event Description"
                  value={booking.referencedEventRequest.eventDescription}
                />
                <InfoRow
                  label="Expected Participants"
                  value={
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {booking.referencedEventRequest.expectedNumberOfParticipants}{" "}
                      people
                    </div>
                  }
                  icon={Users}
                />
                <InfoRow
                  label="Allow Tickets"
                  value={
                    <Badge variant={booking.referencedEventRequest.allowTickets ? "default" : "outline"}>
                      {booking.referencedEventRequest.allowTickets ? "Yes" : "No"}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Special Requirements"
                  value={booking.referencedEventRequest.specialRequirements || "None"}
                />
                <InfoRow
                  label="Event Status"
                  value={
                    <Badge variant="outline">
                      {booking.referencedEventRequest.status}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Event Request ID"
                  value={
                    <span className="font-mono text-sm">
                      {booking.referencedEventRequest.id.substring(0, 8)}...
                    </span>
                  }
                />
                <InfoRow
                  label="Created At"
                  value={formatDateTime(booking.referencedEventRequest.createdAt)}
                  icon={Calendar}
                />
                <InfoRow
                  label="Last Updated"
                  value={formatDateTime(booking.referencedEventRequest.updatedAt)}
                  icon={Calendar}
                />

                {/* Event Validation Documents */}
                {booking.referencedEventRequest.eventValidationDocuments &&
                  booking.referencedEventRequest.eventValidationDocuments.length >
                    0 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">
                        Event Validation Documents
                      </p>
                      <div className="space-y-4">
                        {booking.referencedEventRequest.eventValidationDocuments.map(
                          (doc, docIndex) => (
                            <div key={docIndex} className="space-y-2">
                              <Badge variant="outline">
                                {formatDocumentType(doc.documentType)}
                              </Badge>
                              <div className="grid grid-cols-2 gap-2">
                                {doc.documentImageUrls.map((url, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={url}
                                    alt={`${formatDocumentType(doc.documentType)} ${imgIndex + 1}`}
                                    onClick={() => handleImageClick(url)}
                                    className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="Full Address"
                value={`${booking.location.addressLine}, ${booking.location.addressLevel1}, ${booking.location.addressLevel2}`}
              />
              <InfoRow
                label="Radius"
                value={`${booking.location.radiusMeters} meters`}
              />

              {/* Location Map */}
              <div className="mt-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Location on Map
                </p>
                <div className="h-64 w-full rounded-lg overflow-hidden border">
                  <GoogleMapsPicker
                    position={{
                      lat: parseFloat(booking.location.latitude),
                      lng: parseFloat(booking.location.longitude),
                    }}
                    onPositionChange={() => {}}
                    radiusMeters={booking.location.radiusMeters}
                    center={{
                      lat: parseFloat(booking.location.latitude),
                      lng: parseFloat(booking.location.longitude),
                    }}
                  />
                </div>
              </div>

              {/* Location Images */}
              {booking.location.imageUrl && booking.location.imageUrl.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">
                    Location Images
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {booking.location.imageUrl.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Location ${index + 1}`}
                        onClick={() => handleImageClick(url)}
                        className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Creator Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User /> Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={
                    booking.createdBy.avatarUrl ||
                    booking.createdBy.creatorProfile?.avatarUrl ||
                    "/default-avatar.svg"
                  }
                  alt="avatar"
                  className="h-12 w-12 rounded-full object-cover border"
                />
                <div>
                  <div className="font-medium">
                    {booking.createdBy.firstName} {booking.createdBy.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.createdBy.email}
                  </div>
                </div>
              </div>

              {booking.createdBy.phoneNumber && (
                <InfoRow
                  label="Phone"
                  value={booking.createdBy.phoneNumber}
                  icon={Phone}
                />
              )}

              {booking.createdBy.creatorProfile && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <InfoRow
                    label="Display Name"
                    value={booking.createdBy.creatorProfile.displayName}
                  />
                  {booking.createdBy.creatorProfile.description && (
                    <InfoRow
                      label="Description"
                      value={booking.createdBy.creatorProfile.description}
                    />
                  )}
                  {booking.createdBy.creatorProfile.social &&
                    booking.createdBy.creatorProfile.social.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Social Links
                        </p>
                        <div className="space-y-1">
                          {booking.createdBy.creatorProfile.social.map(
                            (social, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Link
                                  href={social.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline truncate"
                                >
                                  {social.platform}: {social.url}
                                  {social.isMain && " (Main)"}
                                </Link>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Information */}
          {booking.referencedTransaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard /> Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Transaction ID"
                  value={
                    <span className="font-mono text-sm">
                      {booking.referencedTransaction.id.substring(0, 8)}...
                    </span>
                  }
                />
                <InfoRow
                  label="Amount"
                  value={
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(
                        booking.referencedTransaction.amount,
                        booking.referencedTransaction.currency
                      )}
                    </span>
                  }
                  icon={DollarSign}
                />
                <InfoRow
                  label="Type"
                  value={booking.referencedTransaction.type}
                />
                <InfoRow
                  label="Status"
                  value={
                    <Badge
                      variant={
                        booking.referencedTransaction.status === "COMPLETED"
                          ? "default"
                          : "outline"
                      }
                    >
                      {booking.referencedTransaction.status}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Created At"
                  value={formatDateTime(booking.referencedTransaction.createdAt)}
                  icon={Calendar}
                />
                <Link
                  href={`/dashboard/business/wallet/${booking.referencedTransaction.id}`}
                >
                  <Button variant="outline" className="w-full">
                    View Transaction Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/business/locations/${booking.locationId}`}>
                <Button variant="outline" className="w-full mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Location
                </Button>
              </Link>

              {/* Process Booking Actions */}
              {canProcess && (
                <>
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleProcessClick("APPROVED")}
                    disabled={approveBooking.isPending || rejectBookings.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Booking
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleProcessClick("REJECTED")}
                    disabled={approveBooking.isPending || rejectBookings.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Booking
                  </Button>
                </>
              )}
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

      {/* Process Booking Dialog */}
      <AlertDialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingStatus === "APPROVED" ? (
                <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Booking
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-600" />
                  Reject Booking
                </>
              )}
            </AlertDialogTitle>
            <div className="text-muted-foreground text-sm space-y-3">
                <p>
                  Are you sure you want to{" "}
                  <span className="font-semibold">
                    {pendingStatus === "APPROVED" ? "approve" : "reject"}
                  </span>{" "}
                  this location booking? This action cannot be undone.
                </p>

              {/* Booking Summary */}
                <div className="border-t pt-3 space-y-1.5">
                  <div className="text-sm font-semibold">Booking Summary:</div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>
                      <span className="font-medium">Event:</span>{" "}
                      {booking?.referencedEventRequest?.eventName || formatBookingObject(booking?.bookingObject) || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Time Slots:</span>
                      <div className="ml-4 mt-1.5 space-y-1.5">
                        {(() => {
                          const sortedDates = [...(booking?.dates || [])].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
                          return sortedDates.map((dateSlot, idx) => {
                            const startDate = new Date(dateSlot.startDateTime);
                            const endDate = new Date(dateSlot.endDateTime);
                            const isSameDay = idx > 0 && 
                              format(new Date(sortedDates[idx - 1].startDateTime), "yyyy-MM-dd") === 
                              format(startDate, "yyyy-MM-dd");
                            
                            return (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                {!isSameDay && (
                                  <span className="font-medium text-muted-foreground min-w-[90px]">
                                    {format(startDate, "MMM dd")}:
                                  </span>
                                )}
                                {isSameDay && <span className="min-w-[90px]"></span>}
                                <span className="font-mono text-foreground">
                                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>{" "}
                      {formatCurrency(booking?.amountToPay || "0")}
                    </div>
                  </div>
                </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveBooking.isPending || rejectBookings.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessConfirm}
              disabled={approveBooking.isPending || rejectBookings.isPending}
              className={
                pendingStatus === "REJECTED"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {approveBooking.isPending || rejectBookings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm {pendingStatus === "APPROVED" ? "Approval" : "Rejection"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

