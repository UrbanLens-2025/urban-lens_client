"use client";

import { use } from "react";
import { useLocationPosts } from "@/hooks/posts/useLocationPosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { Loader2, Star, MessageSquare, Calendar, CheckCircle2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LocationPostsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt:DESC");
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const { data, isLoading, isError } = useLocationPosts({
    locationId,
    page,
    limit,
    sortBy,
  });

  const posts = data?.data || [];
  const meta = data?.meta;

  const handleImageClick = (imageUrl: string) => {
    setCurrentImageSrc(imageUrl);
    setIsImageViewerOpen(true);
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-300 text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {rating}/5
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-red-500 font-medium">Error loading posts</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Location Posts & Reviews</h2>
          <p className="text-muted-foreground mt-1">
            View all posts and reviews for this location
          </p>
        </div>
        <div className="flex items-center gap-3">
          {meta && (
            <Badge variant="secondary" className="text-sm">
              {meta.totalItems} {meta.totalItems === 1 ? "post" : "posts"}
            </Badge>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:DESC">Newest First</SelectItem>
              <SelectItem value="createdAt:ASC">Oldest First</SelectItem>
              <SelectItem value="updatedAt:DESC">Recently Updated</SelectItem>
              <SelectItem value="updatedAt:ASC">Least Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">No posts yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Posts and reviews from customers will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.postId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={post.author.avatarUrl || undefined}
                          alt={`${post.author.firstName} ${post.author.lastName}`}
                        />
                        <AvatarFallback>
                          {post.author.firstName[0]}
                          {post.author.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">
                            {post.author.firstName} {post.author.lastName}
                          </p>
                          {post.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {post.rating && (
                            <div className="flex items-center">
                              {renderStars(post.rating)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(post.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                          {post.type && (
                            <Badge variant="outline" className="text-xs">
                              {post.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {post.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  )}

                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <div
                      className={`grid gap-2 ${
                        post.imageUrls.length === 1
                          ? "grid-cols-1"
                          : post.imageUrls.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 md:grid-cols-3"
                      }`}
                    >
                      {post.imageUrls.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity bg-muted"
                          onClick={() => handleImageClick(imageUrl)}
                        >
                          <img
                            src={imageUrl}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (meta.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= meta.totalPages - 2) {
                    pageNum = meta.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === meta.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <ImageViewer
        src={currentImageSrc}
        alt="Post image"
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}

