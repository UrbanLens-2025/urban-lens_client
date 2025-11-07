"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Building,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ImageIcon,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/user/useUser";
import { useProcessBusinessAccount } from "@/hooks/admin/useProcessBusinessAccount";

function ValidationSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoField({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`p-4 rounded-lg border ${highlight ? "bg-muted/50 border-primary/20" : "bg-background"}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground mb-1">
            {label}
          </p>
          <div className="text-base font-medium text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ComparisonField({
  label,
  businessValue,
  accountValue,
  icon: Icon,
}: {
  label: string;
  businessValue?: string | null;
  accountValue?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const match = businessValue === accountValue;
  return (
    <div className="p-4 rounded-lg border bg-background">
      <div className="flex items-start gap-3 mb-3">
        {Icon && (
          <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground mb-2">
            {label}
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Business Profile
              </p>
              <p className="text-base font-medium text-foreground">
                {businessValue || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Account Owner
              </p>
              <p className="text-base font-medium text-foreground">
                {accountValue || "Not provided"}
              </p>
            </div>
            {businessValue && accountValue && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                {match ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      Values match
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600 font-medium">
                      Values do not match
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBusinessDetailsPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const {
    user,
    isLoading: isLoadingUser,
    isError,
  } = useUser(accountId);
  const { mutate: processAccount, isPending: isProcessing } =
    useProcessBusinessAccount();

  const isLoading = isLoadingUser;
  const businessProfile = user?.businessProfile;

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  const handleApprove = () => {
    if (!user) return;
    processAccount(
      { id: user.id, payload: { status: "APPROVED" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user", accountId] });
          queryClient.invalidateQueries({ queryKey: ["businessAccounts"] });
          setShowApproveDialog(false);
          router.push("/admin/business");
        },
      }
    );
  };

  const handleReject = () => {
    if (!user || !adminNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    processAccount(
      { id: user.id, payload: { status: "REJECTED", adminNotes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user", accountId] });
          queryClient.invalidateQueries({ queryKey: ["businessAccounts"] });
          setShowRejectDialog(false);
          setAdminNotes("");
          router.push("/admin/business");
        },
      }
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Failed to load business account details.
            </p>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = businessProfile?.status === "PENDING";

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Business Account Review</h1>
          <p className="text-muted-foreground">
            Review and validate business account information
          </p>
        </div>
        {getStatusBadge(businessProfile?.status)}
      </div>

      {/* Step 1: Business Basic Information */}
      <ValidationSection
        title="Step 1: Business Basic Information"
        icon={Building}
      >
        <div className="space-y-4">
          {businessProfile?.avatar && (
            <div className="flex justify-center mb-4">
              <div
                className="relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer border-2 border-muted"
                onClick={() => handleImageClick(businessProfile.avatar)}
              >
                <img
                  src={businessProfile.avatar}
                  alt={businessProfile.name || "Business avatar"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="Business Name"
              value={businessProfile?.name}
              icon={Building}
              highlight
            />
            <InfoField
              label="Category"
              value={
                businessProfile?.category ? (
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {businessProfile.category}
                  </Badge>
                ) : null
              }
            />
          </div>
          <InfoField
            label="Description"
            value={businessProfile?.description}
            icon={FileText}
          />
        </div>
      </ValidationSection>

      {/* Step 2: Website Validation */}
      <ValidationSection
        title="Step 2: Website Validation"
        icon={Globe}
      >
        <div className="space-y-4">
          {businessProfile?.website ? (
            <div className="p-4 rounded-lg border bg-background">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Business Website
                  </p>
                  <p className="text-base font-medium text-foreground break-all">
                    {businessProfile.website}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-shrink-0"
                >
                  <a
                    href={businessProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Website
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Click the button above to validate the website in a new tab
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground">
                No website provided
              </p>
            </div>
          )}
        </div>
      </ValidationSection>

      {/* Step 3: License Validation */}
      <ValidationSection
        title="Step 3: License Validation"
        icon={FileText}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="License Number"
              value={businessProfile?.licenseNumber}
              icon={FileText}
              highlight
            />
            <InfoField
              label="License Type"
              value={businessProfile?.licenseType}
            />
          </div>
          <InfoField
            label="License Expiration Date"
            value={formatDate(businessProfile?.licenseExpirationDate)}
            icon={Calendar}
          />
          {businessProfile?.licenseExpirationDate && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground">
                Please verify the license number and expiration date are valid
                and match official records
              </p>
            </div>
          )}
        </div>
      </ValidationSection>

      {/* Step 4: Contact Information Cross-Comparison */}
      <ValidationSection
        title="Step 4: Contact Information Cross-Comparison"
        icon={Phone}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Compare contact information between business profile and account
            owner to ensure consistency
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComparisonField
              label="Email Address"
              businessValue={businessProfile?.email}
              accountValue={user.email}
              icon={Mail}
            />
            <ComparisonField
              label="Phone Number"
              businessValue={businessProfile?.phone}
              accountValue={user.phoneNumber}
              icon={Phone}
            />
          </div>
        </div>
      </ValidationSection>

      <Separator />

      {/* Final Action Section - Single Location for Approve/Reject */}
      {isPending && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Review Complete - Make Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                After reviewing all information above, make your decision to
                approve or reject this business account.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve Account
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isProcessing}
                  className="flex-1"
                  size="lg"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information (Collapsed by default) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Account Owner
            </p>
            <p className="text-base text-foreground">
              {user.firstName} {user.lastName} ({user.email})
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Full Address
            </p>
            <p className="text-base text-foreground">
              {[
                businessProfile?.addressLine,
                businessProfile?.addressLevel1,
                businessProfile?.addressLevel2,
              ]
                .filter(Boolean)
                .join(", ") || "Not provided"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Created
              </p>
              <p className="text-sm text-foreground">
                {formatDateTime(businessProfile?.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Updated
              </p>
              <p className="text-sm text-foreground">
                {formatDateTime(businessProfile?.updatedAt)}
              </p>
            </div>
          </div>
          {businessProfile?.adminNotes && (
            <div className="pt-2 border-t">
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                Previous Admin Notes
              </p>
              <p className="text-sm text-foreground">
                {businessProfile.adminNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer */}
      <ImageViewer
        src={currentImageSrc}
        alt="Business image"
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Business Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the business account &quot;
              {businessProfile?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Business Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting the business account &quot;
              {businessProfile?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing || !adminNotes.trim()}
              variant="destructive"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

