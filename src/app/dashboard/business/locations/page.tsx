'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  PlusCircle,
  Search,
  Eye,
  Users,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useMyLocations } from '@/hooks/locations/useMyLocations';
import Link from 'next/link';
import Image from 'next/image';
import type { Location } from '@/types';
import {
  SortableTableHeader,
  SortDirection,
} from '@/components/shared/SortableTableHeader';
import { TableFilters } from '@/components/shared/TableFilters';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
import {
  IconFile,
  IconMapPin,
  IconMessageCircle,
  IconStar,
} from '@tabler/icons-react';

const getStatusLabel = (isVisible: boolean) => {
  return isVisible ? 'Visible' : 'Hidden';
};

const getStatusIcon = (isVisible: boolean) => {
  return <Eye className='h-3 w-3' />;
};

const getStatusBadgeStyle = (isVisible: boolean) => {
  return isVisible
    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
    : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
};

export default function MyLocationsPage() {
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const sortBy = sort.direction
    ? `${sort.column}:${sort.direction}`
    : undefined;

  const {
    data: locationsData,
    isLoading,
    refetch,
  } = useMyLocations(page, debouncedSearchTerm, {
    limit: 10,
    sortBy: sortBy || 'createdAt:DESC',
    searchBy: ['name', 'addressLine', 'description'],
  });

  const allLocations = locationsData?.data || [];
  const meta = locationsData?.meta;

  // Filter locations by visibility if visibility filter is set
  const locations =
    visibilityFilter === 'all'
      ? allLocations
      : visibilityFilter === 'visible'
      ? allLocations.filter((location) => location.isVisibleOnMap)
      : allLocations.filter((location) => !location.isVisibleOnMap);

  // Calculate statistics from actual data
  const stats = useMemo(() => {
    const totalCheckIns = allLocations.reduce(
      (sum, loc) => sum + parseInt(loc.totalCheckIns || '0'),
      0
    );

    return {
      totalLocations: meta?.totalItems ?? 0,
      visibleLocations: allLocations.filter((loc) => loc.isVisibleOnMap).length,
      hiddenLocations: allLocations.filter((loc) => !loc.isVisibleOnMap).length,
      totalCheckIns,
    };
  }, [allLocations, meta]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateWithoutYear = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      .replace(',', '');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (visibilityFilter !== 'all') count++;
    if (debouncedSearchTerm) count++;
    return count;
  }, [visibilityFilter, debouncedSearchTerm]);

  const handleClearFilters = () => {
    setSearch('');
    setVisibilityFilter('all');
    setSort({ column: 'createdAt', direction: 'DESC' });
    setPage(1);
  };

  return (
    <PageContainer>
      {/* Professional Header */}
      <PageHeader
        title='My Locations'
        description='View and manage your locations'
        icon={MapPin}
        actions={
          <Button
            asChild
            className='h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg'
          >
            <Link href='/dashboard/business/locations/create'>
              <PlusCircle className='mr-2 h-4 w-4' />
              Add Location
            </Link>
          </Button>
        }
      />

      {/* Quick Statistics */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <StatCard
          title='Total Locations'
          value={stats.totalLocations}
          icon={MapPin}
          color='blue'
          description='All time'
        />

        <StatCard
          title='Visible on Map'
          value={stats.visibleLocations}
          icon={Eye}
          color='green'
          description='Currently visible'
        />

        <StatCard
          title='Hidden'
          value={stats.hiddenLocations}
          icon={Eye}
          color='orange'
          description='Not visible'
        />
      </div>

      {/* Locations Table */}
      <Card className='overflow-hidden border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
        <CardContent className='p-0'>
          <div className='flex flex-col h-full'>
            {/* Search and Filter Section */}
            <TableFilters
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder='Search by location name or address...'
              filters={[
                {
                  key: 'visibility',
                  label: 'Visibility',
                  value: visibilityFilter,
                  options: [
                    { value: 'all', label: 'All Visibility' },
                    { value: 'visible', label: 'Visible' },
                    { value: 'hidden', label: 'Hidden' },
                  ],
                  onValueChange: (value) => {
                    setVisibilityFilter(value);
                    setPage(1);
                  },
                },
              ]}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
              actions={
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    refetch();
                    setPage(1);
                  }}
                  disabled={isLoading}
                  className='h-11 border-2 border-primary/20'
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                  />
                </Button>
              }
            />

            {/* Table Section */}
            <div className='flex-1 overflow-auto'>
              {isLoading && !locationsData ? (
                <div className='text-center py-12'>
                  <Loader2 className='mx-auto h-12 w-12 animate-spin text-muted-foreground/50' />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/50 border-b'>
                      <TableHead className='w-12 font-semibold pl-6'>
                        #
                      </TableHead>
                      <SortableTableHeader
                        column='name'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Location Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='addressLine'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Address
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='radiusMeters'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Radius (m)
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='statistics'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Stats
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='createdAt'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Created
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='isVisibleOnMap'
                        currentSort={sort}
                        onSort={handleSort}
                        className='pr-6'
                      >
                        Status
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='text-center py-12 pl-6 pr-6'
                        >
                          <div className='flex flex-col items-center justify-center text-muted-foreground'>
                            <MapPin className='h-12 w-12 mb-4' />
                            <p className='font-medium'>No locations found</p>
                            <p className='text-sm mt-2'>
                              {debouncedSearchTerm
                                ? 'Try adjusting your search terms'
                                : 'Create your first location to get started'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      locations.map((location: Location, index: number) => {
                        const rowNumber =
                          ((meta?.currentPage || 1) - 1) *
                            (meta?.itemsPerPage || 10) +
                          index +
                          1;
                        const visibleTags = location.tags?.slice(0, 2) || [];
                        const remainingTagsCount =
                          (location.tags?.length || 0) - visibleTags.length;

                        return (
                          <TableRow
                            key={location.id}
                            className='hover:bg-muted/30 transition-colors'
                          >
                            <TableCell className='py-4 pl-6'>
                              <span className='text-sm font-medium text-muted-foreground'>
                                {rowNumber}
                              </span>
                            </TableCell>
                            <TableCell className='py-4'>
                              <Link
                                href={`/dashboard/business/locations/${location.id}`}
                                className='hover:underline'
                              >
                                <div className='flex items-center gap-3'>
                                  {location.imageUrl &&
                                  location.imageUrl.length > 0 ? (
                                    <div className='relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border border-border'>
                                      <Image
                                        src={location.imageUrl[0]}
                                        alt={location.name}
                                        fill
                                        className='object-cover'
                                        sizes='40px'
                                      />
                                    </div>
                                  ) : (
                                    <div className='h-10 w-10 flex-shrink-0 rounded-md bg-muted border border-border flex items-center justify-center'>
                                      <MapPin className='h-4 w-4 text-muted-foreground' />
                                    </div>
                                  )}
                                  <div className='flex flex-col gap-1 min-w-0'>
                                    <span className='font-semibold text-foreground hover:text-primary transition-colors truncate'>
                                      {location.name}
                                    </span>
                                    <span className='text-sm text-gray-500 truncate max-w-[400px]'>
                                      {location.description}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell className='py-4'>
                              <div className='flex items-center gap-2 max-w-[200px]'>
                                <MapPin className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                <div className='flex flex-col min-w-0 gap-0.5'>
                                  <span className='text-sm font-medium'>
                                    {location.addressLine || 'N/A'}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    {[
                                      location.addressLevel1,
                                      location.addressLevel2,
                                    ]
                                      .filter(Boolean)
                                      .join(', ') || ''}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className='py-4'>
                              <span className='text-sm font-medium'>
                                {location.radiusMeters || 0} m
                              </span>
                            </TableCell>
                            <TableCell className='flex items-center gap-2 my-4'>
                              <div className='flex items-center gap-2'>
                                <IconMapPin className='h-4 w-4 text-muted-foreground' />
                                <span className='text-sm font-medium'>
                                  {location.totalCheckIns || 0}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <IconMessageCircle className='h-4 w-4 text-muted-foreground' />
                                <span className='text-sm font-medium'>
                                  {location.totalReviews || 0}
                                </span>
                              </div>
                              <div className='flex items-center gap-2'>
                                <IconStar className='h-4 w-4 text-muted-foreground' />
                                <span className='text-sm font-medium'>
                                  {location.averageRating || 0}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className='py-4'>
                              <div className='flex flex-col gap-0.5'>
                                <span className='text-sm font-medium'>
                                  {formatDateWithoutYear(location.createdAt)}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                  {formatTime(location.createdAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className='py-4 pr-6'>
                              <Badge
                                variant='outline'
                                className={`${getStatusBadgeStyle(
                                  location.isVisibleOnMap
                                )} flex items-center gap-1.5 w-fit font-medium`}
                              >
                                {getStatusIcon(location.isVisibleOnMap)}
                                {getStatusLabel(location.isVisibleOnMap)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Table Bottom Border and Pagination */}
            <div className='border-t'>
              {meta && meta.totalPages > 1 && (
                <div className='px-6 py-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>
                      Showing {(meta.currentPage - 1) * meta.itemsPerPage + 1}{' '}
                      to{' '}
                      {Math.min(
                        meta.currentPage * meta.itemsPerPage,
                        meta.totalItems
                      )}{' '}
                      of {meta.totalItems} locations
                    </p>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage(page - 1)}
                        disabled={!meta || meta.currentPage <= 1 || isLoading}
                      >
                        Previous
                      </Button>
                      <span className='text-sm text-muted-foreground px-2'>
                        Page {meta.currentPage} of {meta.totalPages}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage(page + 1)}
                        disabled={
                          !meta ||
                          meta.currentPage >= meta.totalPages ||
                          isLoading
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
