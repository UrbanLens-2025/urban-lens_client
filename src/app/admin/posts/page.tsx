'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SortableTableHeader,
  SortDirection,
} from '@/components/shared/SortableTableHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  FileText,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Lock,
  CheckCircle,
  ImageIcon,
  User,
} from 'lucide-react';
import { useAllPosts } from '@/hooks/admin/useAllPosts';
import { usePostStats } from '@/hooks/admin/usePostStats';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { PageContainer } from '@/components/shared';
import StatisticCard from '@/components/admin/StatisticCard';

export default function AdminPostsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get('type') || 'all'
  );
  const [visibilityFilter, setVisibilityFilter] = useState<string>(
    searchParams.get('visibility') || 'all'
  );
  const itemsPerPage = 7;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();

    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    } else {
      params.delete('search');
    }

    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }

    if (visibilityFilter !== 'all') {
      params.set('visibility', visibilityFilter);
    } else {
      params.delete('visibility');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, typeFilter, visibilityFilter, page, pathname, router, searchParams]);

  const sortBy = sort.direction
    ? `${sort.column}:${sort.direction}`
    : 'createdAt:DESC';

  // Data fetching for posts
  const { data, isLoading, error } = useAllPosts({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    sortBy,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    visibility: visibilityFilter !== 'all' ? visibilityFilter : undefined,
  });

  const posts = data?.data || [];
  const meta = data?.meta;

  const postStats = usePostStats();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allPosts'] });
  };

  if (error) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-red-600'>
              Error loading posts. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  const getTypeBadge = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower === 'review') {
      return (
        <Badge
          variant='outline'
          className='flex items-center w-fit gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
        >
          <Star className='h-3 w-3' />
          Review
        </Badge>
      );
    }
    if (typeLower === 'blog') {
      return (
        <Badge
          variant='outline'
          className='flex items-center w-fit gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
        >
          <FileText className='h-3 w-3' />
          Blog
        </Badge>
      );
    }
    return (
      <Badge variant='outline' className='capitalize'>
        {type}
      </Badge>
    );
  };

  const getVisibilityBadge = (visibility: string) => {
    const visibilityLower = visibility.toLowerCase();
    if (visibilityLower === 'public') {
      return (
        <Badge
          variant='outline'
          className='flex items-center w-fit gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
        >
          <Globe className='h-3 w-3' />
          Public
        </Badge>
      );
    }
    return (
      <Badge
        variant='outline'
        className='flex items-center w-fit gap-1 bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800'
      >
        <Lock className='h-3 w-3' />
        Private
      </Badge>
    );
  };

  return (
    <PageContainer>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>
        <StatisticCard
          title='Total Posts'
          subtitle={`${posts.length} on this page`}
          value={
            postStats.isLoading ? '—' : postStats.total.toLocaleString()
          }
          icon={FileText}
          iconColorClass='blue'
        />

        <StatisticCard
          title='Reviews'
          subtitle={`${
            postStats.total > 0
              ? Math.round((postStats.reviews / postStats.total) * 100)
              : 0
          }% of total`}
          value={
            postStats.isLoading
              ? '—'
              : postStats.reviews.toLocaleString()
          }
          icon={Star}
          iconColorClass='amber'
        />

        <StatisticCard
          title='Blog Posts'
          subtitle={`${
            postStats.total > 0
              ? Math.round((postStats.checkIns / postStats.total) * 100)
              : 0
          }% of total`}
          value={
            postStats.isLoading
              ? '—'
              : postStats.checkIns.toLocaleString()
          }
          icon={FileText}
          iconColorClass='purple'
        />

        <StatisticCard
          title='Public Posts'
          subtitle={`${
            postStats.total > 0
              ? Math.round((postStats.public / postStats.total) * 100)
              : 0
          }% of total`}
          value={
            postStats.isLoading
              ? '—'
              : postStats.public.toLocaleString()
          }
          icon={Globe}
          iconColorClass='green'
        />
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle>All Posts</CardTitle>
              <CardDescription className='mt-1'>
                Total {meta?.totalItems || 0} posts in the system
              </CardDescription>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search posts...'
                  className='pl-9 w-full sm:w-[280px]'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-[200px]'>
                  <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4' />
                    <SelectValue placeholder='Filter by type' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='review'>Review</SelectItem>
                  <SelectItem value='blog'>Blog</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={visibilityFilter}
                onValueChange={(value) => {
                  setVisibilityFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-[200px]'>
                  <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4' />
                    <SelectValue placeholder='Filter by visibility' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Visibility</SelectItem>
                  <SelectItem value='public'>Public</SelectItem>
                  <SelectItem value='private'>Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center h-64 gap-3'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>Loading data...</p>
            </div>
          ) : (
            <>
              <div className='rounded-md border overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/50 hover:bg-muted/50'>
                      <TableHead className='w-[60px] text-center'>#</TableHead>
                      <SortableTableHeader
                        column='content'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Post
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='author.firstName'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Author
                      </SortableTableHeader>
                      <TableHead>Location</TableHead>
                      <SortableTableHeader
                        column='type'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Type
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='visibility'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Visibility
                      </SortableTableHeader>
                      <TableHead className='text-center'>Stats</TableHead>
                      <SortableTableHeader
                        column='rating'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Rating
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='createdAt'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Created
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className='text-center h-32'>
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <FileText className='h-12 w-12 text-muted-foreground/50' />
                            <p className='text-muted-foreground font-medium'>
                              No posts found
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              Try changing filters or search keywords
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      posts.map((post: any, index: number) => (
                        <TableRow
                          key={post.postId}
                          className='hover:bg-muted/50 transition-colors'
                        >
                          <TableCell className='text-center text-muted-foreground font-medium'>
                            {(page - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/posts/${post.postId}`}
                              className='flex items-start gap-3 group'
                            >
                              {post.imageUrls && post.imageUrls.length > 0 ? (
                                <div className='relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border-2 border-background'>
                                  <Image
                                    src={post.imageUrls[0]}
                                    alt='Post image'
                                    fill
                                    className='object-cover'
                                    sizes='40px'
                                  />
                                </div>
                              ) : (
                                <div className='h-10 w-10 flex-shrink-0 rounded-md bg-muted border-2 border-background flex items-center justify-center'>
                                  <ImageIcon className='h-4 w-4 text-muted-foreground' />
                                </div>
                              )}
                              <div className='flex-1 min-w-0 max-w-md'>
                                <p className='text-sm font-medium group-hover:text-primary transition-colors line-clamp-2'>
                                  {post.content || '(No content)'}
                                </p>
                                {post.imageUrls && post.imageUrls.length > 1 && (
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    +{post.imageUrls.length - 1} more image{post.imageUrls.length - 1 > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Avatar className='h-8 w-8 border-2 border-background'>
                                {post.author?.avatarUrl && (
                                  <AvatarImage
                                    src={post.author.avatarUrl}
                                    alt={`${post.author.firstName} ${post.author.lastName}`}
                                    className='object-cover'
                                  />
                                )}
                                <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                                  {post.author?.firstName?.[0] || ''}
                                  {post.author?.lastName?.[0] || ''}
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium truncate'>
                                  {post.author?.firstName} {post.author?.lastName}
                                </p>
                                {post.isVerified && (
                                  <div className='flex items-center gap-1 mt-0.5'>
                                    <CheckCircle className='h-3 w-3 text-emerald-600' />
                                    <span className='text-xs text-muted-foreground'>Verified</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='text-muted-foreground max-w-[200px]'>
                            {post.location ? (
                              <div className='truncate wrap-anywhere' title={post.location.name}>
                                {post.location.name}
                              </div>
                            ) : (
                              <span className='text-sm text-muted-foreground'>N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{getTypeBadge(post.type)}</TableCell>
                          <TableCell>{getVisibilityBadge(post.visibility)}</TableCell>
                          <TableCell>
                            <div className='flex flex-col gap-1 text-xs text-center'>
                              {post.analytics && (
                                <>
                                  <div className='flex items-center justify-center gap-1'>
                                    <ThumbsUp className='h-3 w-3 text-emerald-600' />
                                    <span>{post.analytics.totalUpvotes || 0}</span>
                                  </div>
                                  <div className='flex items-center justify-center gap-1'>
                                    <ThumbsDown className='h-3 w-3 text-red-600' />
                                    <span>{post.analytics.totalDownvotes || 0}</span>
                                  </div>
                                  <div className='flex items-center justify-center gap-1'>
                                    <MessageSquare className='h-3 w-3 text-blue-600' />
                                    <span>{post.analytics.totalComments || 0}</span>
                                  </div>
                                </>
                              )}
                              {!post.analytics && (
                                <span className='text-muted-foreground'>—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {post.rating !== null && post.rating > 0 ? (
                              <div className='flex items-center gap-1'>
                                <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                                <span className='font-medium'>
                                  {post.rating.toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className='text-sm text-muted-foreground'>—</span>
                            )}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {formatShortDate(post.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t'>
                  <div className='text-sm text-muted-foreground'>
                    Showing{' '}
                    <span className='font-medium text-foreground'>
                      {(page - 1) * itemsPerPage + 1}
                    </span>{' '}
                    -{' '}
                    <span className='font-medium text-foreground'>
                      {Math.min(page * itemsPerPage, meta.totalItems)}
                    </span>{' '}
                    of{' '}
                    <span className='font-medium text-foreground'>
                      {meta.totalItems}
                    </span>{' '}
                    posts
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className='gap-1'
                    >
                      <ChevronLeft className='h-4 w-4' />
                      Previous
                    </Button>
                    <div className='flex items-center gap-1 px-3'>
                      <span className='text-sm font-medium'>
                        Page {page} of {meta.totalPages}
                      </span>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page + 1)}
                      disabled={page >= meta.totalPages}
                      className='gap-1'
                    >
                      Next
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

