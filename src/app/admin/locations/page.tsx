'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  IconMapPin,
  IconBuildingStore,
  IconWorld,
  IconEye,
} from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import { Location } from '@/types';
import { useAllLocations } from '@/hooks/admin/useAllLocations';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function LocationDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
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

  // Data fetching for locations
  const { data, isLoading, error } = useAllLocations(
    page,
    itemsPerPage,
    debouncedSearchTerm.trim() || undefined,
    'createdAt:DESC'
  );

  const locations = data?.data || [];
  const meta = data?.meta;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allLocations'] });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    // TODO: Implement real statistics from API
    // Currently using mock data as the list API only returns paginated results
    return {
      totalLocations: meta?.totalItems || 0,
      businessLocations: 18, // Mock data - TODO: Get from API
      publicLocations: 10, // Mock data - TODO: Get from API
      visibleOnMap: 25, // Mock data - TODO: Get from API
    };
  }, [meta]);

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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <IconMapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground">
              Approved locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Locations</CardTitle>
            <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.businessLocations}</div>
            <p className="text-xs text-muted-foreground">
              Owned by businesses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Locations</CardTitle>
            <IconWorld className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publicLocations}</div>
            <p className="text-xs text-muted-foreground">
              Publicly accessible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible on Map</CardTitle>
            <IconEye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visibleOnMap}</div>
            <p className="text-xs text-muted-foreground">
              Shown on map
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Locations ({meta?.totalItems || 0})</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconRefresh className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="hidden">
            Manage approved locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc: Location, index: number) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {(page - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px]">
                        <a
                          href={`/admin/locations/${loc.id}`}
                          className="hover:underline text-blue-600 hover:text-blue-800 truncate block"
                        >
                          {loc.name}
                        </a>
                      </TableCell>
                      <TableCell>
                        {loc.business ? (
                          <Badge 
                            variant="outline" 
                            className="flex items-center w-fit bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200"
                          >
                            <IconBuildingStore className="h-3 w-3 mr-1" />
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
                            <IconWorld className="h-3 w-3 mr-1" />
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
                            <IconEye className="h-3 w-3 mr-1" />
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
                  ))}
                  {locations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No locations found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {meta.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
