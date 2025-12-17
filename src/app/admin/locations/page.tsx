'use client';

import { useState, useMemo, useEffect } from 'react';
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
  MapPin,
  Building2,
  Globe,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  CheckCircle,
  FileText,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useAllLocations } from '@/hooks/admin/useAllLocations';
import { useLocationStats } from '@/hooks/admin/useLocationStats';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PageContainer } from '@/components/shared';
import StatisticCard from '@/components/admin/StatisticCard';

export default function LocationDashboardPage() {
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

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, typeFilter, page, pathname, router, searchParams]);

  const sortBy = sort.direction
    ? `${sort.column}:${sort.direction}`
    : 'createdAt:DESC';

  // Convert typeFilter to isBusiness parameter for API
  const isBusinessFilter =
    typeFilter === 'all' ? undefined : typeFilter === 'business' ? true : false; // public

  // Data fetching for locations
  const { data, isLoading, error } = useAllLocations(
    page,
    itemsPerPage,
    debouncedSearchTerm.trim() || undefined,
    sortBy,
    isBusinessFilter
  );

  const locations = data?.data || [];
  const meta = data?.meta;

  const locationStats = useLocationStats();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allLocations'] });
    queryClient.invalidateQueries({ queryKey: ['locationStats'] });
  };

  if (error) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-red-600'>
              Error loading locations. Please try again.
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

  return (
    <PageContainer>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>
        <StatisticCard
          title='Total Locations'
          subtitle={`${locations.length} on this page`}
          value={
            locationStats.isLoading ? '—' : locationStats.total.toLocaleString()
          }
          icon={MapPin}
          iconColorClass='blue'
        />

        <StatisticCard
          title='Business Locations'
          subtitle={`${
            locationStats.total > 0
              ? Math.round((locationStats.business / locationStats.total) * 100)
              : 0
          }% of total`}
          value={
            locationStats.isLoading
              ? '—'
              : locationStats.business.toLocaleString()
          }
          icon={Building2}
          iconColorClass='amber'
        />

        <StatisticCard
          title='Public Locations'
          subtitle={`${
            locationStats.total > 0
              ? Math.round((locationStats.public / locationStats.total) * 100)
              : 0
          }% of total`}
          value={
            locationStats.isLoading
              ? '—'
              : locationStats.public.toLocaleString()
          }
          icon={Globe}
          iconColorClass='purple'
        />

        <StatisticCard
          title='Visible on Map'
          subtitle={`${
            locationStats.total > 0
              ? Math.round((locationStats.visible / locationStats.total) * 100)
              : 0
          }% of total`}
          value={
            locationStats.isLoading
              ? '—'
              : locationStats.visible.toLocaleString()
          }
          icon={Eye}
          iconColorClass='green'
        />
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle>All Locations</CardTitle>
              <CardDescription className='mt-1'>
                Total {meta?.totalItems || 0} locations in the system
              </CardDescription>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search locations...'
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
                  <SelectItem value='business'>Business</SelectItem>
                  <SelectItem value='public'>Public</SelectItem>
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
                        column='name'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Location
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='ownershipType'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Type
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='addressLine'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Address
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='averageRating'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Rating
                      </SortableTableHeader>
                      <TableHead className='text-center'>Stats</TableHead>
                      <SortableTableHeader
                        column='isVisibleOnMap'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Status
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
                    {locations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className='text-center h-32'>
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <MapPin className='h-12 w-12 text-muted-foreground/50' />
                            <p className='text-muted-foreground font-medium'>
                              No locations found
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              Try changing filters or search keywords
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      locations.map((loc: any, index: number) => (
                        <TableRow
                          key={loc.id}
                          className='hover:bg-muted/50 transition-colors'
                        >
                          <TableCell className='text-center text-muted-foreground font-medium'>
                            {(page - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/locations/${loc.id}`}
                              className='flex items-center gap-3 group'
                            >
                              {loc.imageUrl && loc.imageUrl.length > 0 ? (
                                <div className='relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border-2 border-background'>
                                  <Image
                                    src={loc.imageUrl[0]}
                                    alt={loc.name}
                                    fill
                                    className='object-cover'
                                    sizes='40px'
                                  />
                                </div>
                              ) : (
                                <div className='h-10 w-10 flex-shrink-0 rounded-md bg-muted border-2 border-background flex items-center justify-center'>
                                  <MapPin className='h-4 w-4 text-muted-foreground' />
                                </div>
                              )}
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium group-hover:text-primary transition-colors truncate'>
                                  {loc.name}
                                </p>
                                {loc.business && (
                                  <p className='text-xs text-muted-foreground flex items-center gap-1 truncate'>
                                    <Building2 className='h-3 w-3 shrink-0' />
                                    <span className='truncate'>
                                      {loc.business.name}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            {loc.ownershipType === 'OWNED_BY_BUSINESS' ? (
                              <Badge
                                variant='outline'
                                className='flex items-center w-fit gap-1 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
                              >
                                <Building2 className='h-3 w-3' />
                                Business
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='flex items-center w-fit gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                              >
                                <Globe className='h-3 w-3' />
                                Public
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className='text-muted-foreground max-w-[200px]'>
                            <div className='truncate' title={loc.addressLine}>
                              {loc.addressLine}
                              {loc.addressLevel1 && `, ${loc.addressLevel1}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1'>
                              <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                              <span className='font-medium'>
                                {loc.averageRating
                                  ? loc.averageRating.toFixed(1)
                                  : '0.0'}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                ({loc.totalReviews || 0})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col gap-1 text-xs text-center'>
                              <div className='flex items-center justify-center gap-1'>
                                <CheckCircle className='h-3 w-3 text-green-600' />
                                <span>{loc.totalCheckIns || 0}</span>
                              </div>
                              <div className='flex items-center justify-center gap-1'>
                                <FileText className='h-3 w-3 text-blue-600' />
                                <span>{loc.totalReviews || 0}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {loc.isVisibleOnMap ? (
                              <Badge
                                variant='outline'
                                className='px-2.5 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
                              >
                                Visible
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='px-2.5 py-0.5 bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800'
                              >
                                Hidden
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {formatShortDate(loc.createdAt)}
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
                    locations
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
