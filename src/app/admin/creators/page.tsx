'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconSearch,
  IconFilter,
  IconUserStar,
  IconRefresh,
  IconStar,
  IconUserCheck,
  IconUserX,
  IconCalendar,
  IconTrendingUp,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAllAccounts } from '@/hooks/admin/useAllAccounts';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminCreatorsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked' | 'onboarded'>(
    (searchParams.get('status') as any) || 'all'
  );
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
    
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusFilter, page, pathname, router, searchParams]);

  // Fetch creator accounts (EVENT_CREATOR role)
  const { data, isLoading, error } = useAllAccounts({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    searchBy: debouncedSearchTerm.trim() ? ['email', 'firstName', 'lastName', 'phoneNumber'] : undefined,
    filterRole: '$eq:EVENT_CREATOR',
    sortBy: ['createdAt:DESC'],
  });

  const creators = data?.data?.data || [];
  const meta = data?.data?.meta;

  // Filter by status
  const filteredCreators = useMemo(() => {
    if (statusFilter === 'all') return creators;
    if (statusFilter === 'active') return creators.filter((c: any) => !c.isLocked);
    if (statusFilter === 'locked') return creators.filter((c: any) => c.isLocked);
    if (statusFilter === 'onboarded') return creators.filter((c: any) => c.hasOnboarded);
    return creators;
  }, [creators, statusFilter]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allAccounts'] });
  };

  // Calculate statistics from actual creators data
  const stats = useMemo(() => {
    const total = meta?.totalItems || 0;
    const active = creators.filter((c: any) => !c.isLocked).length;
    const locked = creators.filter((c: any) => c.isLocked).length;
    const onboarded = creators.filter((c: any) => c.hasOnboarded).length;

    // Estimate totals based on current page if we have paginated data
    const activeEstimate = total > 0 && creators.length > 0
      ? Math.round((active / creators.length) * total)
      : active;
    const lockedEstimate = total > 0 && creators.length > 0
      ? Math.round((locked / creators.length) * total)
      : locked;
    const onboardedEstimate = total > 0 && creators.length > 0
      ? Math.round((onboarded / creators.length) * total)
      : onboarded;

    return {
      total,
      active: activeEstimate,
      locked: lockedEstimate,
      onboarded: onboardedEstimate,
    };
  }, [creators, meta]);

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading creators. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Creator Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Manage event creator accounts and profiles
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
          <IconRefresh className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <IconUserStar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All creator accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 cursor-pointer" onClick={() => { setStatusFilter('active'); setPage(1); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <IconUserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Not locked accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500 cursor-pointer" onClick={() => { setStatusFilter('locked'); setPage(1); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked</CardTitle>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <IconUserX className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.locked}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Restricted accounts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500 cursor-pointer" onClick={() => { setStatusFilter('onboarded'); setPage(1); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarded</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <IconTrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.onboarded}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed onboarding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Creators ({meta?.totalItems || 0})</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search creators..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as any);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="onboarded">Onboarded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
          <CardDescription>
            Showing {filteredCreators.length} of {meta?.totalItems || 0} creators
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
                    <TableHead>Creator</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Onboarded</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCreators.map((creator: any, index: number) => (
                    <TableRow key={creator.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/creators/${creator.id}`)}>
                      <TableCell className="font-medium text-muted-foreground">
                        {(page - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={creator.avatarUrl || undefined} alt={`${creator.firstName} ${creator.lastName}`} />
                            <AvatarFallback>
                              {creator.firstName?.[0]}{creator.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/admin/creators/${creator.id}`}
                              className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {creator.firstName} {creator.lastName}
                            </Link>
                            {creator.phoneNumber && (
                              <p className="text-xs text-muted-foreground">{creator.phoneNumber}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{creator.email}</TableCell>
                      <TableCell>
                        {creator.isLocked ? (
                          <Badge variant="destructive" className="flex items-center w-fit">
                            <IconUserX className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center w-fit bg-green-600">
                            <IconUserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {creator.hasOnboarded ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatShortDate(creator.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCreators.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No creators found matching your criteria.
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

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
