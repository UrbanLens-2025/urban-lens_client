'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SortableTableHeader, SortDirection } from '@/components/shared/SortableTableHeader';
import { TableFilters } from '@/components/shared/TableFilters';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
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
  IconSearch,
  IconRefresh,
} from '@tabler/icons-react';
import { Loader2, MapPin, Building2, Globe, Eye } from 'lucide-react';
import { Location } from '@/types';
import { useAllLocations } from '@/hooks/admin/useAllLocations';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function LocationDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState<{ column: string; direction: SortDirection }>({
    column: "createdAt",
    direction: "DESC",
  });
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const itemsPerPage = 10;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();
    
    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    } else {
      params.delete('search');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, page, pathname, router, searchParams]);

  const sortBy = sort.direction 
    ? `${sort.column}:${sort.direction}` 
    : "createdAt:DESC";

  // Data fetching for locations
  const { data, isLoading, error } = useAllLocations(
    page,
    itemsPerPage,
    debouncedSearchTerm.trim() || undefined,
    sortBy
  );

  const locations = data?.data || [];
  const meta = data?.meta;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allLocations'] });
  };

  // Filter locations by type
  const filteredLocations = useMemo(() => {
    if (typeFilter === "all") return locations;
    if (typeFilter === "business") return locations.filter((loc: Location) => loc.business);
    return locations.filter((loc: Location) => !loc.business);
  }, [locations, typeFilter]);

  // Calculate statistics - show accurate totals and current view stats
  const stats = useMemo(() => {
    const totalLocations = meta?.totalItems || 0;
    
    // Current view stats (from filtered/paginated data)
    const currentViewBusiness = filteredLocations.filter((loc: Location) => loc.business).length;
    const currentViewPublic = filteredLocations.filter((loc: Location) => !loc.business).length;
    const currentViewVisible = filteredLocations.filter((loc: Location) => loc.isVisibleOnMap).length;
    
    // Check if filters are active
    const hasFilters = typeFilter !== "all" || !!debouncedSearchTerm;
    
    return {
      totalLocations,
      currentViewBusiness,
      currentViewPublic,
      currentViewVisible,
      hasFilters,
      currentViewTotal: filteredLocations.length,
    };
  }, [filteredLocations, meta, typeFilter, debouncedSearchTerm]);

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading locations. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "all") count++;
    if (debouncedSearchTerm) count++;
    return count;
  }, [typeFilter, debouncedSearchTerm]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setSort({ column: "createdAt", direction: "DESC" });
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Location Management"
        description="Manage and view all approved locations"
        icon={MapPin}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Locations"
          value={stats.totalLocations.toLocaleString()}
          description={stats.hasFilters ? `Showing ${stats.currentViewTotal} in current view` : "All approved locations"}
          icon={MapPin}
          iconBg="bg-blue-100 dark:bg-blue-950"
          iconColor="text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="Business Locations"
          value={stats.hasFilters ? stats.currentViewBusiness.toLocaleString() : "—"}
          description={stats.hasFilters 
            ? `In current view${stats.currentViewTotal > 0 ? ` (${Math.round((stats.currentViewBusiness / stats.currentViewTotal) * 100)}%)` : ''}`
            : "Apply filters to see breakdown"}
          icon={Building2}
          iconBg="bg-orange-100 dark:bg-orange-950"
          iconColor="text-orange-600 dark:text-orange-400"
        />

        <StatCard
          title="Public Locations"
          value={stats.hasFilters ? stats.currentViewPublic.toLocaleString() : "—"}
          description={stats.hasFilters
            ? `In current view${stats.currentViewTotal > 0 ? ` (${Math.round((stats.currentViewPublic / stats.currentViewTotal) * 100)}%)` : ''}`
            : "Apply filters to see breakdown"}
          icon={Globe}
          iconBg="bg-purple-100 dark:bg-purple-950"
          iconColor="text-purple-600 dark:text-purple-400"
        />

        <StatCard
          title="Visible on Map"
          value={stats.hasFilters ? stats.currentViewVisible.toLocaleString() : "—"}
          description={stats.hasFilters
            ? `In current view${stats.currentViewTotal > 0 ? ` (${Math.round((stats.currentViewVisible / stats.currentViewTotal) * 100)}%)` : ''}`
            : "Apply filters to see breakdown"}
          icon={Eye}
          iconBg="bg-green-100 dark:bg-green-950"
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            {/* Filters */}
            <TableFilters
              searchValue={searchTerm}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setPage(1);
              }}
              searchPlaceholder="Search locations..."
              filters={[
                {
                  key: "type",
                  label: "Type",
                  value: typeFilter,
                  options: [
                    { value: "all", label: "All Types" },
                    { value: "business", label: "Business" },
                    { value: "public", label: "Public" },
                  ],
                  onValueChange: (value) => {
                    setTypeFilter(value);
                    setPage(1);
                  },
                },
              ]}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
              actions={
                <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading} className="h-11 border-2 border-primary/20">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <IconRefresh className="h-4 w-4" />
                  )}
                </Button>
              }
            />

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px] font-semibold">#</TableHead>
                      <SortableTableHeader
                        column="name"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="business"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Type
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="addressLine"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Address
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="isVisibleOnMap"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Visible
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="createdAt"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Created
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <MapPin className="h-12 w-12 mb-4 opacity-50" />
                            <p className="font-medium">No locations found</p>
                            <p className="text-sm mt-2">
                              {debouncedSearchTerm || typeFilter !== "all"
                                ? "Try adjusting your filters"
                                : "No locations available"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocations.map((loc: Location, index: number) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {(page - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px]">
                        <a
                          href={`/admin/locations/${loc.id}`}
                          className="hover:underline text-blue-600 hover:text-blue-800 flex items-center gap-3"
                        >
                          {loc.imageUrl && loc.imageUrl.length > 0 ? (
                            <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border border-border">
                              <Image
                                src={loc.imageUrl[0]}
                                alt={loc.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 flex-shrink-0 rounded-md bg-muted border border-border flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="truncate">{loc.name}</span>
                        </a>
                      </TableCell>
                      <TableCell>
                        {loc.business ? (
                          <Badge 
                            variant="outline" 
                            className="flex items-center w-fit bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
                          >
                            <Building2 className="h-3 w-3 mr-1" />
                            <a
                              href={`/admin/business/${loc.business.accountId}`}
                              className="hover:underline"
                            >
                              Business
                            </a>
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className="flex items-center w-fit bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            <span>Public</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {loc.addressLine}
                        {loc.addressLevel1 && `, ${loc.addressLevel1}`}
                      </TableCell>
                      <TableCell>
                        {loc.isVisibleOnMap ? (
                          <Badge 
                            variant="outline" 
                            className="flex items-center w-fit bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className="flex items-center w-fit bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
                          >
                            Hidden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatShortDate(loc.createdAt)}</TableCell>
                    </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="border-t border-primary/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * itemsPerPage) + 1} to{" "}
                    {Math.min(page * itemsPerPage, meta.totalItems)} of{" "}
                    {meta.totalItems} locations
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1 || isLoading}
                      className="h-10"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {page} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= meta.totalPages || isLoading}
                      className="h-10"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </PageContainer>
    );
  }
