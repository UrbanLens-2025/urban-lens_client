'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Upload,
  CreditCard,
  Calendar,
  Search,
  ExternalLink,
  User,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import Link from 'next/link';
import type { WalletExternalTransaction } from '@/types';

const formatCurrency = (amount: string, currency: string = 'VND') => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

import { format } from 'date-fns';

const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
};

const getStatusBadge = (status: string) => {
  const statusUpper = status.toUpperCase();
  const variants: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      label: string;
      className?: string;
    }
  > = {
    COMPLETED: {
      variant: 'default',
      label: 'Completed',
      className:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    },
    PENDING: {
      variant: 'secondary',
      label: 'Pending',
      className:
        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    },
    READY_FOR_PAYMENT: {
      variant: 'secondary',
      label: 'Ready for Payment',
      className:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    },
    PROCESSING: {
      variant: 'secondary',
      label: 'Processing',
      className:
        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    },
    TRANSFERRED: {
      variant: 'default',
      label: 'Transferred',
      className:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    },
    TRANSFER_FAILED: {
      variant: 'destructive',
      label: 'Transfer Failed',
      className:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
    REJECTED: {
      variant: 'destructive',
      label: 'Rejected',
      className:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
    CANCELLED: {
      variant: 'outline',
      label: 'Cancelled',
      className:
        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
    },
  };

  const config = variants[statusUpper] || {
    variant: 'secondary' as const,
    label: status,
  };
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

const getDirectionColor = (direction: string) => {
  const dir = direction.toUpperCase();
  return dir === 'DEPOSIT'
    ? 'text-green-600 dark:text-green-400'
    : 'text-orange-600 dark:text-orange-400';
};

const getDirectionSign = (direction: string) => {
  const dir = direction.toUpperCase();
  return dir === 'DEPOSIT' ? '+' : '-';
};

interface ExternalTransactionsTabProps {
  stats: {
    totalDeposits: number;
    totalWithdrawals: number;
    pendingCount: number;
    completedCount: number;
  };
  filteredTransactions: WalletExternalTransaction[];
  isLoadingTransactions: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  directionFilter: string;
  setDirectionFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  currentPage: number;
  setCurrentPage: (value: number | ((prev: number) => number)) => void;
  totalPages: number;
  totalItems: number;
}

export function ExternalTransactionsTab({
  stats,
  filteredTransactions,
  isLoadingTransactions,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  directionFilter,
  setDirectionFilter,
  sortBy,
  setSortBy,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
}: ExternalTransactionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Deposits"
          value={formatCurrency(stats.totalDeposits.toString(), 'VND')}
          icon={Download}
          color="green"
          description="Sum of all completed deposit transactions"
        />
        <StatCard
          title="Total Withdrawals"
          value={formatCurrency(stats.totalWithdrawals.toString(), 'VND')}
          icon={Upload}
          color="orange"
          description="Sum of all completed withdrawal transactions"
        />
        <StatCard
          title="Pending"
          value={stats.pendingCount.toString()}
          icon={CreditCard}
          color="blue"
          description="Transactions waiting for processing"
        />
        <StatCard
          title="Completed"
          value={stats.completedCount.toString()}
          icon={Calendar}
          color="purple"
          description="Total number of completed transactions"
        />
      </div>

      {/* Transactions Table */}
      <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-primary/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                External transactions
              </CardTitle>
              <CardDescription>
                All deposit and withdrawal transactions across wallets
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-12 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-sm border-2 border-primary/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="READY_FOR_PAYMENT">
                    Ready for Payment
                  </SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  <SelectItem value="TRANSFER_FAILED">
                    Transfer Failed
                  </SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={directionFilter}
                onValueChange={setDirectionFilter}
              >
                <SelectTrigger className="h-8 w-32 text-sm border-2 border-primary/20">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-40 text-sm border-2 border-primary/20">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt:DESC">
                    Newest First
                  </SelectItem>
                  <SelectItem value="createdAt:ASC">
                    Oldest First
                  </SelectItem>
                  <SelectItem value="amount:DESC">
                    Amount: High to Low
                  </SelectItem>
                  <SelectItem value="amount:ASC">
                    Amount: Low to High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-2 border-primary/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Direction</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map(
                  (
                    transaction: WalletExternalTransaction,
                    index: number
                  ) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="font-mono text-xs max-w-[120px] truncate">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.createdBy ? (
                          <div className="flex items-center gap-2 min-w-0">
                            {transaction.createdBy.avatarUrl ? (
                              <img
                                src={transaction.createdBy.avatarUrl}
                                alt={transaction.createdBy.firstName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {transaction.createdBy.firstName}{' '}
                                {transaction.createdBy.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {transaction.createdBy.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Unknown
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs mt-0.5">
                          {transaction.createdBy?.role || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {transaction.direction.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${getDirectionColor(
                            transaction.direction
                          )}`}
                        >
                          {getDirectionSign(transaction.direction)}
                          {formatCurrency(
                            transaction.amount,
                            transaction.currency
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDateTime(transaction.createdAt)}</div>
                          {transaction.updatedAt !==
                            transaction.createdAt && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Updated:{' '}
                              {formatDateTime(transaction.updatedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/wallet/transactions/${transaction.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoadingTransactions && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/10">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalItems} total
                transactions)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoadingTransactions}
                  className="border-2 border-primary/20 hover:border-primary/40"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={
                    currentPage >= totalPages || isLoadingTransactions
                  }
                  className="border-2 border-primary/20 hover:border-primary/40"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

