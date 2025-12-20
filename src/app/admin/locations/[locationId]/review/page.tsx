'use client';

import { useReviewsByLocationId } from '@/hooks/admin/useDashboardAdmin';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LocationPost } from '@/api/posts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageViewer } from '@/components/shared/ImageViewer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Star,
  MessageSquare,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Search,
  ThumbsUp,
  Image as ImageIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from 'use-debounce';
import { StatCard } from '@/components/shared/StatCard';

export default function ReviewTabPage({ locationId }: { locationId: string }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt:DESC');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const {
    data: reviewsData,
    isLoading,
    isError,
  } = useReviewsByLocationId(locationId);

  const allPosts = reviewsData?.data || [];
  const meta = reviewsData?.meta;

  // Calculate statistics
  const stats = useMemo(() => {
    const reviews = allPosts.filter(
      (p: LocationPost) => p.rating !== null && p.rating > 0
    );
    const posts = allPosts.filter(
      (p: LocationPost) => !p.rating || p.rating === 0
    );
    const averageRating =
      reviews.length > 0
        ? reviews.reduce(
            (sum: number, r: LocationPost) => sum + (r.rating || 0),
            0
          ) / reviews.length
        : 0;

    const ratingDistribution = {
      5: reviews.filter((r: LocationPost) => r.rating === 5).length,
      4: reviews.filter((r: LocationPost) => r.rating === 4).length,
      3: reviews.filter((r: LocationPost) => r.rating === 3).length,
      2: reviews.filter((r: LocationPost) => r.rating === 2).length,
      1: reviews.filter((r: LocationPost) => r.rating === 1).length,
    };

    return {
      total: allPosts.length,
      reviews: reviews.length,
      posts: posts.length,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  }, [allPosts]);

  // Filter posts based on search, type, and rating
  const posts = useMemo(() => {
    let filtered = allPosts as LocationPost[];

    // Filter by search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (p: LocationPost) =>
          p.content.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          `${p.author.firstName} ${p.author.lastName}`
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((p: LocationPost) => p.type === filterType);
    }

    // Filter by rating
    if (filterRating !== 'all') {
      const ratingNum = parseInt(filterRating);
      filtered = filtered.filter((p: LocationPost) => p.rating === ratingNum);
    }

    // Sort
    if (sortBy === 'createdAt:DESC') {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'createdAt:ASC') {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === 'rating:DESC') {
      filtered = [...filtered].sort(
        (a, b) => (b.rating || 0) - (a.rating || 0)
      );
    } else if (sortBy === 'rating:ASC') {
      filtered = [...filtered].sort(
        (a, b) => (a.rating || 0) - (b.rating || 0)
      );
    }

    return filtered;
  }, [allPosts, debouncedSearchTerm, filterType, filterRating, sortBy]);

  const handleImageClick = (imageUrl: string) => {
    setCurrentImageSrc(imageUrl);
    setIsImageViewerOpen(true);
  };

  const uniqueTypes = useMemo(() => {
    return Array.from(
      new Set(allPosts.map((p: LocationPost) => p.type))
    ).filter(Boolean) as string[];
  }, [allPosts]);

  const renderStars = (rating: number | null, size: 'sm' | 'md' = 'md') => {
    if (!rating) return null;
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return (
      <div className='flex items-center gap-0.5'>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
            }`}
          />
        ))}
        <span
          className={`ml-1.5 ${
            size === 'sm' ? 'text-xs' : 'text-sm'
          } font-semibold text-foreground`}
        >
          {rating}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingCustom />;
  }

  if (isError) {
    return <ErrorCustom />;
  }

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='space-y-4'>
        {/* Filters and Search */}
        <Card className='border-border/60 bg-muted/30'>
          <CardContent className='pt-4 pb-4'>
            <div className='space-y-4'>
              {/* Filters Row */}
              <div className='flex flex-col sm:flex-row gap-2.5'>
                {/* Search */}
                <div className='flex-1 relative min-w-0'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                  <Input
                    placeholder='Search by content or author...'
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className='pl-9 bg-background'
                  />
                </div>

                {/* Type Filter */}
                {uniqueTypes.length > 0 && (
                  <Select
                    value={filterType}
                    onValueChange={(value) => {
                      setFilterType(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className='w-full sm:w-[160px] bg-background'>
                      <Filter className='h-4 w-4 mr-2' />
                      <SelectValue placeholder='Type' />
                      {filterType !== 'all' && (
                        <Badge
                          variant='secondary'
                          className='ml-auto mr-2 h-5 px-1.5 text-[10px]'
                        >
                          {filterType}
                        </Badge>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Rating Filter */}
                <Select
                  value={filterRating}
                  onValueChange={(value) => {
                    setFilterRating(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='w-full sm:w-[160px] bg-background'>
                    <Star className='h-4 w-4 mr-2' />
                    <SelectValue placeholder='Rating' />
                    {filterRating !== 'all' && (
                      <Badge
                        variant='secondary'
                        className='ml-auto mr-2 h-5 px-1.5 text-[10px]'
                      >
                        {filterRating}★
                      </Badge>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Ratings</SelectItem>
                    <SelectItem value='5'>
                      <div className='flex items-center gap-2'>
                        <div className='flex gap-0.5'>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className='h-3 w-3 fill-amber-400 text-amber-400'
                            />
                          ))}
                        </div>
                        <span>5 Stars</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='4'>
                      <div className='flex items-center gap-2'>
                        <div className='flex gap-0.5'>
                          {[1, 2, 3, 4].map((s) => (
                            <Star
                              key={s}
                              className='h-3 w-3 fill-amber-400 text-amber-400'
                            />
                          ))}
                        </div>
                        <span>4 Stars</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='3'>3 Stars</SelectItem>
                    <SelectItem value='2'>2 Stars</SelectItem>
                    <SelectItem value='1'>1 Star</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='w-full sm:w-[200px] bg-background'>
                    <ArrowUpDown className='h-4 w-4 mr-2' />
                    <SelectValue placeholder='Sort by' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='createdAt:DESC'>Newest First</SelectItem>
                    <SelectItem value='createdAt:ASC'>Oldest First</SelectItem>
                    <SelectItem value='updatedAt:DESC'>
                      Recently Updated
                    </SelectItem>
                    <SelectItem value='rating:DESC'>Highest Rated</SelectItem>
                    <SelectItem value='rating:ASC'>Lowest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {(debouncedSearchTerm ||
                filterType !== 'all' ||
                filterRating !== 'all') && (
                <div className='flex items-center gap-2 flex-wrap pt-2 border-t border-border/60'>
                  <span className='text-xs text-muted-foreground font-medium'>
                    Active filters:
                  </span>
                  {debouncedSearchTerm && (
                    <Badge variant='secondary' className='text-xs'>
                      Search: "{debouncedSearchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className='ml-1.5 hover:text-foreground'
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filterType !== 'all' && (
                    <Badge variant='secondary' className='text-xs'>
                      Type: {filterType}
                      <button
                        onClick={() => setFilterType('all')}
                        className='ml-1.5 hover:text-foreground'
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filterRating !== 'all' && (
                    <Badge variant='secondary' className='text-xs'>
                      Rating: {filterRating}★
                      <button
                        onClick={() => setFilterRating('all')}
                        className='ml-1.5 hover:text-foreground'
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 text-xs'
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setFilterRating('all');
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className='py-16 text-center'>
            <MessageSquare className='h-14 w-14 mx-auto text-muted-foreground/30 mb-4' />
            <p className='text-base font-semibold text-foreground'>
              {debouncedSearchTerm ||
              filterType !== 'all' ||
              filterRating !== 'all'
                ? 'No posts match your filters'
                : 'No posts yet'}
            </p>
            <p className='text-sm text-muted-foreground mt-2 max-w-md mx-auto'>
              {debouncedSearchTerm ||
              filterType !== 'all' ||
              filterRating !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Posts and reviews from customers will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className='border-border/60 shadow-sm p-0'>
            <CardContent className='p-0'>
              <div className='overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='min-w-[200px]'>Author</TableHead>
                      <TableHead className='w-[100px]'>Is checked in</TableHead>
                      <TableHead className='w-[120px]'>Rating</TableHead>
                      <TableHead className='min-w-[300px]'>Content</TableHead>
                      <TableHead className='w-[120px]'>Images</TableHead>
                      <TableHead className='w-[180px]'>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post: LocationPost) => {
                      const isReview = post.rating !== null && post.rating > 0;
                      return (
                        <TableRow
                          key={post.postId}
                          className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                            isReview
                              ? 'border-l-2 border-l-amber-500'
                              : 'border-l-2 border-l-blue-500'
                          }`}
                          onClick={(e) => {
                            // Don't navigate if clicking on images
                            if (
                              (e.target as HTMLElement).closest(
                                '[data-image-cell]'
                              )
                            ) {
                              return;
                            }
                            router.push(`/admin/posts/${post.postId}`);
                          }}
                        >
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-9 w-9 border-2 border-background shadow-sm'>
                                <AvatarImage
                                  src={post.author.avatarUrl || undefined}
                                  alt={`${post.author.firstName} ${post.author.lastName}`}
                                />
                                <AvatarFallback className='bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xs'>
                                  {post.author.firstName[0]}
                                  {post.author.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex flex-col min-w-0'>
                                <div className='flex items-center gap-1.5'>
                                  <p className='font-semibold text-sm text-foreground truncate'>
                                    {post.author.firstName}{' '}
                                    {post.author.lastName}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {post.isVerified ? (
                              <Badge
                                variant='secondary'
                                className='text-[10px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 shrink-0'
                              >
                                <CheckCircle2 className='h-2.5 w-2.5 mr-0.5' />
                                Verified
                              </Badge>
                            ) : (
                              <span className='text-xs text-muted-foreground'>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isReview ? (
                              renderStars(post.rating, 'sm')
                            ) : (
                              <span className='text-xs text-muted-foreground'>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {post.content ? (
                              <p className='text-sm text-foreground line-clamp-2 max-w-md'>
                                {post.content}
                              </p>
                            ) : (
                              <span className='text-xs text-muted-foreground'>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell data-image-cell>
                            {post.imageUrls && post.imageUrls.length > 0 ? (
                              <div className='flex flex-wrap gap-1'>
                                {post.imageUrls
                                  .slice(0, 2)
                                  .map((imageUrl: string, index: number) => (
                                    <div
                                      key={index}
                                      className='relative w-10 h-10 rounded overflow-hidden border cursor-pointer bg-muted/50 shrink-0 hover:ring-2 hover:ring-primary transition-all'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImageClick(imageUrl);
                                      }}
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Post image ${index + 1}`}
                                        className='w-full h-full object-cover'
                                      />
                                    </div>
                                  ))}
                                {post.imageUrls.length > 2 && (
                                  <div
                                    className='relative w-10 h-10 rounded overflow-hidden border cursor-pointer bg-muted/70 flex items-center justify-center hover:bg-muted/90 transition-colors shrink-0'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageClick(post.imageUrls[2]);
                                    }}
                                  >
                                    <span className='text-[10px] text-muted-foreground font-medium'>
                                      +{post.imageUrls.length - 2}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className='text-xs text-muted-foreground'>
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col gap-0.5'>
                              <span className='text-xs text-foreground font-medium flex items-center gap-1'>
                                <Calendar className='h-3 w-3' />
                                {format(
                                  new Date(post.createdAt),
                                  'MMM dd, yyyy'
                                )}
                              </span>
                              <span className='text-[10px] text-muted-foreground'>
                                {formatDistanceToNow(new Date(post.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ImageViewer
        src={currentImageSrc}
        alt='Post image'
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}
