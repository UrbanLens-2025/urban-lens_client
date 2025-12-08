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
import { Loader2 } from 'lucide-react';

export default function AccountsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize state from URL params or defaults
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'ALL');
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

    // Fetch accounts from API
    const { data, isLoading, error } = useAllAccounts({
        page,
        limit: itemsPerPage,
        search: debouncedSearchTerm.trim() || undefined,
        searchBy: debouncedSearchTerm.trim() ? ['email', 'firstName', 'lastName', 'phoneNumber'] : undefined,
        filterRole: roleFilter !== 'ALL' ? `$eq:${roleFilter}` : undefined,
        sortBy: ['createdAt:DESC'],
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
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                            <IconUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.onboarded} onboarded
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
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

                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
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

                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">By Role</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                            <IconShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
                                    <TableRow>
                                        <TableHead className="w-[50px]">#</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Onboarded</TableHead>
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
