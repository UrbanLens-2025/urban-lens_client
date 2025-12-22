'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Wallet,
  Lock,
  Unlock,
  RefreshCw,
  Calendar,
  TrendingUp,
  Search,
  Download,
  Upload,
  User,
  CreditCard,
  Filter,
  ExternalLink,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { useAdminWallets } from '@/hooks/admin/useAdminWallets';
import { useAdminExternalTransactions } from '@/hooks/admin/useAdminExternalTransactions';
import { useAdminInternalWalletTransactions } from '@/hooks/admin/useAdminInternalWalletTransactions';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { WalletExternalTransaction, WalletTransaction } from '@/types';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';
import { IconEye, IconTransfer } from '@tabler/icons-react';

const formatCurrency = (amount: string, currency: string = 'VND') => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

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

function WalletCard({
  title,
  wallet,
  isLoading,
  icon: Icon,
  color,
}: {
  title: string;
  wallet: any;
  isLoading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  if (isLoading) {
    return <LoadingCustom />;
  }

  if (!wallet) {
    return <ErrorCustom />;
  }

  return (
    <Card className='h-full border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
      <CardHeader className='pb-4 border-b border-primary/10'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Icon className={`h-5 w-5 ${color}`} />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge
            variant={wallet.isLocked ? 'destructive' : 'default'}
            className='flex items-center gap-1'
          >
            {wallet.isLocked ? (
              <>
                <Lock className='h-3 w-3' />
                Locked
              </>
            ) : (
              <>
                <Unlock className='h-3 w-3' />
                Active
              </>
            )}
          </Badge>
        </div>
        <CardDescription className='mt-2'>
          {wallet.walletType === 'ESCROW'
            ? 'Holds funds in escrow for location bookings'
            : 'System wallet for platform operations'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Balance */}
        <div>
          <div className='text-sm font-medium text-muted-foreground mb-1'>
            Current Balance
          </div>
          <div className='text-3xl font-bold'>
            {formatCurrency(wallet.balance, wallet.currency)}
          </div>
        </div>

        {/* Wallet Details */}
        <div className='space-y-3 pt-4 border-t border-primary/10'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>Total Transactions</span>
            <span className='font-semibold'>
              {wallet.totalTransactions.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className='space-y-2 pt-4 border-t border-primary/10'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Calendar className='h-3 w-3' />
            <span>
              Created:{' '}
              {format(new Date(wallet.createdAt), 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <RefreshCw className='h-3 w-3' />
            <span>
              Updated:{' '}
              {format(new Date(wallet.updatedAt), 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminWalletPage() {
  const [activeTab, setActiveTab] = useState('external-transactions');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt:DESC');
  const [systemInternalSearch, setSystemInternalSearch] = useState('');
  const [systemInternalStatusFilter, setSystemInternalStatusFilter] =
    useState<string>('all');
  const [systemInternalSortBy, setSystemInternalSortBy] =
    useState<string>('createdAt:DESC');
  const [escrowInternalSearch, setEscrowInternalSearch] = useState('');
  const [escrowInternalStatusFilter, setEscrowInternalStatusFilter] =
    useState<string>('all');
  const [escrowInternalSortBy, setEscrowInternalSortBy] =
    useState<string>('createdAt:DESC');
  const itemsPerPage = 10;

  const { escrowWallet, systemWallet, isLoading } = useAdminWallets();

  const { data: transactionsData, isLoading: isLoadingTransactions } =
    useAdminExternalTransactions({
      page: currentPage,
      limit: itemsPerPage,
      sortBy,
    });

  const transactions = transactionsData?.data || [];
  console.log('🚀 ~ AdminWalletPage ~ transactions:', transactions);
  const totalPages = transactionsData?.meta.totalPages || 1;
  const totalItems = transactionsData?.meta.totalItems || 0;

  // Admin internal transactions per wallet (system & escrow)
  const { data: systemInternalData, isLoading: isLoadingSystemInternal } =
    useAdminInternalWalletTransactions(
      systemWallet
        ? {
            walletId: systemWallet.id,
            page: 1,
            limit: 5,
            sortBy: 'createdAt:DESC',
          }
        : null
    );

  const systemInternalTransactions: WalletTransaction[] =
    systemInternalData?.data || [];
  console.log(
    '🚀 ~ AdminWalletPage ~ systemInternalTransactions:',
    systemInternalTransactions
  );

  const { data: escrowInternalData, isLoading: isLoadingEscrowInternal } =
    useAdminInternalWalletTransactions(
      escrowWallet
        ? {
            walletId: escrowWallet.id,
            page: 1,
            limit: 5,
            sortBy: 'createdAt:DESC',
          }
        : null
    );

  const escrowInternalTransactions: WalletTransaction[] =
    escrowInternalData?.data || [];
  console.log(
    '🚀 ~ AdminWalletPage ~ escrowInternalTransactions:',
    escrowInternalTransactions
  );

  // Filter transactions client-side
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: WalletExternalTransaction) => {
      if (
        statusFilter !== 'all' &&
        t.status.toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }
      if (
        directionFilter !== 'all' &&
        t.direction.toUpperCase() !== directionFilter.toUpperCase()
      ) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const providerOrderId =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t as any).providerResponse?.order?.order_id ?? '';
        const providerTransactionId =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t as any).providerResponse?.transaction?.transaction_id ?? '';

        const searchableText = [
          t.id,
          t.createdBy?.email,
          t.createdBy?.firstName,
          t.createdBy?.lastName,
          t.amount,
          t.withdrawBankName,
          t.withdrawBankAccountNumber,
          t.providerTransactionId,
          providerOrderId,
          providerTransactionId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, statusFilter, directionFilter, searchQuery]);

  // Calculate stats for external transactions tab
  const stats = useMemo(() => {
    return {
      totalDeposits: transactions
        .filter(
          (t: WalletExternalTransaction) =>
            t.direction.toUpperCase() === 'DEPOSIT'
        )
        .reduce(
          (sum: number, t: WalletExternalTransaction) =>
            sum + parseFloat(t.amount),
          0
        ),
      totalWithdrawals: transactions
        .filter(
          (t: WalletExternalTransaction) =>
            t.direction.toUpperCase() === 'WITHDRAW'
        )
        .reduce(
          (sum: number, t: WalletExternalTransaction) =>
            sum + parseFloat(t.amount),
          0
        ),
      pendingCount: transactions.filter(
        (t: WalletExternalTransaction) => t.status.toUpperCase() === 'PENDING'
      ).length,
      completedCount: transactions.filter(
        (t: WalletExternalTransaction) => t.status.toUpperCase() === 'COMPLETED'
      ).length,
    };
  }, [transactions]);

  // System internal transactions: filter + sort + search
  const filteredSystemInternal = useMemo(() => {
    let data = [...systemInternalTransactions];

    if (systemInternalStatusFilter !== 'all') {
      data = data.filter(
        (t) =>
          t.status.toUpperCase() === systemInternalStatusFilter.toUpperCase()
      );
    }

    if (systemInternalSearch) {
      const query = systemInternalSearch.toLowerCase();
      data = data.filter((t) =>
        [t.id, t.type, t.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    if (systemInternalSortBy === 'createdAt:DESC') {
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (systemInternalSortBy === 'createdAt:ASC') {
      data.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (systemInternalSortBy === 'amount:DESC') {
      data.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else if (systemInternalSortBy === 'amount:ASC') {
      data.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    }

    return data;
  }, [
    systemInternalTransactions,
    systemInternalStatusFilter,
    systemInternalSearch,
    systemInternalSortBy,
  ]);

  // Escrow internal transactions: filter + sort + search
  const filteredEscrowInternal = useMemo(() => {
    let data = [...escrowInternalTransactions];

    if (escrowInternalStatusFilter !== 'all') {
      data = data.filter(
        (t) =>
          t.status.toUpperCase() === escrowInternalStatusFilter.toUpperCase()
      );
    }

    if (escrowInternalSearch) {
      const query = escrowInternalSearch.toLowerCase();
      data = data.filter((t) =>
        [t.id, t.type, t.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    if (escrowInternalSortBy === 'createdAt:DESC') {
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (escrowInternalSortBy === 'createdAt:ASC') {
      data.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (escrowInternalSortBy === 'amount:DESC') {
      data.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else if (escrowInternalSortBy === 'amount:ASC') {
      data.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    }

    return data;
  }, [
    escrowInternalTransactions,
    escrowInternalStatusFilter,
    escrowInternalSearch,
    escrowInternalSortBy,
  ]);

  return (
    <PageContainer>
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='grid w-full max-w-xl grid-cols-3 h-12 bg-primary/10'>
          <TabsTrigger
            value='external-transactions'
            className='flex items-center gap-2'
          >
            <Building2 className='h-4 w-4' />
            <span className='text-sm font-medium'>External Transactions</span>
          </TabsTrigger>
          <TabsTrigger
            value='system-wallet'
            className='flex items-center gap-2'
          >
            <Wallet className='h-4 w-4' />
            <span className='text-sm font-medium'>System wallet</span>
          </TabsTrigger>
          <TabsTrigger
            value='escrow-wallet'
            className='flex items-center gap-2'
          >
            <Lock className='h-4 w-4' />
            <span className='text-sm font-medium'>Escrow wallet</span>
          </TabsTrigger>
        </TabsList>

        {/* System Wallet Tab */}
        <TabsContent value='system-wallet' className='space-y-6'>
          {isLoading ? (
            <LoadingCustom />
          ) : !systemWallet ? (
            <ErrorCustom />
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                title='System Wallet Balance'
                value={formatCurrency(
                  systemWallet.balance,
                  systemWallet.currency
                )}
                icon={Wallet}
                color='blue'
                description='Available funds in the system wallet'
              />
              <StatCard
                title='Total transactions'
                value={
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (systemInternalData as any)?.meta?.totalItems ??
                  systemWallet.totalTransactions
                }
                icon={TrendingUp}
                color='amber'
                description='Internal movements for this wallet'
              />
              <StatCard
                title='Completed'
                value={999}
                icon={TrendingUp}
                color='emerald'
                description='Completed transactions for this wallet'
              />
              <StatCard
                title='Status'
                value={systemWallet.isLocked ? 'Locked' : 'Active'}
                icon={systemWallet.isLocked ? Lock : Unlock}
                color={systemWallet.isLocked ? 'red' : 'green'}
                description={
                  systemWallet.walletType === 'ESCROW'
                    ? 'Escrow wallet for booking flows'
                    : 'System wallet for platform operations'
                }
              />
            </div>
          )}

          <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
            <CardHeader className='pb-4 border-b border-primary/10'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <CreditCard className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    Internal transactions
                  </CardTitle>
                  <CardDescription>
                    Recent internal movements for the system wallet
                  </CardDescription>
                </div>
                <div className='flex flex-wrap gap-2 items-center'>
                  <div className='relative w-full sm:w-48'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
                    <Input
                      placeholder='Search...'
                      value={systemInternalSearch}
                      onChange={(e) => setSystemInternalSearch(e.target.value)}
                      className='pl-8 h-12 text-sm'
                    />
                  </div>
                  <Select
                    value={systemInternalStatusFilter}
                    onValueChange={setSystemInternalStatusFilter}
                  >
                    <SelectTrigger className='h-8 w-32 text-sm border-2 border-primary/20'>
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All status</SelectItem>
                      <SelectItem value='COMPLETED'>Completed</SelectItem>
                      <SelectItem value='PENDING'>Pending</SelectItem>
                      <SelectItem value='FAILED'>Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={systemInternalSortBy}
                    onValueChange={setSystemInternalSortBy}
                  >
                    <SelectTrigger className='h-8 w-40 text-sm border-2 border-primary/20'>
                      <SelectValue placeholder='Sort by' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='createdAt:DESC'>
                        Newest first
                      </SelectItem>
                      <SelectItem value='createdAt:ASC'>
                        Oldest first
                      </SelectItem>
                      <SelectItem value='amount:DESC'>
                        Amount: high to low
                      </SelectItem>
                      <SelectItem value='amount:ASC'>
                        Amount: low to high
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSystemInternal ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : filteredSystemInternal.length === 0 ? (
                <div className='text-sm text-muted-foreground py-4'>
                  No internal transactions match your filters.
                </div>
              ) : (
                <div className='rounded-md border-2 border-primary/10 overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-muted/50'>
                        <TableHead className='font-semibold'>#</TableHead>
                        <TableHead className='font-semibold'>Type</TableHead>
                        <TableHead className='font-semibold'>Amount</TableHead>
                        <TableHead className='font-semibold'>Status</TableHead>
                        <TableHead className='font-semibold'>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSystemInternal.map((t: any, index: number) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className='font-mono text-xs max-w-[140px] truncate'>
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/wallet/internal-transactions/${t.id}`}
                              className='hover:underline'
                            >
                              {t.type}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              t.amount,
                              systemWallet?.currency || 'VND'
                            )}
                          </TableCell>
                          <TableCell>{t.status}</TableCell>
                          <TableCell>{formatDateTime(t.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escrow Wallet Tab */}
        <TabsContent value='escrow-wallet' className='space-y-6'>
          {isLoading ? (
            <LoadingCustom />
          ) : !escrowWallet ? (
            <ErrorCustom />
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                title='Escrow wallet balance'
                value={formatCurrency(
                  escrowWallet.balance,
                  escrowWallet.currency
                )}
                icon={Wallet}
                color='blue'
                description='Funds held in escrow for bookings'
              />

              <StatCard
                title='Payout for locations'
                value={formatCurrency(
                  escrowWallet.balance,
                  escrowWallet.currency
                )}
                icon={TrendingUp}
                color='emerald'
                description='Completed transactions for this wallet'
              />
              <StatCard
                title='Payout for events'
                value={formatCurrency(
                  escrowWallet.balance,
                  escrowWallet.currency
                )}
                icon={TrendingUp}
                color='emerald'
                description='Completed transactions for this wallet'
              />
              <StatCard
                title='Total transactions'
                value={
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (escrowInternalData as any)?.meta?.totalItems ??
                  escrowWallet.totalTransactions
                }
                icon={TrendingUp}
                color='amber'
                description='Internal movements for this wallet'
              />
            </div>
          )}

          <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
            <CardHeader className='pb-4 border-b border-primary/10'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <CreditCard className='h-4 w-4 text-green-600 dark:text-green-400' />
                    Internal transactions
                  </CardTitle>
                  <CardDescription>
                    Recent internal movements for the escrow wallet
                  </CardDescription>
                </div>
                <div className='flex flex-wrap gap-2 items-center'>
                  <div className='relative w-full sm:w-48'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
                    <Input
                      placeholder='Search...'
                      value={escrowInternalSearch}
                      onChange={(e) => setEscrowInternalSearch(e.target.value)}
                      className='pl-8 h-12 text-sm'
                    />
                  </div>
                  <Select
                    value={escrowInternalStatusFilter}
                    onValueChange={setEscrowInternalStatusFilter}
                  >
                    <SelectTrigger className='h-8 w-32 text-sm border-2 border-primary/20'>
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All status</SelectItem>
                      <SelectItem value='COMPLETED'>Completed</SelectItem>
                      <SelectItem value='PENDING'>Pending</SelectItem>
                      <SelectItem value='FAILED'>Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={escrowInternalSortBy}
                    onValueChange={setEscrowInternalSortBy}
                  >
                    <SelectTrigger className='h-8 w-40 text-sm border-2 border-primary/20'>
                      <SelectValue placeholder='Sort by' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='createdAt:DESC'>
                        Newest first
                      </SelectItem>
                      <SelectItem value='createdAt:ASC'>
                        Oldest first
                      </SelectItem>
                      <SelectItem value='amount:DESC'>
                        Amount: high to low
                      </SelectItem>
                      <SelectItem value='amount:ASC'>
                        Amount: low to high
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEscrowInternal ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : filteredEscrowInternal.length === 0 ? (
                <div className='text-sm text-muted-foreground py-4'>
                  No internal transactions match your filters.
                </div>
              ) : (
                <div className='rounded-md border-2 border-primary/10 overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-muted/50'>
                        <TableHead className='font-semibold'>#</TableHead>
                        <TableHead className='font-semibold'>Type</TableHead>
                        <TableHead className='font-semibold'>Amount</TableHead>
                        <TableHead className='font-semibold'>
                          Reference
                        </TableHead>
                        <TableHead className='font-semibold'>Status</TableHead>
                        <TableHead className='font-semibold'>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEscrowInternal.map((t: any, index: number) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className='font-mono text-xs max-w-[140px] truncate'>
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/wallet/internal-transactions/${t.id}`}
                              className='hover:underline'
                            >
                              {t.type}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              t.amount,
                              escrowWallet?.currency || 'VND'
                            )}
                          </TableCell>
                          <TableCell>
                            {t.note ? `${t.note.slice(0, 20)}...` : '-'}
                          </TableCell>
                          <TableCell>{t.status}</TableCell>
                          <TableCell>{formatDateTime(t.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* External Transactions Tab */}
        <TabsContent value='external-transactions' className='space-y-6'>
          {/* Stats Cards */}
          <div className='grid gap-4 md:grid-cols-4'>
            <StatCard
              title='Total Deposits'
              value={formatCurrency(stats.totalDeposits.toString(), 'VND')}
              icon={Download}
              color='green'
            />
            <StatCard
              title='Total Withdrawals'
              value={formatCurrency(stats.totalWithdrawals.toString(), 'VND')}
              icon={Upload}
              color='orange'
            />

            <StatCard
              title='Completed'
              value={stats.completedCount.toString()}
              icon={Calendar}
              color='purple'
            />
            <StatCard
              title='Transferred'
              value={999}
              icon={IconTransfer}
              color='green'
            />
          </div>

          {/* Transactions Table */}
          <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
            <CardHeader className='border-b border-primary/10'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <CreditCard className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    <span className='text-base font-semibold'>
                      External transactions
                    </span>
                  </CardTitle>
                  <CardDescription>
                    All deposit and withdrawal transactions across wallets
                  </CardDescription>
                </div>
                <div className='flex flex-wrap gap-2 items-center'>
                  <div className='relative w-full sm:w-52'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
                    <Input
                      placeholder='Search transactions...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-8 h-12 text-sm'
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='h-8 w-36 text-sm border-2 border-primary/20'>
                      <SelectValue placeholder='Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='COMPLETED'>Completed</SelectItem>
                      <SelectItem value='PENDING'>Pending</SelectItem>
                      <SelectItem value='READY_FOR_PAYMENT'>
                        Ready for Payment
                      </SelectItem>
                      <SelectItem value='PROCESSING'>Processing</SelectItem>
                      <SelectItem value='TRANSFERRED'>Transferred</SelectItem>
                      <SelectItem value='TRANSFER_FAILED'>
                        Transfer Failed
                      </SelectItem>
                      <SelectItem value='REJECTED'>Rejected</SelectItem>
                      <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={directionFilter}
                    onValueChange={setDirectionFilter}
                  >
                    <SelectTrigger className='h-8 w-32 text-sm border-2 border-primary/20'>
                      <SelectValue placeholder='Direction' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Directions</SelectItem>
                      <SelectItem value='DEPOSIT'>Deposit</SelectItem>
                      <SelectItem value='WITHDRAW'>Withdraw</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className='h-8 w-40 text-sm border-2 border-primary/20'>
                      <SelectValue placeholder='Sort By' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='createdAt:DESC'>
                        Newest First
                      </SelectItem>
                      <SelectItem value='createdAt:ASC'>
                        Oldest First
                      </SelectItem>
                      <SelectItem value='amount:DESC'>
                        Amount: High to Low
                      </SelectItem>
                      <SelectItem value='amount:ASC'>
                        Amount: Low to High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border-2 border-primary/10 overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/50'>
                      <TableHead className='font-semibold'>#</TableHead>
                      <TableHead className='font-semibold'>User</TableHead>
                      <TableHead className='font-semibold'>Role</TableHead>
                      <TableHead className='font-semibold'>Direction</TableHead>
                      <TableHead className='font-semibold'>Amount</TableHead>
                      <TableHead className='font-semibold'>Status</TableHead>
                      <TableHead className='font-semibold'>Date</TableHead>
                      <TableHead className='text-right font-semibold'>
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
                          className='hover:bg-muted/30 transition-colors'
                        >
                          <TableCell>
                            <div className='font-mono text-xs max-w-[120px] truncate'>
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.createdBy ? (
                              <div className='flex items-center gap-2 min-w-0'>
                                {transaction.createdBy.avatarUrl ? (
                                  <img
                                    src={transaction.createdBy.avatarUrl}
                                    alt={transaction.createdBy.firstName}
                                    className='h-8 w-8 rounded-full object-cover'
                                  />
                                ) : (
                                  <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center'>
                                    <User className='h-4 w-4' />
                                  </div>
                                )}
                                <div className='min-w-0 flex-1'>
                                  <div className='text-sm font-medium truncate'>
                                    {transaction.createdBy.firstName}{' '}
                                    {transaction.createdBy.lastName}
                                  </div>
                                  <div className='text-xs text-muted-foreground truncate'>
                                    {transaction.createdBy.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className='text-muted-foreground text-sm'>
                                Unknown
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className='text-xs mt-0.5'>
                              {transaction.createdBy?.role === 'EVENT_CREATOR'
                                ? 'Event Creator'
                                : transaction.createdBy?.role ===
                                  'BUSINESS_OWNER'
                                ? 'Business Owner'
                                : transaction.createdBy?.role === 'USER'
                                ? 'User'
                                : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Badge variant='outline'>
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
                            <div className='text-sm'>
                              <div>{formatDateTime(transaction.createdAt)}</div>
                              {transaction.updatedAt !==
                                transaction.createdAt && (
                                <div className='text-xs text-muted-foreground mt-0.5'>
                                  Updated:{' '}
                                  {formatDateTime(transaction.updatedAt)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='text-right'>
                            <Link
                              href={`/admin/wallet/transactions/${transaction.id}`}
                            >
                              <Button
                                variant='ghost'
                                size='sm'
                                className='hover:bg-primary/10'
                              >
                                <IconEye className='h-4 w-4' />
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
                <div className='flex items-center justify-between mt-6 pt-4 border-t border-primary/10'>
                  <div className='text-sm text-muted-foreground'>
                    Page {currentPage} of {totalPages} ({totalItems} total
                    transactions)
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoadingTransactions}
                      className='border-2 border-primary/20 hover:border-primary/40'
                    >
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={
                        currentPage >= totalPages || isLoadingTransactions
                      }
                      className='border-2 border-primary/20 hover:border-primary/40'
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
