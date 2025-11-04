"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocationBookingById } from "@/hooks/locations/useLocationBookingById";
import { useProcessLocationBooking } from "@/hooks/locations/useProcessLocationBooking";
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
  const processBooking = useProcessLocationBooking();

  const canProcess = booking?.status === "AWAITING_BUSINESS_PROCESSING";

  const handleProcessClick = (status: "APPROVED" | "REJECTED") => {
    setPendingStatus(status);
    setProcessDialogOpen(true);
  };

  const handleProcessConfirm = () => {
    if (pendingStatus && booking) {
      processBooking.mutate(
        {
          locationBookingId: booking.id,
          payload: { status: pendingStatus },
        },
        {
          onSuccess: () => {
            setProcessDialogOpen(false);
            setPendingStatus(null);
          },
        }
      );
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
          <div>
            <h1 className="text-3xl font-bold">
              {booking.referencedEventRequest.eventName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Booking ID:{" "}
              <span className="font-mono">{booking.id.substring(0, 8)}...</span>
            </p>
          </div>
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
                label="Booking Object"
                value={booking.bookingObject}
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

              {/* Booking Dates */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Booking Time Slots
                </p>
                <div className="space-y-2">
                  {booking.dates.map((dateSlot, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {formatDateTime(dateSlot.startDateTime)} -{" "}
                          {format(new Date(dateSlot.endDateTime), "HH:mm")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(dateSlot.startDateTime), "EEEE, MMMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Request Information */}
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
                value={booking.referencedEventRequest.specialRequirements}
              />
              <InfoRow
                label="Event Status"
                value={
                  <Badge variant="outline">
                    {booking.referencedEventRequest.status}
                  </Badge>
                }
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
                            <Badge variant="outline">{doc.documentType}</Badge>
                            <div className="grid grid-cols-2 gap-2">
                              {doc.documentImageUrls.map((url, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={url}
                                  alt={`${doc.documentType} ${imgIndex + 1}`}
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

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Location Name" value={booking.location.name} />
              <InfoRow
                label="Description"
                value={booking.location.description}
              />
              <InfoRow label="Address" value={booking.location.addressLine} />
              <InfoRow
                label="Full Address"
                value={`${booking.location.addressLine}, ${booking.location.addressLevel1}, ${booking.location.addressLevel2}`}
              />
              <InfoRow
                label="Coordinates"
                value={`${booking.location.latitude}, ${booking.location.longitude}`}
              />
              <InfoRow
                label="Ownership Type"
                value={booking.location.ownershipType}
              />
              <InfoRow
                label="Radius"
                value={`${booking.location.radiusMeters} meters`}
              />
              <InfoRow
                label="Visible on Map"
                value={
                  <Badge
                    variant={booking.location.isVisibleOnMap ? "default" : "outline"}
                  >
                    {booking.location.isVisibleOnMap ? "Yes" : "No"}
                  </Badge>
                }
              />

              {/* Location Images */}
              {booking.location.imageUrl && booking.location.imageUrl.length > 0 && (
                <div className="mt-6">
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
                    disabled={processBooking.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Booking
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleProcessClick("REJECTED")}
                    disabled={processBooking.isPending}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === "APPROVED" ? "Approve Booking" : "Reject Booking"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {pendingStatus === "APPROVED" ? "approve" : "reject"} this location
              booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processBooking.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessConfirm}
              disabled={processBooking.isPending}
              className={
                pendingStatus === "REJECTED"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {processBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

