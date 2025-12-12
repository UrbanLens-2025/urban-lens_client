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
    <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
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
    <div className={`p-4 rounded-lg border transition-all ${
      highlight 
        ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30 shadow-sm" 
        : "bg-card border-border hover:border-primary/20"
    }`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`p-2 rounded-md ${
            highlight ? "bg-primary/20" : "bg-muted"
          }`}>
            <Icon className={`h-4 w-4 ${
              highlight ? "text-primary" : "text-muted-foreground"
            }`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {label}
          </p>
          <div className="text-base font-medium text-foreground break-words">{value}</div>
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
      <div className="container mx-auto py-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-2">
              <CardHeader>
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-20 w-full bg-muted rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-muted rounded animate-pulse" />
                    <div className="h-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card className="border-destructive/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Error Loading Account</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                We couldn't load the business account details. This might be due to a network error or the account may not exist.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = businessProfile?.status === "PENDING";

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {businessProfile?.name || 'Business Account Review'}
              </h1>
              {getStatusBadge(businessProfile?.status)}
            </div>
            <p className="text-muted-foreground">
              Review and validate business account information
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Business Basic Information */}
      <ValidationSection
        title="Step 1: Business Basic Information"
        icon={Building}
      >
        <div className="space-y-4">
          {businessProfile?.avatar && (
            <div className="flex justify-center mb-6">
              <div
                className="relative w-32 h-32 rounded-xl overflow-hidden cursor-pointer border-4 border-background shadow-lg ring-4 ring-primary/10 hover:ring-primary/20 transition-all group"
                onClick={() => handleImageClick(businessProfile.avatar)}
              >
                <img
                  src={businessProfile.avatar}
                  alt={businessProfile.name || "Business avatar"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
          {/* Licenses List */}
          {businessProfile?.licenses && businessProfile.licenses.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Business Licenses</h4>
                <Badge variant="outline">{businessProfile.licenses.length} license{businessProfile.licenses.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="space-y-3">
                {businessProfile.licenses.map((license: any, index: number) => (
                  <Card key={index} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">
                          {license.licenseType?.replace(/_/g, ' ') || 'License'}
                        </CardTitle>
                        {license.documentImageUrls && license.documentImageUrls.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {license.documentImageUrls.length} document{license.documentImageUrls.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {license.documentImageUrls && license.documentImageUrls.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {license.documentImageUrls.map((url: string, imgIndex: number) => (
                            <div
                              key={imgIndex}
                              className="relative aspect-video rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleImageClick(url)}
                            >
                              <img
                                src={url}
                                alt={`License document ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No documents uploaded</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed bg-muted/30 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No licenses uploaded</p>
            </div>
          )}

          {/* Legacy License Fields */}
          {(businessProfile?.licenseNumber || businessProfile?.licenseType || businessProfile?.licenseExpirationDate) && (
            <>
              <Separator />
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
            </>
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
        <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              Review Complete - Make Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  After reviewing all information above, make your decision to
                  approve or reject this business account.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve Account
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isProcessing}
                  className="flex-1 shadow-md hover:shadow-lg transition-all"
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

      {/* Additional Information */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
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

