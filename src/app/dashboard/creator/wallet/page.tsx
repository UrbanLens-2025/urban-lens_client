'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Wallet,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  ArrowLeftRight,
  Landmark,
  Loader2,
  Eye,
  X,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  Activity,
  BarChart3,
  FileDown,
  RefreshCw,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
import { useWallet } from '@/hooks/user/useWallet';
import { useWalletExternalTransactions } from '@/hooks/wallet/useWalletExternalTransactions';
import type { WalletExternalTransaction, WalletTransaction } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useWalletExternalTransactionById } from '@/hooks/wallet/useWalletExternalTransactionById';
import { useWalletTransactions } from '@/hooks/wallet/useWalletTransactions';
import { useCancelWithdrawTransaction } from '@/hooks/wallet/useCancelWithdrawTransaction';
import {
  format,
  subDays,
  subMonths,
  subYears,
  isSameMonth,
  isSameYear,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { useRevenueSummary } from '@/hooks/dashboard/useDashboardCreator';

// Helper mappers
const getInternalTransactionIcon = (mappedType: string) => {
  if (mappedType === 'transfer_in')
    return <ArrowDownLeft className='h-4 w-4 text-green-600' />;
  if (mappedType === 'transfer_out')
    return <ArrowUpRight className='h-4 w-4 text-orange-600' />;
  return <ArrowLeftRight className='h-4 w-4 text-blue-600' />;
};

const getExternalTransactionIcon = (type: string) => {
  if (type === 'deposit') {
    return <Building2 className='h-4 w-4 text-green-600' />;
  }
  return <Landmark className='h-4 w-4 text-orange-600' />;
};

const getTransactionSign = (type: string) => {
  return type === 'withdrawal' || type === 'transfer_out' ? '-' : '+';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'cancelled':
      return 'secondary';
    case 'ready':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className='h-3 w-3' />;
    case 'pending':
      return <Clock className='h-3 w-3' />;
    case 'failed':
      return <XCircle className='h-3 w-3' />;
    case 'cancelled':
      return <XCircle className='h-3 w-3' />;
    case 'ready':
      return <AlertCircle className='h-3 w-3' />;
    default:
      return null;
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800';
    case 'ready':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    default:
      return '';
  }
};

const getStatusLabel = (status: string) => {
  if (status === 'ready') return 'Ready for Payment';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'transfer_in':
      return 'Received';
    case 'transfer_out':
      return 'Sent';
    case 'transfer':
      return 'Receive';
    case 'deposit':
      return 'Deposit';
    case 'withdrawal':
      return 'Withdrawal';
    default:
      return type;
  }
};

// Map backend internal type to UI type
function mapInternalType(
  type: string
): 'transfer_in' | 'transfer_out' | 'transfer' {
  const t = (type || '').toUpperCase();
  if (t.includes('FROM_ESCROW') || t === 'FROM_ESCROW') return 'transfer_in';
  if (t.includes('TO_ESCROW') || t === 'TO_ESCROW') return 'transfer_out';
  return 'transfer';
}

type PeriodType = 'day' | 'month' | 'year';

export default function BusinessWalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: walletData, isLoading, error } = useWallet();
  const [earningsPeriod, setEarningsPeriod] = useState<PeriodType>('month');
  const [currentInternalPage, setCurrentInternalPage] = useState(1);
  const [currentExternalPage, setCurrentExternalPage] = useState(1);
  const itemsPerPage = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<string | null>(
    null
  );
  const cancelWithdraw = useCancelWithdrawTransaction();

  // Search and filter states
  const [internalSearch, setInternalSearch] = useState('');
  const [externalSearch, setExternalSearch] = useState('');
  const [internalTypeFilter, setInternalTypeFilter] = useState<string>('all');
  const [internalStatusFilter, setInternalStatusFilter] =
    useState<string>('all');
  const [externalTypeFilter, setExternalTypeFilter] = useState<string>('all');
  const [externalStatusFilter, setExternalStatusFilter] =
    useState<string>('all');

  // Get active tab from URL or default to "internal"
  const activeTab = searchParams.get('tab') || 'internal';
  const validTab =
    activeTab === 'internal' || activeTab === 'external'
      ? activeTab
      : 'internal';

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // External transactions
  const {
    data: externalTransactionsData,
    isLoading: isLoadingExternalTransactions,
  } = useWalletExternalTransactions({
    page: currentExternalPage,
    limit: itemsPerPage,
    sortBy: 'createdAt:DESC',
  });

  // Internal transactions
  const {
    data: internalTransactionsData,
    isLoading: isLoadingInternalTransactions,
  } = useWalletTransactions({
    page: currentInternalPage,
    limit: itemsPerPage,
    sortBy: 'createdAt:DESC',
  });

  const { data: transactionDetail, isLoading: isLoadingDetail } =
    useWalletExternalTransactionById(selectedTransactionId);

  // Use real wallet balance from API
  const totalBalance = walletData ? parseFloat(walletData.balance) : 0;
  const lockedBalance = walletData
    ? parseFloat(walletData.lockedBalance || '0')
    : 0;
  const availableBalance = totalBalance;
  const currency = walletData?.currency || 'VND';

  // External
  const externalTransactions = externalTransactionsData?.data || [];
  const totalExternalPages = externalTransactionsData?.meta.totalPages || 1;
  const totalExternalItems = externalTransactionsData?.meta.totalItems || 0;

  // Internal
  const internalTransactions = internalTransactionsData?.data || [];
  const totalInternalPages = internalTransactionsData?.meta.totalPages || 1;
  const totalInternalItems = internalTransactionsData?.meta.totalItems || 0;

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
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

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      COMPLETED: 'completed',
      PENDING: 'pending',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      READY_FOR_PAYMENT: 'ready',
    };
    return statusMap[status.toUpperCase()] || status.toLowerCase();
  };

  const getBankName = (bankCode: string): string => {
    const bankMap: Record<string, string> = {
      VNP: 'Vietnam Payment',
      VNB: 'Vietcombank',
      TCB: 'Techcombank',
      BID: 'BIDV',
      ACB: 'ACB',
      VCB: 'Vietcombank',
      CTG: 'Vietinbank',
      NCB: 'NCB Bank',
      VNPAY: 'VNPay',
    };
    return bankMap[bankCode.toUpperCase()] || bankCode || 'Unknown Bank';
  };

  // External mapping
  const mapExternalTransaction = (transaction: WalletExternalTransaction) => {
    const isDeposit = transaction.direction.toUpperCase() === 'DEPOSIT';
    const bankCode =
      transaction.providerResponse?.vnp_BankCode ||
      transaction.provider ||
      'N/A';
    const bankName = getBankName(bankCode);
    const bankTranNo = transaction.providerResponse?.vnp_BankTranNo;
    const accountNumber = bankTranNo
      ? `****${String(bankTranNo).slice(-4)}`
      : 'N/A';
    return {
      id: transaction.id,
      type: isDeposit ? 'deposit' : 'withdrawal',
      amount: parseFloat(transaction.amount),
      description: isDeposit
        ? 'Bank transfer deposit'
        : 'Withdrawal to bank account',
      bankName,
      accountNumber,
      status: mapStatus(transaction.status),
      date: transaction.createdAt,
      reference: transaction.providerTransactionId || transaction.id,
      transactionFee: 0,
    };
  };

  const revenueData = useRevenueSummary();

  const stats = useMemo(() => {
    return {
      totalDeposits: revenueData?.data?.totalDeposits || 0,
      totalEarnings: revenueData?.data?.totalEarnings || 0,
      totalWithdrawals: revenueData?.data?.totalWithdrawals || 0,
      totalTransactions: revenueData?.data?.totalTransactions || 0,
      available: revenueData?.data?.available || 0,
      pending: revenueData?.data?.pending || 0,
    };
  }, [revenueData]);

  // Mock earnings breakdown based on selected period
  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    const data: Array<{ period: string; earnings: number }> = [];

    if (earningsPeriod === 'day') {
      // Last 30 days
      const baseDayEarnings = [
        850000, 920000, 1100000, 780000, 1300000, 1450000, 980000, 1200000,
        1350000, 1150000, 1050000, 1400000, 1250000, 950000, 1600000, 1100000,
        1320000, 1480000, 1020000, 1380000, 1150000, 1260000, 1420000, 980000,
        1550000, 1180000, 1340000, 1470000, 1080000, 1520000,
      ];
      for (let i = 29; i >= 0; i--) {
        const dayDate = subDays(now, i);
        const dayOfWeek = dayDate.getDay();
        const baseIndex = 29 - i;

        // Lower earnings on weekends
        let earnings = baseDayEarnings[baseIndex % baseDayEarnings.length];
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          earnings = Math.floor(earnings * 0.7);
        }

        // Add variation
        earnings = Math.floor(earnings * (0.85 + Math.random() * 0.3));

        data.push({
          period: format(dayDate, 'MMM dd'),
          earnings,
        });
      }
    } else if (earningsPeriod === 'month') {
      // Last 12 months
      const baseMonthEarnings = [
        8500000, 9200000, 11000000, 7800000, 13000000, 14500000, 9800000,
        12000000, 13500000, 11500000, 10500000, 14000000,
      ];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const baseIndex = 11 - i;
        let earnings = baseMonthEarnings[baseIndex % baseMonthEarnings.length];

        // Add upward trend
        const growthFactor = 1 + (11 - i) * 0.03;
        earnings = Math.floor(earnings * growthFactor);

        // Add variation
        earnings = Math.floor(earnings * (0.9 + Math.random() * 0.2));

        data.push({
          period: format(monthDate, 'MMM yyyy'),
          earnings,
        });
      }
    } else {
      // Last 5 years
      const baseYearEarnings = [
        125000000, 142000000, 158000000, 175000000, 198000000,
      ];
      for (let i = 4; i >= 0; i--) {
        const yearDate = subYears(now, i);
        const baseIndex = 4 - i;
        let earnings = baseYearEarnings[baseIndex];

        // Add variation
        earnings = Math.floor(earnings * (0.95 + Math.random() * 0.1));

        data.push({
          period: format(yearDate, 'yyyy'),
          earnings,
        });
      }
    }
    return data;
  }, [earningsPeriod]);

  const earningsChartConfig: ChartConfig = {
    earnings: {
      label: 'Earnings',
      color: 'lab(58.8635% 31.6645 115.942)',
    },
  };

  // Mock transaction volume data (deposits vs withdrawals)
  const transactionVolume = useMemo(() => {
    const now = new Date();
    const data: Array<{
      period: string;
      deposits: number;
      withdrawals: number;
    }> = [];

    if (earningsPeriod === 'day') {
      for (let i = 29; i >= 0; i--) {
        const dayDate = subDays(now, i);
        data.push({
          period: format(dayDate, 'MMM dd'),
          deposits: Math.floor(Math.random() * 5000000) + 2000000,
          withdrawals: Math.floor(Math.random() * 3000000) + 1000000,
        });
      }
    } else if (earningsPeriod === 'month') {
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        data.push({
          period: format(monthDate, 'MMM yyyy'),
          deposits: Math.floor(Math.random() * 50000000) + 20000000,
          withdrawals: Math.floor(Math.random() * 30000000) + 10000000,
        });
      }
    } else {
      for (let i = 4; i >= 0; i--) {
        const yearDate = subYears(now, i);
        data.push({
          period: format(yearDate, 'yyyy'),
          deposits: Math.floor(Math.random() * 500000000) + 200000000,
          withdrawals: Math.floor(Math.random() * 300000000) + 100000000,
        });
      }
    }
    return data;
  }, [earningsPeriod]);

  const transactionVolumeChartConfig: ChartConfig = {
    deposits: {
      label: 'Deposits',
      color: 'hsl(142.1 76.2% 36.3%)',
    },
    withdrawals: {
      label: 'Withdrawals',
      color: 'hsl(0 84.2% 60.2%)',
    },
  };

  // Filter transactions
  const filteredInternalTransactions = useMemo(() => {
    return internalTransactions.filter((t: WalletTransaction) => {
      const mappedType = mapInternalType(t.type);
      const statusText = mapStatus(t.status);

      // Search filter
      if (internalSearch) {
        const searchLower = internalSearch.toLowerCase();
        const matchesSearch =
          t.id.toLowerCase().includes(searchLower) ||
          t.amount.includes(searchLower) ||
          formatDateTime(t.createdAt).toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (internalTypeFilter !== 'all') {
        if (internalTypeFilter !== mappedType) return false;
      }

      // Status filter
      if (internalStatusFilter !== 'all') {
        if (internalStatusFilter !== statusText) return false;
      }

      return true;
    });
  }, [
    internalTransactions,
    internalSearch,
    internalTypeFilter,
    internalStatusFilter,
  ]);

  const filteredExternalTransactions = useMemo(() => {
    return externalTransactions.filter((transaction) => {
      const mappedTransaction = mapExternalTransaction(transaction);

      // Search filter
      if (externalSearch) {
        const searchLower = externalSearch.toLowerCase();
        const matchesSearch =
          transaction.id.toLowerCase().includes(searchLower) ||
          mappedTransaction.amount.toString().includes(searchLower) ||
          formatDateTime(mappedTransaction.date)
            .toLowerCase()
            .includes(searchLower) ||
          mappedTransaction.bankName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (externalTypeFilter !== 'all') {
        if (externalTypeFilter !== mappedTransaction.type) return false;
      }

      // Status filter
      if (externalStatusFilter !== 'all') {
        if (externalStatusFilter !== mappedTransaction.status) return false;
      }

      return true;
    });
  }, [
    externalTransactions,
    externalSearch,
    externalTypeFilter,
    externalStatusFilter,
  ]);

  const handleCancelClick = (transactionId: string) => {
    setTransactionToCancel(transactionId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (transactionToCancel) {
      cancelWithdraw.mutate(transactionToCancel);
      setCancelDialogOpen(false);
      setTransactionToCancel(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title='Wallet'
          description='Manage your balance, transactions, and earnings'
          icon={Wallet}
        />
        <div className='flex items-center justify-center py-20'>
          <div className='flex flex-col items-center gap-4'>
            <Loader2 className='h-12 w-12 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
              Loading wallet information...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title='Wallet'
          description='Manage your balance, transactions, and earnings'
          icon={Wallet}
        />
        <Card className='border-2 border-destructive/20 shadow-xl bg-card/80 backdrop-blur-sm'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4'>
                <AlertCircle className='h-8 w-8 text-destructive' />
              </div>
              <p className='text-lg font-semibold text-foreground mb-2'>
                Failed to load wallet information
              </p>
              <p className='text-sm text-muted-foreground mb-4'>
                Please try refreshing the page or contact support if the problem
                persists
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant='outline'
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title='Wallet'
        description='Manage your balance, transactions, and earnings'
        icon={Wallet}
      />
      {/* Enhanced Balance Card */}
      <Card className='border-2 border-primary/10 shadow-xl bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm overflow-hidden relative'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none' />
        <CardHeader className='relative z-10 pb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-base font-semibold text-muted-foreground mb-1'>
                Available Balance
              </CardTitle>
              <div className='text-5xl font-bold text-foreground tracking-tight mt-2'>
                {formatCurrency(availableBalance)}
              </div>
            </div>
            <div className='h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg'>
              <Wallet className='h-8 w-8 text-primary' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='relative z-10 space-y-6'>
          {lockedBalance > 0 && (
            <div className='space-y-3 pt-4 border-t border-border/50'>
              <div className='flex items-center justify-between py-2 px-3 rounded-lg bg-amber-500/5 border border-amber-500/20'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full bg-amber-500' />
                  <span className='text-sm font-medium text-muted-foreground'>
                    Locked Balance
                  </span>
                </div>
                <span className='font-bold text-lg text-amber-600 dark:text-amber-500'>
                  {formatCurrency(lockedBalance)}
                </span>
              </div>
            </div>
          )}
          {walletData?.isLocked && (
            <Badge
              variant='destructive'
              className='w-full justify-center py-2 bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700'
            >
              <AlertCircle className='h-4 w-4 mr-2' />
              Wallet Locked
            </Badge>
          )}
          <div className='flex gap-3 pt-2'>
            <Link href='/dashboard/business/wallet/deposit' className='flex-1'>
              <Button
                className='w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all'
                disabled={walletData?.isLocked}
              >
                <Download className='mr-2 h-4 w-4' />
                Deposit
              </Button>
            </Link>
            <Link href='/dashboard/business/wallet/withdraw' className='flex-1'>
              <Button
                className='w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all'
                disabled={walletData?.isLocked}
              >
                <Upload className='mr-2 h-4 w-4' />
                Withdraw
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Statistics Cards */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Deposits'
          value={formatCurrency(stats.totalDeposits)}
          icon={Download}
          color='blue'
          description='All time deposits'
        />

        <StatCard
          title='Total Earnings'
          value={formatCurrency(stats.totalEarnings)}
          icon={TrendingUp}
          color='emerald'
          description='All time earnings'
        />

        <StatCard
          title='Total Withdrawals'
          value={formatCurrency(stats.totalWithdrawals)}
          icon={Upload}
          color='amber'
          description='To bank account'
        />

        <StatCard
          title='Total Pending Revenue'
          value={stats.totalTransactions}
          icon={Activity}
          color='purple'
          description='All time transactions'
        />
      </div>

      {/* Transactions Table with Tabs */}
      <Card className='border-border/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View and manage your internal and external transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={validTab}
            onValueChange={handleTabChange}
            className='w-full'
          >
            <div className='flex items-center gap-4 mb-6 border-b'>
              <TabsList className='inline-flex h-auto p-1 bg-transparent border-0'>
                <TabsTrigger
                  value='internal'
                  className='px-6 py-3 text-base font-medium rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-sm transition-all'
                >
                  <ArrowLeftRight className='h-5 w-5 mr-2' />
                  Internal Transactions
                  <Badge variant='secondary' className='ml-2'>
                    {filteredInternalTransactions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value='external'
                  className='px-6 py-3 text-base font-medium rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-sm transition-all'
                >
                  <Building2 className='h-5 w-5 mr-2' />
                  External Transactions
                  <Badge variant='secondary' className='ml-2'>
                    {filteredExternalTransactions.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Internal Transactions Tab */}
            <TabsContent value='internal' className='space-y-4'>
              <div className='rounded-md border border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10 p-3 mb-4'>
                <p className='text-sm text-foreground font-medium flex items-center gap-2'>
                  <ArrowLeftRight className='h-4 w-4 text-primary' />
                  Internal transactions represent money movements within the
                  platform (e.g., to/from escrow)
                </p>
              </div>

              {/* Search and Filter Section */}
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-4'>
                  {/* Search Input */}
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search by ID, date, or amount...'
                      className='pl-9'
                      value={internalSearch}
                      onChange={(e) => setInternalSearch(e.target.value)}
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className='flex gap-2'>
                    {/* Type Filter */}
                    <Select
                      value={internalTypeFilter}
                      onValueChange={setInternalTypeFilter}
                    >
                      <SelectTrigger className='w-[150px]'>
                        <Filter className='h-4 w-4 mr-2' />
                        <SelectValue placeholder='Type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Types</SelectItem>
                        <SelectItem value='transfer_in'>Received</SelectItem>
                        <SelectItem value='transfer_out'>Sent</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select
                      value={internalStatusFilter}
                      onValueChange={setInternalStatusFilter}
                    >
                      <SelectTrigger className='w-[150px]'>
                        <SelectValue placeholder='Status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Status</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='failed'>Failed</SelectItem>
                        <SelectItem value='cancelled'>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingInternalTransactions ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-8'>
                          <Loader2 className='h-6 w-6 animate-spin mx-auto text-muted-foreground' />
                        </TableCell>
                      </TableRow>
                    ) : filteredInternalTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-12'>
                          <ArrowLeftRight className='h-12 w-12 mx-auto text-muted-foreground/50 mb-3' />
                          <p className='text-muted-foreground font-medium'>
                            No transactions found
                          </p>
                          <p className='text-sm text-muted-foreground mt-1'>
                            {internalSearch ||
                              internalTypeFilter !== 'all' ||
                              internalStatusFilter !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Your internal transactions will appear here'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInternalTransactions.map(
                        (t: WalletTransaction) => {
                          const mappedType = mapInternalType(t.type);
                          const icon = getInternalTransactionIcon(mappedType);
                          const description =
                            mappedType === 'transfer_out'
                              ? 'Transfer to escrow'
                              : mappedType === 'transfer_in'
                                ? 'Transfer from escrow'
                                : 'Transfer';
                          const statusText = mapStatus(t.status);
                          const amountNumber = parseFloat(t.amount);
                          return (
                            <TableRow key={t.id} className='hover:bg-muted/50 cursor-pointer' onClick={() => router.push(`/dashboard/creator/wallet/${t.id}?type=internal`)}>
                              <TableCell>
                                <span className='text-sm font-mono text-muted-foreground'>
                                  {t.id.slice(0, 8).toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className='flex items-center gap-2 min-w-0'>
                                  {icon}
                                  <span className='text-sm font-medium truncate'>
                                    {getTypeLabel(mappedType)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span title={t.note || ''} className='text-sm text-muted-foreground truncate block max-w-[260px]'>
                                  {t.note ? t.note : '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className='text-sm text-muted-foreground whitespace-nowrap'>
                                  {formatDateTime(t.createdAt)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant='outline'
                                  className={`${getStatusBadgeStyle(
                                    statusText
                                  )} flex items-center gap-1.5 w-fit`}
                                >
                                  {getStatusIcon(statusText)}
                                  {getStatusLabel(statusText)}
                                </Badge>
                              </TableCell>
                              <TableCell className='text-right'>
                                <span
                                  className={`text-sm font-bold whitespace-nowrap ${mappedType === 'transfer_out'
                                      ? 'text-orange-600'
                                      : 'text-green-600'
                                    }`}
                                >
                                  {getTransactionSign(mappedType)}
                                  {formatCurrency(amountNumber)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Showing {filteredInternalTransactions.length} of{' '}
                  {totalInternalItems} internal transactions
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentInternalPage((p) => Math.max(1, p - 1))
                    }
                    disabled={
                      currentInternalPage === 1 || isLoadingInternalTransactions
                    }
                  >
                    Previous
                  </Button>
                  <div className='flex items-center gap-1'>
                    {Array.from(
                      { length: Math.min(totalInternalPages, 4) },
                      (_, i) => {
                        const pageNum = i + 1;
                        const isActive = currentInternalPage === pageNum;
                        return (
                          <Button
                            key={pageNum}
                            variant='outline'
                            size='sm'
                            onClick={() => setCurrentInternalPage(pageNum)}
                            disabled={isLoadingInternalTransactions}
                            style={
                              isActive
                                ? {
                                  backgroundColor:
                                    'lab(58.8635% 31.6645 115.942)',
                                  borderColor:
                                    'lab(58.8635% 31.6645 115.942)',
                                  color: 'white',
                                }
                                : {}
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentInternalPage((p) =>
                        Math.min(totalInternalPages, p + 1)
                      )
                    }
                    disabled={
                      currentInternalPage >= totalInternalPages ||
                      isLoadingInternalTransactions
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* External Transactions Tab */}
            <TabsContent value='external' className='space-y-4'>
              <div className='rounded-md border border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10 p-3 mb-4'>
                <p className='text-sm text-foreground font-medium flex items-center gap-2'>
                  <Building2 className='h-4 w-4 text-primary' />
                  External transactions are deposits from or withdrawals to your
                  bank account
                </p>
              </div>

              {/* Search and Filter Section */}
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-4'>
                  {/* Search Input */}
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search by ID, bank, date, or amount...'
                      className='pl-9'
                      value={externalSearch}
                      onChange={(e) => setExternalSearch(e.target.value)}
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className='flex gap-2'>
                    {/* Type Filter */}
                    <Select
                      value={externalTypeFilter}
                      onValueChange={setExternalTypeFilter}
                    >
                      <SelectTrigger className='w-[150px]'>
                        <Filter className='h-4 w-4 mr-2' />
                        <SelectValue placeholder='Type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Types</SelectItem>
                        <SelectItem value='deposit'>Deposit</SelectItem>
                        <SelectItem value='withdrawal'>Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select
                      value={externalStatusFilter}
                      onValueChange={setExternalStatusFilter}
                    >
                      <SelectTrigger className='w-[150px]'>
                        <SelectValue placeholder='Status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Status</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='failed'>Failed</SelectItem>
                        <SelectItem value='cancelled'>Cancelled</SelectItem>
                        <SelectItem value='ready'>Ready for Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingExternalTransactions ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-8'>
                          <Loader2 className='h-6 w-6 animate-spin mx-auto text-muted-foreground' />
                        </TableCell>
                      </TableRow>
                    ) : filteredExternalTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-12'>
                          <Building2 className='h-12 w-12 mx-auto text-muted-foreground/50 mb-3' />
                          <p className='text-muted-foreground font-medium'>
                            No transactions found
                          </p>
                          <p className='text-sm text-muted-foreground mt-1'>
                            {externalSearch ||
                              externalTypeFilter !== 'all' ||
                              externalStatusFilter !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Your external transactions will appear here'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExternalTransactions.map((transaction) => {
                        const mappedTransaction =
                          mapExternalTransaction(transaction);
                        const canCancel =
                          transaction.status.toUpperCase() === 'PENDING' ||
                          transaction.status.toUpperCase() ===
                          'READY_FOR_PAYMENT';
                        return (
                          <TableRow
                            key={transaction.id}
                            className='hover:bg-muted/50'
                          >
                            <TableCell>
                              <span className='text-sm font-mono text-muted-foreground'>
                                {transaction.id.slice(0, 8).toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2 min-w-0'>
                                {getExternalTransactionIcon(
                                  mappedTransaction.type
                                )}
                                <span className='text-sm font-medium truncate'>
                                  {getTypeLabel(mappedTransaction.type)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className='text-sm text-muted-foreground whitespace-nowrap'>
                                {formatDateTime(mappedTransaction.date)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant='outline'
                                className={`${getStatusBadgeStyle(
                                  mappedTransaction.status
                                )} flex items-center gap-1.5 w-fit`}
                              >
                                {getStatusIcon(mappedTransaction.status)}
                                {getStatusLabel(mappedTransaction.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-right'>
                              <span
                                className={`text-sm font-bold whitespace-nowrap ${mappedTransaction.type === 'withdrawal'
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                  }`}
                              >
                                {getTransactionSign(mappedTransaction.type)}
                                {formatCurrency(mappedTransaction.amount)}
                              </span>
                            </TableCell>
                            <TableCell className='text-right'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-8 w-8 p-0'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                  >
                                    <MoreVertical className='h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/dashboard/business/wallet/${transaction.id}?type=external`}
                                      className='cursor-pointer'
                                    >
                                      <Eye className='h-4 w-4 mr-2' />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  {canCancel && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCancelClick(transaction.id);
                                      }}
                                      disabled={cancelWithdraw.isPending}
                                      className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
                                    >
                                      {cancelWithdraw.isPending &&
                                        transactionToCancel === transaction.id ? (
                                        <>
                                          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                          Cancelling...
                                        </>
                                      ) : (
                                        <>
                                          <X className='h-4 w-4 mr-2' />
                                          Cancel Transaction
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  Showing {filteredExternalTransactions.length} of{' '}
                  {totalExternalItems} external transactions
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentExternalPage((p) => Math.max(1, p - 1))
                    }
                    disabled={
                      currentExternalPage === 1 || isLoadingExternalTransactions
                    }
                  >
                    Previous
                  </Button>
                  <div className='flex items-center gap-1'>
                    {Array.from(
                      { length: Math.min(totalExternalPages || 1, 4) },
                      (_, i) => {
                        const pageNum = i + 1;
                        const isActive = currentExternalPage === pageNum;
                        return (
                          <Button
                            key={pageNum}
                            variant='outline'
                            size='sm'
                            onClick={() => setCurrentExternalPage(pageNum)}
                            disabled={isLoadingExternalTransactions}
                            style={
                              isActive
                                ? {
                                  backgroundColor:
                                    'lab(58.8635% 31.6645 115.942)',
                                  borderColor:
                                    'lab(58.8635% 31.6645 115.942)',
                                  color: 'white',
                                }
                                : {}
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentExternalPage((p) =>
                        Math.min(totalExternalPages || 1, p + 1)
                      )
                    }
                    disabled={
                      currentExternalPage >= (totalExternalPages || 1) ||
                      isLoadingExternalTransactions
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cancel Transaction Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transaction? This action
              cannot be undone. The transaction will be moved to CANCELLED
              status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCancelDialogOpen(false);
                setTransactionToCancel(null);
              }}
              disabled={cancelWithdraw.isPending}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleCancelConfirm}
              disabled={cancelWithdraw.isPending}
            >
              {cancelWithdraw.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
