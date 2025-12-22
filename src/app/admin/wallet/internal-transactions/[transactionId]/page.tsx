"use client";

import { useRouter, useParams } from "next/navigation";
import { useAdminInternalWalletTransactionById } from "@/hooks/admin/useAdminInternalWalletTransactionById";
import { useAdminWallets } from "@/hooks/admin/useAdminWallets";
import { useAdminTicketOrderById } from "@/hooks/admin/useAdminTicketOrderById";
import { useAdminLocationBookingById } from "@/hooks/admin/useAdminLocationBookingById";
import { useEventByIdForAdmin } from "@/hooks/admin/useEventByIdForAdmin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wallet,
  ArrowRight,
  Calendar,
  Hash,
  User,
  Building2,
  Lock,
  Receipt,
  NotepadText,
  Ticket,
  ShoppingCart,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import LoadingCustom from "@/components/shared/LoadingCustom";
import ErrorCustom from "@/components/shared/ErrorCustom";

// --- Helpers ---
const formatDateTime = (d: string) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

const formatCurrency = (v: string | number, currency: string = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(Number(v));


interface WalletOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  avatarUrl?: string | null;
}

interface WalletInfoCardProps {
  walletOwner: WalletOwner | null;
  isSystem: boolean;
  isEscrow: boolean;
  label: string;
  isSource: boolean;
}

function WalletInfoCard({
  walletOwner,
  isSystem,
  isEscrow,
  label,
  isSource,
}: WalletInfoCardProps) {
  return (
    <Card className="h-full border-2 border-primary/10 shadow-lg">
      <CardHeader className="border-b border-primary/10">
        <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          {isSource ? (
            <ArrowRight className="h-4 w-4 rotate-180 text-orange-600" />
          ) : (
            <ArrowRight className="h-4 w-4 text-green-600" />
          )}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSystem ? (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-2 border-blue-200 dark:border-blue-800">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">System Wallet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Platform revenue
              </p>
            </div>
          </div>
        ) : isEscrow ? (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center border-2 border-green-200 dark:border-green-800">
              <Lock className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">Escrow Wallet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Funds held in escrow
              </p>
            </div>
          </div>
        ) : walletOwner ? (
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={walletOwner.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {walletOwner.firstName?.[0] || ""}
                {walletOwner.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg text-foreground truncate">
                {walletOwner.firstName} {walletOwner.lastName}
              </p>
              <p className="text-sm text-muted-foreground truncate mt-1">
                {walletOwner.email}
              </p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {walletOwner.role}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border-2">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-foreground">
                Unknown Wallet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Owner information not available
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminInternalWalletTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const router = useRouter();
  const transactionId = params?.transactionId || "";

  // Fetch transaction
  const {
    data: transaction,
    isLoading: isLoadingTx,
    isError: isErrorTx,
  } = useAdminInternalWalletTransactionById(transactionId);

  // Fetch system and escrow wallets to identify them
  const {
    systemWallet,
    escrowWallet,
    isLoading: isLoadingWallets,
  } = useAdminWallets();

  // Determine wallet types and get referencedInitType/Id before early returns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = transaction as any;
  const referencedInitType = tx?.referencedInitType;
  const referencedInitId = tx?.referencedInitId;

  // Fetch ticket order if referencedInitType is TICKET_ORDER (must be before early returns)
  const {
    data: ticketOrder,
    isLoading: isLoadingTicketOrder,
  } = useAdminTicketOrderById(
    referencedInitType === "TICKET_ORDER" ? referencedInitId : null
  );

  // Fetch location booking if referencedInitType is LOCATION_BOOKING (must be before early returns)
  const {
    data: locationBooking,
    isLoading: isLoadingLocationBooking,
  } = useAdminLocationBookingById(
    referencedInitType === "LOCATION_BOOKING" ? referencedInitId : null
  );

  // Fetch event if referencedInitType is EVENT (must be before early returns)
  const {
    data: event,
    isLoading: isLoadingEvent,
  } = useEventByIdForAdmin(
    referencedInitType === "EVENT" ? referencedInitId || "" : ""
  );

  const isLoading = isLoadingTx || isLoadingWallets;

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingCustom />
      </PageContainer>
    );
  }

  if (isErrorTx || !transaction) {
    return (
      <PageContainer>
        <ErrorCustom />
      </PageContainer>
    );
  }

  // Determine wallet types
  const sourceWalletId = tx.sourceWalletId || "";
  const destinationWalletId = tx.destinationWalletId || "";
  const sourceWalletOwner = tx.sourceWalletOwner as WalletOwner | null;
  const destinationWalletOwner =
    tx.destinationWalletOwner as WalletOwner | null;

  const isSourceSystem = !!(systemWallet && sourceWalletId === systemWallet.id);
  const isSourceEscrow = !!(escrowWallet && sourceWalletId === escrowWallet.id);
  const isDestinationSystem = !!(
    systemWallet && destinationWalletId === systemWallet.id
  );
  const isDestinationEscrow = !!(
    escrowWallet && destinationWalletId === escrowWallet.id
  );

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="group hover:bg-muted transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Back
        </Button>
      </div>

      {/* Transaction Amount Card */}
      <Card className="mb-6 border-2 border-primary/20 shadow-xl bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <CardDescription className="text-sm font-semibold mb-2 text-muted-foreground">
                Transaction amount
              </CardDescription>
              <div className="text-5xl font-black tracking-tight text-foreground">
                {formatCurrency(transaction.amount, transaction.currency)}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Wallet className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <span className="font-mono text-sm text-muted-foreground break-all">
                Transaction ID: {transaction.id}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDateTime(transaction.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-primary/10 gap-3'>
        <CardHeader className='pb-0'>
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <NotepadText />
            Note
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <span className="font-mono text-sm break-all">
                {transaction.note}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source and Destination Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <WalletInfoCard
          walletOwner={sourceWalletOwner}
          isSystem={isSourceSystem}
          isEscrow={isSourceEscrow}
          label="Source Wallet"
          isSource={true}
        />
        <WalletInfoCard
          walletOwner={destinationWalletOwner}
          isSystem={isDestinationSystem}
          isEscrow={isDestinationEscrow}
          label="Destination Wallet"
          isSource={false}
        />
      </div>
      <Separator/>

      {/* Ticket Order Section */}
      {referencedInitType === "TICKET_ORDER" && (
        <div className="mt-6">
          {isLoadingTicketOrder ? (
            <Card>
              <CardContent className="pt-6">
                <LoadingCustom />
              </CardContent>
            </Card>
          ) : ticketOrder ? (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="pb-4 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Ticket Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Order Number</span>
                    </div>
                    <p className="font-mono text-sm text-foreground pl-6">
                      {ticketOrder.orderNumber}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Order Date</span>
                    </div>
                    <p className="text-sm text-foreground pl-6">
                      {formatDateTime(ticketOrder.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="font-medium">Total Amount</span>
                    </div>
                    <p className="text-lg font-bold text-foreground pl-6">
                      {formatCurrency(
                        ticketOrder.totalPaymentAmount,
                        ticketOrder.currency
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                      <span className="font-medium">Status</span>
                    </div>
                    <Badge
                      variant={
                        ticketOrder.status === "PAID" ? "default" : "secondary"
                      }
                      className="ml-6"
                    >
                      {ticketOrder.status}
                    </Badge>
                  </div>
                </div>

                {ticketOrder.refundedAmount && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Refunded Amount</span>
                    </div>
                    <p className="text-lg font-bold text-orange-600 pl-6">
                      {formatCurrency(
                        ticketOrder.refundedAmount,
                        ticketOrder.currency
                      )}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Event Information */}
                {ticketOrder.event && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MapPin className="h-4 w-4" />
                        Event Information
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/events/${ticketOrder.event.id}`)
                        }
                        className="flex items-center gap-2"
                      >
                        <span>View Event</span>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Event Name</p>
                        <p className="font-semibold text-foreground">
                          {ticketOrder.event.displayName}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Event Date</p>
                        <p className="text-foreground">
                          {formatDateTime(ticketOrder.event.startDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Order Details */}
                {ticketOrder.orderDetails && ticketOrder.orderDetails.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Ticket className="h-4 w-4" />
                      Order Items
                    </div>
                    <div className="space-y-3 pl-6">
                      {ticketOrder.orderDetails.map((detail: {
                        id?: string;
                        quantity: number;
                        unitPrice: string;
                        currency: string;
                        subTotal: number;
                        ticketSnapshot?: {
                          displayName?: string;
                          description?: string;
                        };
                      }, index: number) => (
                        <div
                          key={detail.id || index}
                          className="flex items-start justify-between gap-4 py-3 border-b border-primary/10 last:border-b-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground mb-1">
                              {detail.ticketSnapshot?.displayName || "Ticket"}
                            </p>
                            {detail.ticketSnapshot?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {detail.ticketSnapshot.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {detail.quantity} × {formatCurrency(detail.unitPrice, detail.currency)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-foreground">
                              {formatCurrency(detail.subTotal, detail.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Subtotal
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Location Booking Section */}
      {referencedInitType === "LOCATION_BOOKING" && (
        <div className="mt-6">
          {isLoadingLocationBooking ? (
            <Card>
              <CardContent className="pt-6">
                <LoadingCustom />
              </CardContent>
            </Card>
          ) : locationBooking ? (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="pb-4 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Booking ID</span>
                    </div>
                    <p className="font-mono text-sm text-foreground pl-6">
                      {locationBooking.id}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Booking Date</span>
                    </div>
                    <p className="text-sm text-foreground pl-6">
                      {formatDateTime(locationBooking.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                      <span className="font-medium">Amount to Pay</span>
                    </div>
                    <p className="text-lg font-bold text-foreground pl-6">
                      {formatCurrency(
                        locationBooking.amountToPay,
                        "VND"
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                      <span className="font-medium">Status</span>
                    </div>
                    <Badge
                      variant={
                        locationBooking.status === "APPROVED" ? "default" : "secondary"
                      }
                      className="ml-6"
                    >
                      {locationBooking.status}
                    </Badge>
                  </div>
                </div>

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(locationBooking as any).refundedAmount && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Refunded Amount</span>
                    </div>
                    <p className="text-lg font-bold text-orange-600 pl-6">
                      {formatCurrency(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (locationBooking as any).refundedAmount,
                        "VND"
                      )}
                    </p>
                  </div>
                )}

                {/* Booking Dates - Show earliest start and latest end */}
                {locationBooking.dates && locationBooking.dates.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Booking Period</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {(() => {
                        const startDates = locationBooking.dates.map(
                          (d) => new Date(d.startDateTime).getTime()
                        );
                        const endDates = locationBooking.dates.map(
                          (d) => new Date(d.endDateTime).getTime()
                        );
                        const earliestStart = new Date(Math.min(...startDates));
                        const latestEnd = new Date(Math.max(...endDates));
                        return (
                          <>
                            <p className="text-sm text-foreground">
                              <span className="font-medium">Start:</span>{" "}
                              {formatDateTime(earliestStart.toISOString())}
                            </p>
                            <p className="text-sm text-foreground">
                              <span className="font-medium">End:</span>{" "}
                              {formatDateTime(latestEnd.toISOString())}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Total time slots: {locationBooking.dates.length}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Location Information */}
                {locationBooking.location && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MapPin className="h-4 w-4" />
                        Location Information
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/locations/${locationBooking.location.id}`)
                        }
                        className="flex items-center gap-2"
                      >
                        <span>View Location</span>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Location Name</p>
                        <p className="font-semibold text-foreground">
                          {locationBooking.location.name}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="text-foreground">
                          {locationBooking.location.addressLine}
                          {locationBooking.location.addressLevel1 &&
                            `, ${locationBooking.location.addressLevel1}`}
                          {locationBooking.location.addressLevel2 &&
                            `, ${locationBooking.location.addressLevel2}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Information */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(locationBooking as any).event && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Ticket className="h-4 w-4" />
                          Event Information
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              `/admin/events/${(locationBooking as any).event.id}`
                            )
                          }
                          className="flex items-center gap-2"
                        >
                          <span>View Event</span>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Event Name</p>
                          <p className="font-semibold text-foreground">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(locationBooking as any).event.displayName}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Event Date</p>
                          <p className="text-foreground">
                            {formatDateTime(
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (locationBooking as any).event.startDate
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Creator Information */}
                {locationBooking.createdBy && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <User className="h-4 w-4" />
                        Creator Information
                      </div>
                      <div className="flex items-center gap-4 pl-6">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage
                            src={locationBooking.createdBy.avatarUrl || undefined}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {locationBooking.createdBy.firstName?.[0] || ""}
                            {locationBooking.createdBy.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            {locationBooking.createdBy.firstName}{" "}
                            {locationBooking.createdBy.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {locationBooking.createdBy.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Event Section */}
      {referencedInitType === "EVENT" && (
        <div className="mt-6">
          {isLoadingEvent ? (
            <Card>
              <CardContent className="pt-6">
                <LoadingCustom />
              </CardContent>
            </Card>
          ) : event ? (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="pb-4 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Event ID</span>
                    </div>
                    <p className="font-mono text-sm text-foreground pl-6">
                      {event.id}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Created Date</span>
                    </div>
                    <p className="text-sm text-foreground pl-6">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                      <span className="font-medium">Status</span>
                    </div>
                    <Badge
                      variant={
                        event.status === "PUBLISHED" || event.status === "FINISHED"
                          ? "default"
                          : "secondary"
                      }
                      className="ml-6"
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Event Dates</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Start:</span>{" "}
                        {formatDateTime(event.startDate)}
                      </p>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">End:</span>{" "}
                        {formatDateTime(event.endDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Event Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Ticket className="h-4 w-4" />
                      Event Information
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="flex items-center gap-2"
                    >
                      <span>View Event</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Event Name</p>
                      <p className="font-semibold text-foreground">
                        {event.displayName}
                      </p>
                    </div>
                    {event.description && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm text-foreground line-clamp-3">
                          {event.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                {event.location && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <MapPin className="h-4 w-4" />
                          Location Information
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/locations/${event.location.id}`)
                          }
                          className="flex items-center gap-2"
                        >
                          <span>View Location</span>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Location Name</p>
                          <p className="font-semibold text-foreground">
                            {event.location.name}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="text-foreground">
                            {event.location.addressLine}
                            {event.location.addressLevel1 &&
                              `, ${event.location.addressLevel1}`}
                            {event.location.addressLevel2 &&
                              `, ${event.location.addressLevel2}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Creator Information */}
                {event.createdBy && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <User className="h-4 w-4" />
                        Creator Information
                      </div>
                      <div className="flex items-center gap-4 pl-6">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage
                            src={event.createdBy.avatarUrl || undefined}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {event.createdBy.firstName?.[0] || ""}
                            {event.createdBy.lastName?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            {event.createdBy.firstName} {event.createdBy.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {event.createdBy.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </PageContainer>
  );
}
