'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  Eye,
  Gift,
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  FileText,
  Bell,
  Activity,
  CreditCard,
  Flag,
  UserCheck,
  UserX,
  Search,
  Settings,
  Filter,
  Loader2,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Building2,
  CheckCircle2,
  BarChart3,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import {
  Line,
  LineChart,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  StatsCard,
  DashboardHeader,
  StatusBadge,
} from '@/components/dashboard';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { useAllAccounts } from '@/hooks/admin/useAllAccounts';
import { useAllLocations } from '@/hooks/admin/useAllLocations';
import { useAllEvents } from '@/hooks/admin/useAllEvents';
import { useReports } from '@/hooks/admin/useReports';
import { useAdminExternalTransactions } from '@/hooks/admin/useAdminExternalTransactions';
import { format, subDays, subMonths, isSameMonth, isSameDay } from 'date-fns';
import Link from 'next/link';

const userGrowthConfig: ChartConfig = {
  users: {
    label: 'New users',
    color: 'hsl(var(--primary))',
  },
};

const revenueConfig: ChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  deposits: {
    label: 'Deposits',
    color: 'hsl(var(--chart-2))',
  },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function QuickActionCard({
  title,
  description,
  icon: Icon,
  action,
  variant = 'default',
  onClick,
}: {
  title: string;
  description: string;
  icon: any;
  action: string;
  variant?: 'default' | 'danger';
  onClick?: () => void;
}) {
  return (
    <Card
      className='hover:shadow-md transition-shadow cursor-pointer group'
      onClick={onClick}
    >
      <CardContent className='p-4'>
        <div className='flex items-center space-x-3'>
          <div
            className={`p-2 rounded-lg transition-colors ${
              variant === 'danger'
                ? 'bg-red-100 text-red-600 group-hover:bg-red-200 dark:bg-red-950 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400'
            }`}
          >
            <Icon className='h-4 w-4' />
          </div>
          <div className='flex-1'>
            <h4 className='font-medium text-sm'>{title}</h4>
            <p className='text-xs text-muted-foreground'>{description}</p>
          </div>
          <Button
            size='sm'
            variant={variant === 'danger' ? 'destructive' : 'default'}
            className='shrink-0'
          >
            {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const { data: accountsData, isLoading: isLoadingAccounts } = useAllAccounts({
    page: 1,
    limit: 200,
    sortBy: ['createdAt:DESC'],
  });

  const { data: locationsData, isLoading: isLoadingLocations } = useAllLocations(
    1,
    1,
    '',
    'createdAt:DESC'
  );

  const { data: eventsData, isLoading: isLoadingEvents } = useAllEvents(
    1,
    '',
    'startDate:ASC'
  );

  const { data: pendingReportsData, isLoading: isLoadingReports } = useReports({
    page: 1,
    limit: 20,
    status: 'PENDING',
  });

  const {
    data: recentReportsData,
    isLoading: isLoadingRecentReports,
  } = useReports({
    page: 1,
    limit: 200,
    sortBy: 'createdAt:DESC',
  });

  const {
    data: externalTransactionsData,
    isLoading: isLoadingExternalTx,
  } = useAdminExternalTransactions({
    page: 1,
    limit: 50,
    sortBy: 'createdAt:DESC',
  });

  const isLoadingStats =
    isLoadingAccounts ||
    isLoadingLocations ||
    isLoadingEvents ||
    isLoadingReports ||
    isLoadingExternalTx;

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate enhanced statistics with trends
  const stats = useMemo(() => {
    const totalUsers = accountsData?.data.meta.totalItems ?? 0;
    const totalLocations = locationsData?.meta.totalItems ?? 0;
    const totalEvents = eventsData?.meta.totalItems ?? 0;
    const pendingContent = pendingReportsData?.meta.totalItems ?? 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 7);
    const lastMonth = subMonths(today, 1);

    // Calculate today's revenue
    const todayRevenueRaw =
      externalTransactionsData?.data
        .filter(
          (tx) =>
            tx.status === 'COMPLETED' &&
            tx.direction === 'DEPOSIT' &&
            isSameDay(new Date(tx.createdAt), today)
        )
        .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) ?? 0;

    // Calculate yesterday's revenue for comparison
    const yesterdayRevenueRaw =
      externalTransactionsData?.data
        .filter(
          (tx) =>
            tx.status === 'COMPLETED' &&
            tx.direction === 'DEPOSIT' &&
            isSameDay(new Date(tx.createdAt), yesterday)
        )
        .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) ?? 0;

    const revenueChange =
      yesterdayRevenueRaw > 0
        ? ((todayRevenueRaw - yesterdayRevenueRaw) / yesterdayRevenueRaw) * 100
        : todayRevenueRaw > 0
        ? 100
        : 0;

    // Calculate user growth (last 7 days vs previous 7 days)
    const accounts = (accountsData?.data.data ?? []) as any[];
    const last7Days = accounts.filter((acc) => {
      const createdAt = new Date(acc.createdAt);
      return createdAt >= lastWeek && createdAt < today;
    }).length;

    const previous7Days = accounts.filter((acc) => {
      const createdAt = new Date(acc.createdAt);
      const previousWeekStart = subDays(lastWeek, 7);
      return createdAt >= previousWeekStart && createdAt < lastWeek;
    }).length;

    const usersChange =
      previous7Days > 0
        ? ((last7Days - previous7Days) / previous7Days) * 100
        : last7Days > 0
        ? 100
        : 0;

    // Mock data for locations and events growth (can be replaced with real API later)
    const locationsChange = 8.5; // Mock: +8.5% growth
    const eventsChange = -2.3; // Mock: -2.3% decrease

    return {
      totalUsers,
      totalLocations,
      totalEvents,
      todayRevenue: todayRevenueRaw,
      revenueChange,
      usersChange,
      locationsChange,
      eventsChange,
      pendingContent,
    };
  }, [
    accountsData,
    locationsData,
    eventsData,
    pendingReportsData,
    externalTransactionsData,
  ]);

  // User growth data for chart
  const userGrowthData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const accounts = (accountsData?.data.data ?? []) as any[];
    const countsByDay: Record<string, number> = {};

    accounts.forEach((account) => {
      if (!account.createdAt) return;
      const createdAt = new Date(account.createdAt);
      createdAt.setHours(0, 0, 0, 0);

      const diffInDays =
        (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (diffInDays < 0 || diffInDays > 6) return;

      const key = createdAt.toISOString().slice(0, 10);
      countsByDay[key] = (countsByDay[key] || 0) + 1;
    });

    const result: { period: string; users: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });

      result.push({
        period: label,
        users: countsByDay[key] || 0,
      });
    }

    return result;
  }, [accountsData]);

  // Revenue trend data (mock data for now)
  const revenueTrendData = useMemo(() => {
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      // Mock revenue data - can be replaced with real API
      const baseRevenue = 2000000;
      const randomFactor = Math.random() * 500000 - 250000;
      result.push({
        period: label,
        revenue: baseRevenue + randomFactor,
        deposits: baseRevenue * 0.7 + randomFactor * 0.7,
      });
    }

    return result;
  }, []);

  // Content type distribution (mock data)
  const contentDistributionData = useMemo(() => {
    return [
      { name: 'Posts', value: 45, color: COLORS[0] },
      { name: 'Events', value: 30, color: COLORS[1] },
      { name: 'Locations', value: 25, color: COLORS[2] },
    ];
  }, []);

  // Content stats
  const contentStats = useMemo(() => {
    const reports = recentReportsData?.data ?? [];
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let postsLast24h = 0;
    let eventsLast24h = 0;
    let locationsLast24h = 0;

    reports.forEach((report: any) => {
      const createdAt = new Date(report.createdAt);
      if (createdAt < cutoff) return;

      switch (report.targetType) {
        case 'post':
          postsLast24h += 1;
          break;
        case 'event':
          eventsLast24h += 1;
          break;
        case 'location':
          locationsLast24h += 1;
          break;
      }
    });

    const pendingContent = pendingReportsData?.meta.totalItems ?? 0;

    return {
      postsLast24h,
      eventsLast24h,
      locationsLast24h,
      pendingContent,
    };
  }, [recentReportsData, pendingReportsData]);

  // Mock recent activity data
  const recentActivity = useMemo(() => {
    return [
      {
        id: '1',
        type: 'user_created',
        message: 'New user account created',
        user: 'John Doe',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        icon: Users,
        color: 'text-blue-600',
      },
      {
        id: '2',
        type: 'location_approved',
        message: 'Location approved',
        location: 'Coffee Shop Downtown',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        icon: CheckCircle2,
        color: 'text-green-600',
      },
      {
        id: '3',
        type: 'report_resolved',
        message: 'Report resolved',
        report: 'Inappropriate content',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        icon: Shield,
        color: 'text-purple-600',
      },
      {
        id: '4',
        type: 'event_published',
        message: 'Event published',
        event: 'Summer Music Festival',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        icon: Calendar,
        color: 'text-orange-600',
      },
      {
        id: '5',
        type: 'transaction_completed',
        message: 'Transaction completed',
        amount: '₫500,000',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        icon: DollarSign,
        color: 'text-green-600',
      },
    ];
  }, []);

  return (
    <div className='space-y-8 pb-8'>
      {/* Enhanced Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
          <p className='text-muted-foreground mt-1'>
            Overview of platform activity and system management
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => window.location.reload()}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/reports')}>
            <Flag className='h-4 w-4 mr-2' />
            View Reports
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-muted-foreground mb-1'>
                  Total Users
                </p>
                <div className='flex items-baseline gap-2'>
                  <p className='text-3xl font-bold'>
                    {isLoadingStats ? (
                      <Loader2 className='h-8 w-8 animate-spin' />
                    ) : (
                      stats.totalUsers.toLocaleString()
                    )}
                  </p>
                  {!isLoadingStats && (
                    <div className='flex items-center gap-1'>
                      {stats.usersChange >= 0 ? (
                        <TrendingUp className='h-4 w-4 text-green-600' />
                      ) : (
                        <TrendingDown className='h-4 w-4 text-red-600' />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stats.usersChange >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.abs(stats.usersChange).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  {stats.usersChange >= 0 ? 'vs last week' : 'vs last week'}
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center'>
                <Users className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-muted-foreground mb-1'>
                  Active Locations
                </p>
                <div className='flex items-baseline gap-2'>
                  <p className='text-3xl font-bold'>
                    {isLoadingStats ? (
                      <Loader2 className='h-8 w-8 animate-spin' />
                    ) : (
                      stats.totalLocations.toLocaleString()
                    )}
                  </p>
                  {!isLoadingStats && (
                    <div className='flex items-center gap-1'>
                      {stats.locationsChange >= 0 ? (
                        <TrendingUp className='h-4 w-4 text-green-600' />
                      ) : (
                        <TrendingDown className='h-4 w-4 text-red-600' />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stats.locationsChange >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.abs(stats.locationsChange).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  Locations on platform
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center'>
                <MapPin className='h-6 w-6 text-green-600 dark:text-green-400' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-muted-foreground mb-1'>
                  Upcoming Events
                </p>
                <div className='flex items-baseline gap-2'>
                  <p className='text-3xl font-bold'>
                    {isLoadingStats ? (
                      <Loader2 className='h-8 w-8 animate-spin' />
                    ) : (
                      stats.totalEvents.toLocaleString()
                    )}
                  </p>
                  {!isLoadingStats && (
                    <div className='flex items-center gap-1'>
                      {stats.eventsChange >= 0 ? (
                        <TrendingUp className='h-4 w-4 text-green-600' />
                      ) : (
                        <TrendingDown className='h-4 w-4 text-red-600' />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stats.eventsChange >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.abs(stats.eventsChange).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  Events scheduled
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center'>
                <Calendar className='h-6 w-6 text-purple-600 dark:text-purple-400' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-muted-foreground mb-1'>
                  Today Revenue
                </p>
                <div className='flex items-baseline gap-2'>
                  <p className='text-3xl font-bold'>
                    {isLoadingStats ? (
                      <Loader2 className='h-8 w-8 animate-spin' />
                    ) : (
                      formatCurrency(stats.todayRevenue)
                    )}
                  </p>
                  {!isLoadingStats && (
                    <div className='flex items-center gap-1'>
                      {stats.revenueChange >= 0 ? (
                        <TrendingUp className='h-4 w-4 text-green-600' />
                      ) : (
                        <TrendingDown className='h-4 w-4 text-red-600' />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stats.revenueChange >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.abs(stats.revenueChange).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  vs yesterday
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center'>
                <DollarSign className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow border-orange-200 dark:border-orange-800'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium text-muted-foreground mb-1'>
                  Pending Reviews
                </p>
                <div className='flex items-baseline gap-2'>
                  <p className='text-3xl font-bold'>
                    {isLoadingStats ? (
                      <Loader2 className='h-8 w-8 animate-spin' />
                    ) : (
                      stats.pendingContent.toLocaleString()
                    )}
                  </p>
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  Requires attention
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center'>
                <Clock className='h-6 w-6 text-orange-600 dark:text-orange-400' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Link href='/admin/business'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer group h-full'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors'>
                  <Building2 className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div className='flex-1'>
                  <p className='font-semibold text-sm'>Business Accounts</p>
                  <p className='text-xs text-muted-foreground'>
                    Manage business profiles
                  </p>
                </div>
                <ArrowRight className='h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors' />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/location-requests'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer group h-full'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors'>
                  <MapPin className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div className='flex-1'>
                  <p className='font-semibold text-sm'>Location Requests</p>
                  <p className='text-xs text-muted-foreground'>
                    Review pending requests
                  </p>
                </div>
                <ArrowRight className='h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors' />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/reports'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer group h-full'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors'>
                  <Flag className='h-5 w-5 text-red-600 dark:text-red-400' />
                </div>
                <div className='flex-1'>
                  <p className='font-semibold text-sm'>Content Reports</p>
                  <p className='text-xs text-muted-foreground'>
                    {stats.pendingContent} pending reviews
                  </p>
                </div>
                <ArrowRight className='h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors' />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/wallet'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer group h-full'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors'>
                  <CreditCard className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                </div>
                <div className='flex-1'>
                  <p className='font-semibold text-sm'>Financial Overview</p>
                  <p className='text-xs text-muted-foreground'>
                    View transactions
                  </p>
                </div>
                <ArrowRight className='h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors' />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              User Growth (Last 7 Days)
            </CardTitle>
            <CardDescription>
              New user registrations over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userGrowthData.length > 0 ? (
              <ChartContainer config={userGrowthConfig} className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      vertical={false}
                      className='stroke-muted'
                    />
                    <XAxis
                      dataKey='period'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '4 4' }}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      type='monotone'
                      dataKey='users'
                      stroke='var(--color-users)'
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className='h-[300px] flex items-center justify-center text-muted-foreground'>
                <div className='text-center'>
                  <Users className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No user growth data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5' />
              Revenue Trend (Last 7 Days)
            </CardTitle>
            <CardDescription>
              Daily revenue and deposits overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueTrendData.length > 0 ? (
              <ChartContainer config={revenueConfig} className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={revenueTrendData}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      vertical={false}
                      className='stroke-muted'
                    />
                    <XAxis
                      dataKey='period'
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `₫${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar
                      dataKey='revenue'
                      fill='var(--color-revenue)'
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey='deposits'
                      fill='var(--color-deposits)'
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className='h-[300px] flex items-center justify-center text-muted-foreground'>
                <div className='text-center'>
                  <DollarSign className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No revenue data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='users' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='users'>Users</TabsTrigger>
          <TabsTrigger value='content'>Content</TabsTrigger>
          <TabsTrigger value='vouchers'>Vouchers</TabsTrigger>
          <TabsTrigger value='system'>System</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value='users' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* User Growth Chart */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle>User Growth</CardTitle>
                  <div className='flex space-x-2'>
                    <Button variant='outline' size='sm'>
                      Week
                    </Button>
                    <Button variant='outline' size='sm'>
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={userGrowthConfig} className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        className='stroke-muted'
                      />
                      <XAxis
                        dataKey='period'
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip
                        cursor={{
                          stroke: 'hsl(var(--muted-foreground))',
                          strokeDasharray: '4 4',
                        }}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        type='monotone'
                        dataKey='users'
                        stroke='var(--color-users)'
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Award className='h-4 w-4 mr-2' />
                  Top Users
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {[
                  {
                    name: 'John Doe',
                    points: '2,847',
                    badge: 'Gold Explorer',
                  },
                  {
                    name: 'Jane Smith',
                    points: '2,156',
                    badge: 'Silver Reviewer',
                  },
                  {
                    name: 'Mike Johnson',
                    points: '1,923',
                    badge: 'Bronze Creator',
                  },
                  { name: 'Sarah Williams', points: '1,678', badge: 'Active User' },
                  { name: 'David Brown', points: '1,445', badge: 'Explorer' },
                ].map((user, i) => (
                  <div
                    key={i}
                    className='flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors'
                  >
                    <div className='flex items-center space-x-2'>
                      <span className='font-bold text-sm w-6'>#{i + 1}</span>
                      <div>
                        <p className='font-medium text-sm'>{user.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {user.badge}
                        </p>
                      </div>
                    </div>
                    <span className='font-bold text-sm'>{user.points}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Restricted Users */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Shield className='h-4 w-4 mr-2 text-red-500' />
                  Restricted Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>John X</TableCell>
                      <TableCell>
                        <StatusBadge status='REJECTED' />
                      </TableCell>
                      <TableCell>Spam reviews</TableCell>
                      <TableCell>
                        <Button size='sm' variant='outline'>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jane Y</TableCell>
                      <TableCell>
                        <StatusBadge status='PENDING' />
                      </TableCell>
                      <TableCell>Inappropriate content</TableCell>
                      <TableCell>
                        <Button size='sm' variant='outline'>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <QuickActionCard
                  title='Search Users'
                  description='Find and view user profiles'
                  icon={Search}
                  action='Search'
                  onClick={() => router.push('/admin/accounts')}
                />
                <QuickActionCard
                  title='Ban Account'
                  description='Temporarily restrict violating users'
                  icon={UserX}
                  action='Ban'
                  variant='danger'
                />
                <QuickActionCard
                  title='View Activity Log'
                  description='Track user activities'
                  icon={Activity}
                  action='View'
                />
                <QuickActionCard
                  title='Unban Account'
                  description='Restore user account'
                  icon={UserCheck}
                  action='Unban'
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value='content' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='Posts (24h)'
              value={contentStats.postsLast24h}
              change='Posts reported in last 24h'
              icon={FileText}
              color='blue'
            />
            <StatsCard
              title='Reviews (24h)'
              value={contentStats.locationsLast24h}
              change='Locations reported in last 24h'
              icon={Star}
              color='green'
            />
            <StatsCard
              title='Events (24h)'
              value={contentStats.eventsLast24h}
              change='Events reported in last 24h'
              icon={Eye}
              color='purple'
            />
            <StatsCard
              title='Pending Reviews'
              value={contentStats.pendingContent}
              change='Reports awaiting review'
              icon={Clock}
              color='orange'
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Content Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <PieChart className='h-5 w-5' />
                  Content Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of content types on platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[300px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <RechartsPieChart>
                      <Pie
                        data={contentDistributionData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill='#8884d8'
                        dataKey='value'
                      >
                        {contentDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pending Content */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Pending Content</span>
                  <Button size='sm' variant='outline'>
                    <Filter className='h-4 w-4 mr-2' />
                    Filter
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className='flex items-center justify-center py-10'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                  </div>
                ) : !pendingReportsData ||
                  pendingReportsData.data.length === 0 ? (
                  <div className='text-center py-10'>
                    <CheckCircle2 className='h-12 w-12 mx-auto text-green-500 mb-2 opacity-50' />
                    <p className='text-sm text-muted-foreground'>
                      No pending content reviews at this time.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReportsData.data.slice(0, 5).map((report: any) => {
                        const typeLabel =
                          report.targetType === 'post'
                            ? 'Post'
                            : report.targetType === 'event'
                            ? 'Event'
                            : 'Location';
                        const reporterName =
                          report.createdBy?.firstName ||
                          report.createdBy?.lastName
                            ? `${report.createdBy?.firstName ?? ''} ${
                                report.createdBy?.lastName ?? ''
                              }`.trim()
                            : report.createdBy?.email;

                        return (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Badge
                                variant={
                                  report.targetType === 'event'
                                    ? 'secondary'
                                    : 'default'
                                }
                              >
                                {typeLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className='font-medium'>
                              {report.title}
                            </TableCell>
                            <TableCell>{reporterName}</TableCell>
                            <TableCell>
                              <div className='flex space-x-1'>
                                <Button size='sm' variant='outline'>
                                  <CheckCircle className='h-3 w-3' />
                                </Button>
                                <Button size='sm' variant='outline'>
                                  <XCircle className='h-3 w-3' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Reports */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Flag className='h-4 w-4 mr-2 text-red-500' />
                Recent User Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRecentReports ? (
                <div className='flex items-center justify-center py-10'>
                  <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                </div>
              ) : !recentReportsData ||
                recentReportsData.data.length === 0 ? (
                <div className='text-center py-10'>
                  <Flag className='h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50' />
                  <p className='text-sm text-muted-foreground'>
                    No user reports at this time.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {recentReportsData.data.slice(0, 6).map((report: any) => {
                    const typeLabel =
                      report.targetType === 'post'
                        ? 'Post'
                        : report.targetType === 'event'
                        ? 'Event'
                        : 'Location';

                    const reporterName =
                      report.createdBy?.firstName ||
                      report.createdBy?.lastName
                        ? `${report.createdBy?.firstName ?? ''} ${
                            report.createdBy?.lastName ?? ''
                          }`.trim()
                        : report.createdBy?.email;

                    const statusVariant =
                      report.status === 'PENDING'
                        ? 'secondary'
                        : report.status === 'IN_PROGRESS'
                        ? 'default'
                        : 'outline';

                    const statusLabel =
                      report.status === 'PENDING'
                        ? 'Pending'
                        : report.status === 'IN_PROGRESS'
                        ? 'In Progress'
                        : 'Resolved';

                    return (
                      <div
                        key={report.id}
                        className='p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                      >
                        <div className='flex justify-between items-start mb-2'>
                          <div>
                            <Badge variant='outline' className='mb-2'>
                              {typeLabel}
                            </Badge>
                            <p className='text-sm font-medium'>
                              {report.title ||
                                report.reportedReasonEntity?.displayName}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              Reported by: {reporterName}
                            </p>
                          </div>
                          <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </div>
                        <div className='flex space-x-2'>
                          <Button size='sm' variant='outline'>
                            View Details
                          </Button>
                          {(report.status === 'PENDING' ||
                            report.status === 'IN_PROGRESS') && (
                            <Button size='sm'>Resolve</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value='vouchers' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='Active Vouchers'
              value='156'
              change='12 new this week'
              icon={Gift}
              color='green'
            />
            <StatsCard
              title='Expired Vouchers'
              value='23'
              change='5 expired today'
              icon={Clock}
              color='red'
            />
            <StatsCard
              title='Expiring Soon'
              value='8'
              change='Within 7 days'
              icon={AlertTriangle}
              color='orange'
            />
            <StatsCard
              title='Points Distributed'
              value='45.2K'
              change='+2.1K today'
              icon={Award}
              color='purple'
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Award className='h-4 w-4 mr-2' />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue='users' className='w-full'>
                  <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='users'>Top Users</TabsTrigger>
                    <TabsTrigger value='reviewers'>Reviewers</TabsTrigger>
                    <TabsTrigger value='checkins'>Check-ins</TabsTrigger>
                  </TabsList>
                  <TabsContent value='users' className='space-y-2 mt-4'>
                    {[
                      { name: 'John A', score: '2,847', badge: '🥇' },
                      { name: 'Jane B', score: '2,156', badge: '🥈' },
                      { name: 'Mike C', score: '1,923', badge: '🥉' },
                    ].map((user, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors'
                      >
                        <div className='flex items-center space-x-2'>
                          <span className='text-lg'>{user.badge}</span>
                          <span className='font-medium'>{user.name}</span>
                        </div>
                        <span className='font-bold'>{user.score}</span>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value='reviewers' className='space-y-2 mt-4'>
                    {[
                      { name: 'Sarah D', reviews: '234', badge: '🥇' },
                      { name: 'Tom E', reviews: '189', badge: '🥈' },
                      { name: 'Lisa F', reviews: '156', badge: '🥉' },
                    ].map((user, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors'
                      >
                        <div className='flex items-center space-x-2'>
                          <span className='text-lg'>{user.badge}</span>
                          <span className='font-medium'>{user.name}</span>
                        </div>
                        <span className='font-bold'>{user.reviews} reviews</span>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value='checkins' className='space-y-2 mt-4'>
                    {[
                      { name: 'Alex G', checkins: '89', badge: '🥇' },
                      { name: 'Emma H', checkins: '76', badge: '🥈' },
                      { name: 'Ryan I', checkins: '65', badge: '🥉' },
                    ].map((user, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors'
                      >
                        <div className='flex items-center space-x-2'>
                          <span className='text-lg'>{user.badge}</span>
                          <span className='font-medium'>{user.name}</span>
                        </div>
                        <span className='font-bold'>{user.checkins} check-ins</span>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Top Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Top Locations by Voucher Redemptions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {[
                  {
                    name: 'Highlands Coffee',
                    vouchers: 89,
                    revenue: '₫450K',
                  },
                  {
                    name: 'The Coffee House',
                    vouchers: 76,
                    revenue: '₫380K',
                  },
                  {
                    name: 'Starbucks',
                    vouchers: 65,
                    revenue: '₫325K',
                  },
                  {
                    name: 'Phúc Long Coffee',
                    vouchers: 54,
                    revenue: '₫270K',
                  },
                  {
                    name: 'Cộng Cà Phê',
                    vouchers: 43,
                    revenue: '₫215K',
                  },
                ].map((location, i) => (
                  <div
                    key={i}
                    className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                  >
                    <div>
                      <p className='font-medium text-sm'>{location.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {location.vouchers} vouchers redeemed
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold text-sm'>{location.revenue}</p>
                      <p className='text-xs text-muted-foreground'>Revenue</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Settings className='h-4 w-4 mr-2' />
                Quick Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <QuickActionCard
                  title='Adjust Points Rules'
                  description='Update point calculation system'
                  icon={Settings}
                  action='Configure'
                />
                <QuickActionCard
                  title='Create New Badge'
                  description='Add badges for users'
                  icon={Award}
                  action='Create'
                />
                <QuickActionCard
                  title='Manage Vouchers'
                  description='Create and manage vouchers'
                  icon={Gift}
                  action='Manage'
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value='system' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='System Alerts'
              value='3'
              change='2 require immediate attention'
              icon={AlertTriangle}
              color='red'
            />
            <StatsCard
              title='Payment Errors'
              value='1'
              change='In last 24h'
              icon={CreditCard}
              color='orange'
            />
            <StatsCard
              title='Upload Failures'
              value='5'
              change='Video upload failed'
              icon={Eye}
              color='orange'
            />
            <StatsCard
              title='API Failures'
              value='12'
              change='In last hour'
              icon={Activity}
              color='red'
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Bell className='h-4 w-4 mr-2 text-red-500' />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {[
                  {
                    type: 'Payment',
                    message:
                      'Payment processing error for transaction #12345',
                    severity: 'high',
                    time: '5 minutes ago',
                  },
                  {
                    type: 'AI Content',
                    message:
                      'AI detected sensitive content in post #789',
                    severity: 'medium',
                    time: '15 minutes ago',
                  },
                  {
                    type: 'Upload',
                    message: 'Video upload failed - file too large',
                    severity: 'low',
                    time: '1 hour ago',
                  },
                ].map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 border rounded-lg ${
                      alert.severity === 'high'
                        ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                        : alert.severity === 'medium'
                        ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
                    }`}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <Badge
                        variant={
                          alert.severity === 'high'
                            ? 'destructive'
                            : alert.severity === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {alert.type}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        {alert.time}
                      </span>
                    </div>
                    <p className='text-sm mb-2'>{alert.message}</p>
                    <div className='flex space-x-2'>
                      <Button size='sm' variant='outline'>
                        View Details
                      </Button>
                      <Button size='sm'>Resolve</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Audit Log */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <FileText className='h-4 w-4 mr-2' />
                  Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>admin1</TableCell>
                      <TableCell>Approved location #123</TableCell>
                      <TableCell>10:30</TableCell>
                      <TableCell className='text-muted-foreground'>
                        192.168.1.1
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>admin2</TableCell>
                      <TableCell>Banned user #456</TableCell>
                      <TableCell>09:15</TableCell>
                      <TableCell className='text-muted-foreground'>
                        192.168.1.2
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>admin1</TableCell>
                      <TableCell>Approved withdrawal ₫200K</TableCell>
                      <TableCell>08:45</TableCell>
                      <TableCell className='text-muted-foreground'>
                        192.168.1.1
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest platform activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className='flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors'
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${activity.color.replace('text-', 'bg-').replace('-600', '-100')} dark:${activity.color.replace('text-', 'bg-').replace('-600', '-950')}`}
                >
                  <activity.icon
                    className={`h-5 w-5 ${activity.color}`}
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium'>{activity.message}</p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {format(activity.timestamp, 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
