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
import { IconSearch, IconFilter, IconUsers, IconUserCheck, IconUserX, IconShieldCheck, IconBriefcase, IconStar, IconUser } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { useAllAccounts } from '@/hooks/admin/useAllAccounts';
import { Loader2, Users, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { SortableTableHeader, SortDirection } from '@/components/shared/SortableTableHeader';
import { StatCard } from '@/components/shared/StatCard';

export default function AccountsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize state from URL params or defaults
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'ALL');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [sort, setSort] = useState<{ column: string; direction: SortDirection }>({
        column: 'createdAt',
        direction: 'DESC',
    });
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

    // Fetch accounts from API
    const { data, isLoading, error } = useAllAccounts({
        page,
        limit: itemsPerPage,
        search: debouncedSearchTerm.trim() || undefined,
        searchBy: debouncedSearchTerm.trim() ? ['email', 'firstName', 'lastName', 'phoneNumber'] : undefined,
        filterRole: roleFilter !== 'ALL' ? `$eq:${roleFilter}` : undefined,
        sortBy: sortBy,
    });

    const accounts = data?.data?.data || [];
    const meta = data?.data?.meta;

    // Calculate statistics from actual accounts data
    const stats = useMemo(() => {
        const total = meta?.totalItems || 0;
        const active = accounts.filter((acc: any) => !acc.isLocked).length;
        const locked = accounts.filter((acc: any) => acc.isLocked).length;
        const onboarded = accounts.filter((acc: any) => acc.hasOnboarded).length;

        // Count by role from current page
        const byRoleCounts: Record<string, number> = {
            'ADMIN': 0,
            'BUSINESS_OWNER': 0,
            'EVENT_CREATOR': 0,
            'USER': 0
        };

        accounts.forEach((acc: any) => {
            if (byRoleCounts[acc.role] !== undefined) {
                byRoleCounts[acc.role]++;
            }
        });

        // Estimate totals based on current page if we have paginated data
        const activeEstimate = total > 0 && accounts.length > 0
            ? Math.round((active / accounts.length) * total)
            : active;
        const lockedEstimate = total > 0 && accounts.length > 0
            ? Math.round((locked / accounts.length) * total)
            : locked;
        const onboardedEstimate = total > 0 && accounts.length > 0
            ? Math.round((onboarded / accounts.length) * total)
            : onboarded;

        return {
            total,
            active: activeEstimate,
            locked: lockedEstimate,
            onboarded: onboardedEstimate,
            byRole: byRoleCounts
        };
    }, [accounts, meta]);

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'default';
            case 'BUSINESS_OWNER':
                return 'secondary';
            case 'EVENT_CREATOR':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getRoleBadgeStyles = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200';
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
            case 'ADMIN':
                return <IconShieldCheck className="h-3 w-3 mr-1" />;
            case 'BUSINESS_OWNER':
                return <IconBriefcase className="h-3 w-3 mr-1" />;
            case 'EVENT_CREATOR':
                return <IconStar className="h-3 w-3 mr-1" />;
            default:
                return <IconUser className="h-3 w-3 mr-1" />;
        }
    };

    const getStatusColor = (isLocked: boolean) => {
        return isLocked
            ? 'text-red-600 bg-red-100'
            : 'text-green-600 bg-green-100';
    };

    const handleSort = (column: string, direction: SortDirection) => {
        setSort({ column, direction });
        setPage(1);
    };

    if (error) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-red-600">Error loading accounts. Please try again.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Accounts"
                    value={stats.total.toLocaleString()}
                    description={`${stats.onboarded} onboarded`}
                    icon={Users}
                    color="blue"
                />

                <StatCard
                    title="Active"
                    value={stats.active.toLocaleString()}
                    description="Not locked accounts"
                    icon={UserCheck}
                    color="green"
                />

                <StatCard
                    title="Locked"
                    value={stats.locked.toLocaleString()}
                    description="Restricted accounts"
                    icon={UserX}
                    color="red"
                />

                <Card className="border-2 border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-card/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">By Role</CardTitle>
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md bg-purple-100 dark:bg-purple-900/30">
                            <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.entries(stats.byRole).map(([role, count]: [string, any]) => (
                                <div key={role} className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">{role.replace('_', ' ')}</span>
                                    <span className="text-sm font-semibold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>All Accounts ({meta?.totalItems || 0})</span>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search accounts..."
                                    className="pl-8 w-[250px]"
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
                                <SelectTrigger className="w-[180px]">
                                    <div className="flex items-center gap-2">
                                        <IconFilter className="h-4 w-4" />
                                        <SelectValue placeholder="Filter by Role" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Roles</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="BUSINESS_OWNER">Business Owner</SelectItem>
                                    <SelectItem value="EVENT_CREATOR">Event Creator</SelectItem>
                                    <SelectItem value="USER">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardTitle>
                    <CardDescription className="hidden">
                        Manage users, business owners, and administrators.
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
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <SortableTableHeader
                                            column="firstName"
                                            currentSort={sort}
                                            onSort={handleSort}
                                        >
                                            Name
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            column="email"
                                            currentSort={sort}
                                            onSort={handleSort}
                                        >
                                            Email
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            column="role"
                                            currentSort={sort}
                                            onSort={handleSort}
                                        >
                                            Role
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            column="isLocked"
                                            currentSort={sort}
                                            onSort={handleSort}
                                        >
                                            Status
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            column="hasOnboarded"
                                            currentSort={sort}
                                            onSort={handleSort}
                                        >
                                            Onboarded
                                        </SortableTableHeader>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {accounts.map((account: any, index: number) => (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium text-muted-foreground">
                                                {(page - 1) * itemsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/admin/accounts/${account.id}`}
                                                    className="hover:underline text-blue-600 hover:text-blue-800"
                                                >
                                                    {account.firstName} {account.lastName}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{account.email}</TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="outline" 
                                                    className={`flex items-center w-fit ${getRoleBadgeStyles(account.role)}`}
                                                >
                                                    {getRoleIcon(account.role)}
                                                    {account.role.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                        account.isLocked
                                                    )}`}
                                                >
                                                    {account.isLocked ? 'LOCKED' : 'ACTIVE'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {account.hasOnboarded ? (
                                                    <Badge variant="outline" className="text-green-600">Yes</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-600">No</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {accounts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">
                                                No accounts found matching your criteria.
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
