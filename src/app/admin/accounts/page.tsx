'use client';

import { useState } from 'react';
import { useDebounce } from 'use-debounce';
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
import { IconSearch, IconFilter, IconEye, IconEdit, IconTrash } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Mock Data
const MOCK_ACCOUNTS = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        joinedDate: '2023-01-15T10:00:00Z',
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@business.com',
        role: 'BUSINESS_OWNER',
        status: 'ACTIVE',
        joinedDate: '2023-02-20T14:30:00Z',
    },
    {
        id: '3',
        name: 'Alice Johnson',
        email: 'alice.j@creator.com',
        role: 'EVENT_CREATOR',
        status: 'PENDING',
        joinedDate: '2023-03-10T09:15:00Z',
    },
    {
        id: '4',
        name: 'Bob Williams',
        email: 'bob.w@example.com',
        role: 'USER',
        status: 'INACTIVE',
        joinedDate: '2023-04-05T16:45:00Z',
    },
    {
        id: '5',
        name: 'Charlie Brown',
        email: 'charlie.b@business.com',
        role: 'BUSINESS_OWNER',
        status: 'ACTIVE',
        joinedDate: '2023-05-12T11:20:00Z',
    },
    {
        id: '6',
        name: 'Diana Prince',
        email: 'diana.p@example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
        joinedDate: '2023-06-18T08:00:00Z',
    },
    {
        id: '7',
        name: 'Evan Wright',
        email: 'evan.w@creator.com',
        role: 'EVENT_CREATOR',
        status: 'BANNED',
        joinedDate: '2023-07-22T13:10:00Z',
    },
    {
        id: '8',
        name: 'Fiona Gallagher',
        email: 'fiona.g@example.com',
        role: 'USER',
        status: 'ACTIVE',
        joinedDate: '2023-08-30T15:50:00Z',
    },
];

export default function AccountsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    // Filter Logic
    const filteredAccounts = MOCK_ACCOUNTS.filter((account) => {
        const matchesSearch =
            account.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            account.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || account.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    const paginatedAccounts = filteredAccounts.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'default'; // Black/White
            case 'BUSINESS_OWNER':
                return 'secondary'; // Gray
            case 'EVENT_CREATOR':
                return 'outline'; // Outline
            default:
                return 'secondary';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'text-green-600 bg-green-100';
            case 'PENDING':
                return 'text-yellow-600 bg-yellow-100';
            case 'INACTIVE':
                return 'text-gray-600 bg-gray-100';
            case 'BANNED':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Accounts Management</h1>
                {/* Add User Button could go here */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>All Accounts ({filteredAccounts.length})</span>
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
                    <CardDescription>
                        Manage users, business owners, and administrators.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedAccounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>{account.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeColor(account.role) as any}>
                                            {account.role.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                account.status
                                            )}`}
                                        >
                                            {account.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(account.joinedDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" title="View Details">
                                                <IconEye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" title="Edit">
                                                <IconEdit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <IconTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {paginatedAccounts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No accounts found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
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
                                Page {page} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
