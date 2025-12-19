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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAllAccounts } from '@/hooks/admin/useAllAccounts';
import {
  Loader2,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  Star,
  User,
  Mail,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import {
  SortableTableHeader,
  SortDirection,
} from '@/components/shared/SortableTableHeader';
import StatisticCard from '@/components/admin/StatisticCard';

export default function AccountsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState(
    searchParams.get('role') || 'ALL'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const itemsPerPage = 8;

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();

    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    } else {
      params.delete('search');
    }

    if (roleFilter !== 'ALL') {
      params.set('role', roleFilter);
    } else {
      params.delete('role');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, roleFilter, page, pathname, router, searchParams]);

  const sortBy = sort.direction
    ? [`${sort.column}:${sort.direction}`]
    : ['createdAt:DESC'];

  const { data, isLoading, error } = useAllAccounts({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    searchBy: debouncedSearchTerm.trim()
      ? ['email', 'firstName', 'lastName', 'phoneNumber']
      : undefined,
    filterRole: roleFilter !== 'ALL' ? `$eq:${roleFilter}` : undefined,
    sortBy: sortBy,
  });

  const accounts = data?.data?.data || [];
  const meta = data?.data?.meta;

  const stats = useMemo(() => {
    const total = meta?.totalItems || 0;
    const currentPageActive = accounts.filter(
      (acc: any) => !acc.isLocked
    ).length;
    const currentPageLocked = accounts.filter(
      (acc: any) => acc.isLocked
    ).length;
    const currentPageOnboarded = accounts.filter(
      (acc: any) => acc.hasOnboarded
    ).length;

    const byRoleCounts: Record<string, number> = {
      BUSINESS_OWNER: 0,
      EVENT_CREATOR: 0,
      USER: 0,
    };

    accounts.forEach((acc: any) => {
      if (byRoleCounts[acc.role] !== undefined) {
        byRoleCounts[acc.role]++;
      }
    });

    const currentPageTotal = accounts.length;
    const activeEstimate =
      total > 0 && currentPageTotal > 0
        ? Math.round((currentPageActive / currentPageTotal) * total)
        : currentPageActive;
    const lockedEstimate =
      total > 0 && currentPageTotal > 0
        ? Math.round((currentPageLocked / currentPageTotal) * total)
        : currentPageLocked;
    const onboardedEstimate =
      total > 0 && currentPageTotal > 0
        ? Math.round((currentPageOnboarded / currentPageTotal) * total)
        : currentPageOnboarded;

    return {
      total,
      active: Math.min(activeEstimate, total),
      locked: Math.min(lockedEstimate, total),
      onboarded: Math.min(onboardedEstimate, total),
      byRole: byRoleCounts,
    };
  }, [accounts, meta]);

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'BUSINESS_OWNER':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200';
      case 'EVENT_CREATOR':
        return 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200';
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'BUSINESS_OWNER':
        return <Building2 className='h-4 w-4 mr-2' />;
      case 'EVENT_CREATOR':
        return <Star className='h-4 w-4 mr-2' />;
      default:
        return <User className='h-4 w-4 mr-2' />;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatRoleName = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  if (error) {
    return (
      <div className='space-y-6'>
        <Card className='border-red-200 dark:border-red-800'>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3 text-red-600 dark:text-red-400'>
              <AlertTriangle className='h-5 w-5' />
              <p>Error loading accounts data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>
        <StatisticCard
          title='Total Accounts'
          value={stats.total - 1}
          icon={Users}
          iconColorClass='blue'
          subtitle='All accounts in the system'
        />
        <StatisticCard
          title='Active accounts'
          value={stats.active - 1}
          icon={Users}
          iconColorClass='green'
          subtitle='Accounts are not locked'
        />
        <StatisticCard
          title='Locked accounts'
          value={stats.locked.toLocaleString()}
          icon={Users}
          iconColorClass='red'
          subtitle='Accounts are locked'
        />
        <Card className='hover:shadow-md transition-shadow border-l-6 border-purple-500'>
          <CardContent className='py-2 px-6'>
            <div className='space-y-2'>
              {Object.entries(stats.byRole)
                .filter(([_, count]) => count > 0)
                .map(([role, count]: [string, any]) => (
                  <div key={role} className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      {getRoleIcon(role)}
                      <span className='text-md font-medium text-muted-foreground'>
                        {formatRoleName(role)}
                      </span>
                    </div>
                    <Badge variant='secondary' className='font-semibold'>
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle>Accounts</CardTitle>
              <CardDescription className='mt-1'>
                Total {meta?.totalItems || 0} accounts in the system
              </CardDescription>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by name, email...'
                  className='pl-9 w-full sm:w-[280px]'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-[200px]'>
                  <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4' />
                    <SelectValue placeholder='Filter by role' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ALL'>All roles</SelectItem>
                  <SelectItem value='BUSINESS_OWNER'>Business Owner</SelectItem>
                  <SelectItem value='EVENT_CREATOR'>Event Creator</SelectItem>
                  <SelectItem value='USER'>User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center h-58 gap-2'>
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
                        column='firstName'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        User
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='email'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Email
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='role'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Role
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='isLocked'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Status
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='hasOnboarded'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Onboarding
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account: any, index: number) => (
                      <TableRow
                        key={account.id}
                        className='hover:bg-muted/50 transition-colors'
                      >
                        <TableCell className='text-center text-muted-foreground font-medium'>
                          {(page - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/accounts/${account.id}`}
                            className='flex items-center gap-3 group'
                          >
                            <Avatar className='h-10 w-10 border-2 border-background'>
                              {account.avatarUrl && (
                                <AvatarImage
                                  src={account.avatarUrl}
                                  alt={`${account.firstName} ${account.lastName}`}
                                  className='object-cover'
                                />
                              )}
                              <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                                {getInitials(
                                  account.firstName || '',
                                  account.lastName || ''
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium group-hover:text-primary transition-colors truncate'>
                                {account.firstName} {account.lastName}
                              </p>
                              {account.phoneNumber && (
                                <p className='text-xs text-muted-foreground flex items-center gap-1 truncate'>
                                  <Phone className='h-3 w-3 shrink-0' />
                                  <span className='truncate'>
                                    {account.phoneNumber}
                                  </span>
                                </p>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2 min-w-0'>
                            <Mail className='h-4 w-4 text-muted-foreground shrink-0' />
                            <span
                              className='text-sm truncate'
                              title={account.email}
                            >
                              {account.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={`flex items-center w-fit gap-1 ${getRoleBadgeStyles(
                              account.role
                            )}`}
                          >
                            {getRoleIcon(account.role)}
                            <span>{formatRoleName(account.role)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={`px-2.5 py-0.5 ${
                              account.isLocked
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                                : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
                            }`}
                          >
                            {account.isLocked ? 'Locked' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={
                              account.hasOnboarded
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
                                : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800'
                            }
                          >
                            {account.hasOnboarded ? 'Completed' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {accounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center h-32'>
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <Users className='h-12 w-12 text-muted-foreground/50' />
                            <p className='text-muted-foreground font-medium'>
                              No accounts found
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              Try changing filters or search keywords
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
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
                    accounts
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
    </div>
  );
}
