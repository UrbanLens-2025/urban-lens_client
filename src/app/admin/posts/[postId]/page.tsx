"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  User,
  Star,
  MessageSquare,
  Gavel,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  MessageCircle,
  ExternalLink,
  FileText,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { PageContainer } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsPanel } from "@/components/admin/event/ReportsPanel";
import Image from "next/image";
import { toast } from "sonner";
import { usePenaltiesByTarget } from "@/hooks/admin/usePenaltiesByTarget";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// --- Main Component ---
export default function AdminPostDetailsPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  // Get tab from URL or default to "details"
  const activeTab = searchParams.get("tab") || "details";
  const validTabs = ["details", "comments", "reports", "penalties"];
  const currentTab = validTabs.includes(activeTab) ? activeTab : "details";

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "details") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

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

  const {
    data: penaltiesData,
    isLoading: isLoadingPenalties,
  } = usePenaltiesByTarget(post?.postId ?? "", "post");
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);

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
                  We could not load the post details. Please try refreshing the page or go back to the list.
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
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getTypeBadge(post.type)}
              {getVisibilityBadge(post.visibility)}
            </div>
          </div>
        </div>

        {/* Main Post Card */}
        <Card className="border-border/60 shadow-sm gap-0">
          <CardHeader className="pb-3">
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
                        Has checked in
                      </Badge>
                    )}
                    {getVisibilityBadge(post.visibility)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
                    <span>{format(new Date(post.createdAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                    {post.updatedAt !== post.createdAt && (
                      <>
                        <span>•</span>
                        <span>
                          Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {isReview && (
                <div className="flex items-center gap-2 py-2">
                  {renderStars(post.rating!)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {post.content && (
              <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap break-words">
                {post.content}
              </p>
            )}

            {post.imageUrls && post.imageUrls.length > 0 && (
              <div
                className={`grid gap-3 rounded-lg ${
                  post.imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
                }`}
              >
                {post.imageUrls.map((imageUrl, index) => (
                  <div
                    key={index}
                    className={`relative overflow-hidden bg-muted/50 cursor-pointer group border border-border/60 shadow-sm ${
                      post.imageUrls.length === 1
                        ? "h-64 md:h-72 rounded-xl"
                        : "aspect-[4/3] rounded-lg"
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

            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-foreground">
                  {post.analytics?.totalUpvotes ?? 0}
                </span>
                <span>Likes</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="h-4 w-4 text-red-500" />
                <span className="font-semibold text-foreground">
                  {post.analytics?.totalDownvotes ?? 0}
                </span>
                <span>Dislikes</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-foreground">
                  {post.analytics?.totalComments ?? 0}
                </span>
                <span>Comments</span>
              </div>
              {post.type?.toLowerCase() === "review" && post.location?.name && (
                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{post.location.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- Main Layout --- */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="flex flex-col gap-2 space-y-4">
          <TabsList className="bg-transparent h-auto p-0 border-b border-border rounded-none flex gap-8">
            <TabsTrigger
              value="details"
              className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2
              data-[state=active]:text-foreground
              after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent
              data-[state=active]:after:bg-primary"
            >
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2
              data-[state=active]:text-foreground
              after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent
              data-[state=active]:after:bg-primary"
            >
              <MessageSquare className="h-4 w-4" />
              Comments
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2
              data-[state=active]:text-foreground
              after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent
              data-[state=active]:after:bg-primary"
            >
              <Flag className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="penalties"
              className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2
              data-[state=active]:text-foreground
              after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent
              data-[state=active]:after:bg-primary"
            >
              <Gavel className="h-4 w-4" />
              Penalty History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Post Content */}
              <div className="lg:col-span-2 space-y-6">

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
              </div>

              {/* Right Column - Side info */}
              <div className="space-y-6">
                {post.location && (
                  <Card className="border-border/60 shadow-sm overflow-hidden pt-0">
                    {post.location.imageUrl && post.location.imageUrl.length > 0 && (
                      (() => {
                        const firstImage = post.location?.imageUrl?.[0];
                        if (!firstImage) return null;
                        return (
                      <div
                        className="relative w-full aspect-video overflow-hidden bg-muted cursor-pointer group"
                        onClick={() => handleImageClick(firstImage)}
                      >
                        <Image
                          src={firstImage}
                          alt={post.location.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                        );
                      })()
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-lg text-foreground truncate">
                          {post.location.name}
                        </h3>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/locations/${post.location.id}`} className="text-primary hover:underline flex items-center gap-1 shrink-0">
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      {((post.location as { description?: string })?.description) && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {(post.location as { description?: string })?.description}
                        </p>
                      )}
                      <p className="text-sm text-foreground truncate">
                        {post.location.addressLine}
                      </p>
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
            </div>
          </TabsContent>
          <TabsContent value="comments">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingComments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments found.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment, index) => {
                      type CommentWithCreatedBy = typeof comments[number] & {
                        createdBy?: {
                          firstName?: string;
                          lastName?: string;
                          avatarUrl?: string;
                          id?: string;
                        };
                        commentId?: string;
                      };

                      const extendedComment = comment as CommentWithCreatedBy;
                      const authorFirstName =
                        extendedComment?.author?.firstName || extendedComment?.createdBy?.firstName || "";
                      const authorLastName =
                        extendedComment?.author?.lastName || extendedComment?.createdBy?.lastName || "";
                      const authorName = `${authorFirstName} ${authorLastName}`.trim() || "Unknown user";
                      const avatarUrl =
                        extendedComment?.author?.avatarUrl || extendedComment?.createdBy?.avatarUrl;
                      const commentId =
                        (extendedComment as { id?: string }).id ||
                        extendedComment?.commentId ||
                        `comment-${index}`;
                      return (
                        <div
                          key={commentId}
                          className="rounded-lg border border-border/60 bg-card/50 p-3 shadow-sm space-y-2"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={avatarUrl || undefined} alt={authorName} />
                              <AvatarFallback>
                                {authorFirstName?.[0]}
                                {authorLastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <span className="font-semibold truncate">{authorName}</span>
                                {extendedComment?.createdAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(extendedComment.createdAt as string), "PP p")}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                                {extendedComment?.content ?? ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {commentsMeta && commentsMeta.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Page {commentsMeta.currentPage} of {commentsMeta.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={commentsMeta.currentPage === 1}
                        onClick={() => setCommentPage((prev) => Math.max(1, prev - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={commentsMeta.currentPage === commentsMeta.totalPages}
                        onClick={() =>
                          setCommentPage((prev) =>
                            commentsMeta ? Math.min(commentsMeta.totalPages, prev + 1) : prev + 1
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
            <ReportsPanel targetId={post.postId} targetType="post" />
          </TabsContent>
          <TabsContent value="penalties">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Penalty History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPenalties ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading penalties...
                  </div>
                ) : !penaltiesData || penaltiesData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No penalties found for this post.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Issued By</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {penaltiesData.map((penalty) => (
                          <TableRow key={penalty.id} className="hover:bg-muted/20">
                            <TableCell>
                              <Badge variant="outline" className="w-fit text-xs">
                                {penalty.penaltyAction.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {penalty.reason || (
                                <span className="text-muted-foreground italic">No reason provided</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {penalty.createdBy ? (
                                <div className="flex items-center gap-2">
                                  {penalty.createdBy.avatarUrl ? (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={penalty.createdBy.avatarUrl}
                                        alt={`${penalty.createdBy.firstName} ${penalty.createdBy.lastName}`}
                                      />
                                      <AvatarFallback>
                                        {penalty.createdBy.firstName[0]}
                                        {penalty.createdBy.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                      <User className="h-4 w-4 text-primary" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">
                                      {penalty.createdBy.firstName} {penalty.createdBy.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {penalty.createdBy.email}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">Unknown</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(penalty.createdAt), "PPpp")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isPenaltyModalOpen} onOpenChange={setIsPenaltyModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Penalty</DialogTitle>
              <DialogDescription>Set up a penalty for this post.</DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">Coming soon.</div>
          </DialogContent>
        </Dialog>

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

