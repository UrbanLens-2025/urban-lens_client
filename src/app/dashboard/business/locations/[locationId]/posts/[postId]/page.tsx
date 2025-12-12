"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { usePostById } from "@/hooks/posts/usePostById";
import { usePostComments } from "@/hooks/posts/usePostComments";
import { useCreateComment } from "@/hooks/posts/useCreateComment";

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
    Shield,
    MessageCircle,
    Send,
    Share2,
    Heart,
    MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

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

// --- Component chính ---
export default function PostDetailsPage({
    params,
}: {
    params: Promise<{ locationId: string; postId: string }>;
}) {
    const { locationId, postId } = use(params);
    const router = useRouter();

    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [currentImageSrc, setCurrentImageSrc] = useState("");

    const {
        data: post,
        isLoading,
        isError,
    } = usePostById(postId);

    const [commentPage, setCommentPage] = useState(1);
    const [commentContent, setCommentContent] = useState("");
    const {
        data: commentsData,
        isLoading: isLoadingComments,
    } = usePostComments({
        postId,
        page: commentPage,
        limit: 20,
    });

    const createCommentMutation = useCreateComment();

    const comments = commentsData?.data || [];
    const commentsMeta = commentsData?.meta;

    const handleSubmitComment = () => {
        if (!commentContent.trim()) return;
        
        createCommentMutation.mutate(
            {
                content: commentContent.trim(),
                postId: postId,
            },
            {
                onSuccess: () => {
                    setCommentContent("");
                    setCommentPage(1); // Reset to first page to see new comment
                },
            }
        );
    };

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
                            className={`h-5 w-5 ${star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                                }`}
                        />
                    ))}
                </div>
                <span className="text-lg font-bold text-foreground">
                    {rating}
                </span>
                <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading post details...</p>
                </div>
            </div>
        );
    }

    if (isError || !post) {
        return (
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
        );
    }

    const isReview = post.rating !== null && post.rating > 0;
    const position = post.location
        ? {
            lat: post.location.latitude,
            lng: post.location.longitude,
        }
        : null;

    return (
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
                        <Badge variant="outline" className="capitalize shadow-sm">
                            {post.type}
                        </Badge>
                        <Badge variant="outline" className="capitalize shadow-sm">
                            <Globe className="h-3 w-3 mr-1" />
                            {post.visibility}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* --- Facebook Style Layout --- */}
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
                                    className={`grid gap-2 rounded-lg overflow-hidden ${post.imageUrls.length === 1
                                        ? "grid-cols-1"
                                        : post.imageUrls.length === 2
                                            ? "grid-cols-2"
                                            : "grid-cols-2"
                                        }`}
                                >
                                    {post.imageUrls.map((imageUrl, index) => (
                                        <div
                                            key={index}
                                            className={`relative overflow-hidden bg-muted/50 cursor-pointer group ${post.imageUrls.length === 1
                                                ? "aspect-video"
                                                : "aspect-square"
                                                }`}
                                            onClick={() => handleImageClick(imageUrl)}
                                        >
                                            <img
                                                src={imageUrl}
                                                alt={`Post image ${index + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Analytics Stats */}
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
                                {post.analytics.totalComments > 0 && (
                                    <Badge variant="secondary">
                                        {post.analytics.totalComments}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Comment Input */}
                            <div className="flex gap-2">
                                <div className="flex-1 space-y-2">
                                    <Textarea
                                        placeholder="Write a comment..."
                                        className="min-h-[20px] resize-none"
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                                e.preventDefault();
                                                handleSubmitComment();
                                            }
                                        }}
                                    />
                                    <div className="flex justify-end">
                                        <Button 
                                            size="sm" 
                                            className="gap-2"
                                            onClick={handleSubmitComment}
                                            disabled={!commentContent.trim() || createCommentMutation.isPending}
                                        >
                                            {createCommentMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Posting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-3.5 w-3.5" />
                                                    Post
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

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
                                        <p className="text-xs mt-1">Be the first to comment!</p>
                                    </div>
                                ) : (
                                    <>
                                        {comments.map((comment) => (
                                            <div key={comment.commentId} className="flex gap-3">
                                                <Avatar className="h-8 w-8 border border-border">
                                                    <AvatarImage
                                                        src={comment.author.avatarUrl || undefined}
                                                        alt={`${comment.author.firstName} ${comment.author.lastName}`}
                                                    />
                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                                        {comment.author.firstName[0]}
                                                        {comment.author.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm text-foreground">
                                                            {comment.author.firstName} {comment.author.lastName}
                                                        </p>
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
                                        ))}
                                        {commentsMeta && commentsMeta.currentPage < commentsMeta.totalPages && (
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

            {/* --- Modal Phóng to ảnh --- */}
            <ImageViewer
                src={currentImageSrc}
                alt="Post image"
                open={isImageViewerOpen}
                onOpenChange={setIsImageViewerOpen}
            />
        </div>
    );
}

