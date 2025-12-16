"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { usePostByIdForAdmin } from "@/hooks/admin/usePostByIdForAdmin";
import { usePostComments } from "@/hooks/posts/usePostComments";

// --- Import UI Components ---
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  ImageIcon,
  User,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CheckCircle2,
  BarChart3,
  Clock,
  Globe,
  Lock,
  MessageCircle,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { Separator } from "@/components/ui/separator";
import { PageContainer } from "@/components/shared";
import Image from "next/image";
import { toast } from "sonner";

// --- Helper Components ---
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
    <div className="flex gap-3 py-2.5">
      {Icon && (
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="text-sm text-foreground break-words leading-relaxed">
          {value}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-primary",
  bgColor = "bg-primary/10",
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  bgColor?: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---
export default function AdminPostDetailsPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  const {
    data: post,
    isLoading,
    isError,
  } = usePostByIdForAdmin(postId);

  const [commentPage, setCommentPage] = useState(1);
  const {
    data: commentsData,
    isLoading: isLoadingComments,
  } = usePostComments({
    postId,
    page: commentPage,
    limit: 20,
  });

  const comments = commentsData?.data || [];
  const commentsMeta = commentsData?.meta;

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
              }`}
            />
          ))}
        </div>
        <span className="text-lg font-bold text-foreground">{rating}</span>
        <span className="text-sm text-muted-foreground">/ 5</span>
      </div>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower === "review") {
      return (
        <Badge
          variant="outline"
          className="flex items-center w-fit gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
        >
          <Star className="h-3 w-3" />
          Review
        </Badge>
      );
    }
    if (typeLower === "blog") {
      return (
        <Badge
          variant="outline"
          className="flex items-center w-fit gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
        >
          <FileText className="h-3 w-3" />
          Blog
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="capitalize">
        {type}
      </Badge>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const visibilityLower = visibility.toLowerCase();
    if (visibilityLower === "public") {
      return (
        <Badge
          variant="outline"
          className="flex items-center w-fit gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
        >
          <Globe className="h-3 w-3" />
          Public
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="flex items-center w-fit gap-1 bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800"
      >
        <Lock className="h-3 w-3" />
        Private
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading post details...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !post) {
    return (
      <PageContainer>
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                <Eye className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Error loading post details
                </h3>
                <p className="text-sm text-muted-foreground">
                  We couldn't load the post details. Please try refreshing the page or go back to the list.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const isReview = post.rating !== null && post.rating > 0;

  return (
    <PageContainer>
      <div className="space-y-6 pb-8">
        {/* --- Header --- */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="shrink-0 hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Post Details</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Post ID: {post.postId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getTypeBadge(post.type)}
              {getVisibilityBadge(post.visibility)}
            </div>
          </div>
        </div>

        {/* --- Main Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Post Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Post Card */}
            <Card className="border-border/60 shadow-sm gap-0">
              {/* Post Header */}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                      <AvatarImage
                        src={post.author.avatarUrl || undefined}
                        alt={`${post.author.firstName} ${post.author.lastName}`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
                        {post.author.firstName[0]}
                        {post.author.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-foreground">
                          {post.author.firstName} {post.author.lastName}
                        </h3>
                        {post.isVerified && (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 shadow-sm"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(post.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </span>
                        {post.updatedAt !== post.createdAt && (
                          <>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating (if review) */}
                  {isReview && (
                    <div className="flex items-center gap-2 py-2">
                      {renderStars(post.rating!)}
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Post Content */}
              <CardContent className="pt-0 space-y-4">
                {post.content && (
                  <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    {post.content}
                  </p>
                )}

                {/* Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                  <div
                    className={`grid gap-2 rounded-lg overflow-hidden ${
                      post.imageUrls.length === 1
                        ? "grid-cols-1"
                        : post.imageUrls.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2"
                    }`}
                  >
                    {post.imageUrls.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative overflow-hidden bg-muted/50 cursor-pointer group ${
                          post.imageUrls.length === 1 ? "aspect-video" : "aspect-square"
                        }`}
                        onClick={() => handleImageClick(imageUrl)}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Post image ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Stats */}
            {post.analytics && (
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label="Upvotes"
                  value={post.analytics.totalUpvotes}
                  icon={ThumbsUp}
                  color="text-emerald-600"
                  bgColor="bg-emerald-500/10"
                />
                <StatCard
                  label="Downvotes"
                  value={post.analytics.totalDownvotes}
                  icon={ThumbsDown}
                  color="text-red-600"
                  bgColor="bg-red-500/10"
                />
                <StatCard
                  label="Comments"
                  value={post.analytics.totalComments}
                  icon={MessageCircle}
                  color="text-blue-600"
                  bgColor="bg-blue-500/10"
                />
              </div>
            )}

            {/* Post Information Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Post Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label="Post ID"
                  value={
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {post.postId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(post.postId);
                          toast.success("Post ID copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  }
                  icon={FileText}
                />
                <InfoRow
                  label="Type"
                  value={getTypeBadge(post.type)}
                  icon={Star}
                />
                <InfoRow
                  label="Visibility"
                  value={getVisibilityBadge(post.visibility)}
                  icon={Globe}
                />
                <InfoRow
                  label="Created At"
                  value={format(new Date(post.createdAt), "PPpp")}
                  icon={Calendar}
                />
                <InfoRow
                  label="Last Updated"
                  value={format(new Date(post.updatedAt), "PPpp")}
                  icon={Clock}
                />
                {post.eventId && (
                  <InfoRow
                    label="Event ID"
                    value={
                      <Link
                        href={`/admin/events/${post.eventId}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {post.eventId}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    }
                    icon={Calendar}
                  />
                )}
              </CardContent>
            </Card>

            {/* Location Information Card */}
            {post.location && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location Images */}
                  {post.location.imageUrl && post.location.imageUrl.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Location Images
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {post.location.imageUrl.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer group"
                            onClick={() => handleImageClick(imageUrl)}
                          >
                            <Image
                              src={imageUrl}
                              alt={`Location image ${index + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 50vw, 25vw"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <InfoRow
                      label="Location Name"
                      value={
                        <Link
                          href={`/admin/locations/${post.location.id}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {post.location.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      }
                      icon={MapPin}
                    />
                    <InfoRow
                      label="Address"
                      value={post.location.addressLine}
                      icon={Building}
                    />
                    {post.location.latitude !== undefined && post.location.longitude !== undefined && (
                      <>
                        <InfoRow
                          label="Coordinates"
                          value={
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {post.location.latitude.toFixed(6)}, {post.location.longitude.toFixed(6)}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => {
                                  const coords = `${post.location!.latitude}, ${post.location!.longitude}`;
                                  navigator.clipboard.writeText(coords);
                                  toast.success("Coordinates copied to clipboard");
                                }}
                              >
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => {
                                  const url = `https://www.google.com/maps?q=${post.location!.latitude},${post.location!.longitude}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open Map
                              </Button>
                            </div>
                          }
                          icon={MapPin}
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Author Information Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Author Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label="Author"
                  value={`${post.author.firstName} ${post.author.lastName}`}
                  icon={User}
                />
                <InfoRow
                  label="User ID"
                  value={
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {post.author.id}
                      </code>
                      <Link
                        href={`/admin/accounts/${post.author.id}`}
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        View Profile
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  }
                  icon={User}
                />
                <InfoRow
                  label="Verified"
                  value={
                    post.isVerified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified User
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Verified</Badge>
                    )
                  }
                  icon={CheckCircle2}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Comments Section */}
          <div className="lg:col-span-1">
            <Card className="border-border/60 shadow-sm sticky top-6 gap-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </div>
                  {post.analytics && post.analytics.totalComments > 0 && (
                    <Badge variant="secondary">
                      {post.analytics.totalComments}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comments List */}
                <Separator />
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {isLoadingComments ? (
                    <div className="space-y-4 py-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-12 w-full bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No comments yet</p>
                      <p className="text-xs mt-1">This post has no comments</p>
                    </div>
                  ) : (
                    <>
                      {comments.map((comment) => {
                        const isOwnerComment = !!comment.locationName;
                        const displayName = isOwnerComment
                          ? comment.locationName
                          : `${comment.author.firstName} ${comment.author.lastName}`;
                        const avatarInitials = isOwnerComment
                          ? comment.locationName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "LO"
                          : `${comment.author.firstName[0]}${comment.author.lastName[0]}`;
                        const avatarImage = isOwnerComment
                          ? post.location?.imageUrl?.[0]
                          : comment.author.avatarUrl || undefined;

                        return (
                          <div key={comment.commentId} className="flex gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarImage src={avatarImage} alt={displayName} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                {avatarInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-foreground">
                                  {displayName}
                                </p>
                                {isOwnerComment && (
                                  <Badge variant="outline" className="text-xs">
                                    Owner
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.createdAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {commentsMeta &&
                        commentsMeta.currentPage < commentsMeta.totalPages && (
                          <div className="pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setCommentPage((p) => p + 1)}
                            >
                              Load more comments
                            </Button>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- Image Viewer Modal --- */}
        <ImageViewer
          src={currentImageSrc}
          alt="Post image"
          open={isImageViewerOpen}
          onOpenChange={setIsImageViewerOpen}
        />
      </div>
    </PageContainer>
  );
}

