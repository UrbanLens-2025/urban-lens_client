'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
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
import { IconCurrencyDollar, IconCalendar, IconMapPin, IconUser, IconClock } from '@tabler/icons-react';

const userGrowthConfig: ChartConfig = {
  users: {
    label: 'New users',
    color: 'hsl(var(--primary))',
  },
};

function QuickActionCard({
  title,
  description,
  icon: Icon,
  action,
  variant = 'default',
}: any) {
  return (
    <Card className='hover:shadow-md transition-shadow cursor-pointer'>
      <CardContent className='p-4'>
        <div className='flex items-center space-x-3'>
          <div
            className={`p-2 rounded-lg ${
              variant === 'danger'
                ? 'bg-red-100 text-red-600'
                : 'bg-blue-100 text-blue-600'
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
          >
            {action}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
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

  const dashboardStats = useMemo(() => {
    const totalUsers = accountsData?.data.meta.totalItems ?? 0;
    const totalLocations = locationsData?.meta.totalItems ?? 0;
    const totalEvents = eventsData?.meta.totalItems ?? 0;
    const pendingContent = pendingReportsData?.meta.totalItems ?? 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRevenueRaw =
      externalTransactionsData?.data
        .filter(
          (tx) =>
            tx.status === 'COMPLETED' &&
            tx.direction === 'DEPOSIT' &&
            new Date(tx.createdAt) >= today
        )
        .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) ?? 0;

    const todayRevenueLabel =
      todayRevenueRaw > 0 ? `₫${todayRevenueRaw.toLocaleString()}` : '₫0';

    return [
      {
        title: 'Total Users',
        value: totalUsers.toLocaleString(),
        change: 'All user accounts in the system',
        icon: IconUser,
        color: 'blue' as const,
      },
      {
        title: 'Active Locations',
        value: totalLocations.toLocaleString(),
        change: 'Locations managed in the platform',
        icon: IconMapPin,
        color: 'green' as const,
      },
      {
        title: 'Upcoming Events',
        value: totalEvents.toLocaleString(),
        change: 'Events visible to admins',
        icon: IconCalendar,
        color: 'purple' as const,
      },
      {
        title: 'Today Revenue',
        value: todayRevenueLabel,
        change: 'Completed deposits today (approx.)',
        icon: IconCurrencyDollar,
        color: 'green' as const,
      },
      {
        title: 'Pending Content',
        value: pendingContent.toLocaleString(),
        change: 'Reports waiting for review',
        icon: IconClock,
        color: 'orange' as const,
      },
    ];
  }, [accountsData, locationsData, eventsData, pendingReportsData, externalTransactionsData]);

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

  return (
    <div className='space-y-8 pb-8 overflow-x-hidden'>
      <DashboardHeader
        title="Admin Dashboard"
        description="Manage users, content, and system operations"
      />

      {/* Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
        {dashboardStats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            isLoading={isLoadingStats}
            variant="minimal"
          />
        ))}
      </div>

      <Tabs defaultValue='users' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='users'>Users</TabsTrigger>
          <TabsTrigger value='content'>Content</TabsTrigger>
          {/* <TabsTrigger value='locations'>Địa điểm</TabsTrigger> */}
          {/* <TabsTrigger value='financial'>Financial</TabsTrigger> */}
          <TabsTrigger value='vouchers'>Vouchers</TabsTrigger>
          <TabsTrigger value='system'>System</TabsTrigger>
        </TabsList>

        {/* 1️⃣ User Management */}
        <TabsContent value='users' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Biểu đồ tăng trưởng người dùng */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle>Tăng trưởng người dùng</CardTitle>
                  <div className='flex space-x-2'>
                    <Button variant='outline' size='sm'>
                      Tuần
                    </Button>
                    <Button variant='outline' size='sm'>
                      Tháng
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='h-64 bg-muted/20 rounded-lg p-2'>
                  <ChartContainer config={userGrowthConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowthData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="period"
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
                          type="monotone"
                          dataKey="users"
                          stroke="var(--color-users)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top 10 người dùng nổi bật */}
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
                    name: 'Nguyễn Văn A',
                    points: '2,847',
                    badge: 'Gold Explorer',
                  },
                  {
                    name: 'Trần Thị B',
                    points: '2,156',
                    badge: 'Silver Reviewer',
                  },
                  {
                    name: 'Lê Minh C',
                    points: '1,923',
                    badge: 'Bronze Creator',
                  },
                  { name: 'Phạm Thị D', points: '1,678', badge: 'Active User' },
                  { name: 'Hoàng Văn E', points: '1,445', badge: 'Explorer' },
                ].map((user, i) => (
                  <div
                    key={i}
                    className='flex items-center justify-between p-2 rounded-lg bg-muted/20'
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
            {/* Người dùng bị cảnh báo/khóa */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Shield className='h-4 w-4 mr-2 text-red-500' />
                  Người dùng bị hạn chế
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Nguyễn X</TableCell>
                      <TableCell>
                        <StatusBadge status="REJECTED" />
                      </TableCell>
                      <TableCell>Spam reviews</TableCell>
                      <TableCell>
                        <Button size='sm' variant='outline'>
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Trần Y</TableCell>
                      <TableCell>
                        <StatusBadge status="PENDING" />
                      </TableCell>
                      <TableCell>Nội dung không phù hợp</TableCell>
                      <TableCell>
                        <Button size='sm' variant='outline'>
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Tác vụ nhanh */}
            <Card>
              <CardHeader>
                <CardTitle>Tác vụ nhanh</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <QuickActionCard
                  title='Tìm kiếm người dùng'
                  description='Tìm và xem hồ sơ chi tiết'
                  icon={Search}
                  action='Tìm kiếm'
                />
                <QuickActionCard
                  title='Khóa tài khoản'
                  description='Tạm khóa người dùng vi phạm'
                  icon={UserX}
                  action='Khóa'
                  variant='danger'
                />
                <QuickActionCard
                  title='Xem nhật ký'
                  description='Theo dõi hoạt động người dùng'
                  icon={Activity}
                  action='Xem'
                />
                <QuickActionCard
                  title='Gỡ khóa'
                  description='Khôi phục tài khoản'
                  icon={UserCheck}
                  action='Gỡ khóa'
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2️⃣ Content Moderation */}
        <TabsContent value='content' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='Bài viết mới (24h)'
              value={contentStats.postsLast24h}
              change='Bài viết bị báo cáo trong 24h qua'
              icon={FileText}
              color='blue'
            />
            <StatsCard
              title='Review mới (24h)'
              value={contentStats.locationsLast24h}
              change='Địa điểm bị báo cáo trong 24h qua'
              icon={Star}
              color='green'
            />
            <StatsCard
              title='Video mới (24h)'
              value={contentStats.eventsLast24h}
              change='Sự kiện bị báo cáo trong 24h qua'
              icon={Eye}
              color='purple'
            />
            <StatsCard
              title='Nội dung chờ duyệt'
              value={contentStats.pendingContent}
              change='Báo cáo chờ xử lý'
              icon={Clock}
              color='orange'
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Nội dung chờ duyệt */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>Nội dung chờ duyệt</span>
                  <Button size='sm' variant='outline'>
                    <Filter className='h-4 w-4 mr-2' />
                    Lọc
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className='flex items-center justify-center py-10'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                  </div>
                ) : !pendingReportsData || pendingReportsData.data.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    Hiện không có nội dung nào đang chờ duyệt.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Người tạo</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReportsData.data.slice(0, 5).map((report: any) => {
                        const typeLabel =
                          report.targetType === 'post'
                            ? 'Bài viết'
                            : report.targetType === 'event'
                            ? 'Sự kiện'
                            : 'Địa điểm';
                        const reporterName =
                          report.createdBy?.firstName || report.createdBy?.lastName
                            ? `${report.createdBy?.firstName ?? ''} ${report.createdBy?.lastName ?? ''}`.trim()
                            : report.createdBy?.email;

                        return (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Badge variant={report.targetType === 'event' ? 'secondary' : 'default'}>
                                {typeLabel}
                              </Badge>
                            </TableCell>
                            <TableCell>{report.title}</TableCell>
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

            {/* Báo cáo từ người dùng */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Flag className='h-4 w-4 mr-2 text-red-500' />
                  Báo cáo từ người dùng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRecentReports ? (
                  <div className='flex items-center justify-center py-10'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                  </div>
                ) : !recentReportsData || recentReportsData.data.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    Chưa có báo cáo nào từ người dùng.
                  </p>
                ) : (
                  <div className='space-y-4'>
                    {recentReportsData.data.slice(0, 6).map((report: any) => {
                      const typeLabel =
                        report.targetType === 'post'
                          ? 'Bài viết'
                          : report.targetType === 'event'
                          ? 'Sự kiện'
                          : 'Địa điểm';

                      const reporterName =
                        report.createdBy?.firstName || report.createdBy?.lastName
                          ? `${report.createdBy?.firstName ?? ''} ${report.createdBy?.lastName ?? ''}`.trim()
                          : report.createdBy?.email;

                      const statusVariant =
                        report.status === 'PENDING'
                          ? 'secondary'
                          : report.status === 'IN_PROGRESS'
                          ? 'default'
                          : 'outline';

                      const statusLabel =
                        report.status === 'PENDING'
                          ? 'Chờ xử lý'
                          : report.status === 'IN_PROGRESS'
                          ? 'Đang xem xét'
                          : 'Đã xử lý';

                      return (
                        <div key={report.id} className='p-3 border rounded-lg'>
                          <div className='flex justify-between items-start mb-2'>
                            <div>
                              <Badge variant='outline'>{typeLabel}</Badge>
                              <p className='text-sm font-medium mt-1'>
                                {report.title || report.reportedReasonEntity?.displayName}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                Báo cáo bởi: {reporterName}
                              </p>
                            </div>
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                          </div>
                          <div className='flex space-x-2'>
                            <Button size='sm' variant='outline'>
                              Xem chi tiết
                            </Button>
                            {report.status === 'PENDING' || report.status === 'IN_PROGRESS' ? (
                              <Button size='sm'>Xử lý</Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5️⃣ Voucher & Gamification */}
        <TabsContent value='vouchers' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='Voucher hoạt động'
              value='156'
              change='12 mới tuần này'
              icon={Gift}
              color='green'
            />
            <StatsCard
              title='Voucher hết hạn'
              value='23'
              change='5 hết hạn hôm nay'
              icon={Clock}
              color='red'
            />
            <StatsCard
              title='Voucher sắp hết hạn'
              value='8'
              change='Trong 7 ngày tới'
              icon={AlertTriangle}
              color='orange'
            />
            <StatsCard
              title='Điểm thưởng phân phối'
              value='45.2K'
              change='+2.1K hôm nay'
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
                      { name: 'Nguyễn A', score: '2,847', badge: '🥇' },
                      { name: 'Trần B', score: '2,156', badge: '🥈' },
                      { name: 'Lê C', score: '1,923', badge: '🥉' },
                    ].map((user, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-2 rounded-lg bg-muted/20'
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
                      { name: 'Phạm D', reviews: '234', badge: '🥇' },
                      { name: 'Hoàng E', reviews: '189', badge: '🥈' },
                      { name: 'Vũ F', reviews: '156', badge: '🥉' },
                    ].map((user, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-2 rounded-lg bg-muted/20'
                      >
                        <div className='flex items-center space-x-2'>
                          <span className='text-lg'>{user.badge}</span>
                          <span className='font-medium'>{user.name}</span>
                        </div>
                        <span className='font-bold'>
                          {user.reviews} reviews
                        </span>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value='checkins' className='space-y-2 mt-4'>
                    {[
                      { name: 'Đỗ G', checkins: '89', badge: '🥇' },
                      { name: 'Bùi H', checkins: '76', badge: '🥈' },
                      { name: 'Mai I', checkins: '65', badge: '🥉' },
                    ].map((user, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-2 rounded-lg bg-muted/20'
                      >
                        <div className='flex items-center space-x-2'>
                          <span className='text-lg'>{user.badge}</span>
                          <span className='font-medium'>{user.name}</span>
                        </div>
                        <span className='font-bold'>
                          {user.checkins} check-ins
                        </span>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Top địa điểm voucher */}
            <Card>
              <CardHeader>
                <CardTitle>Top địa điểm có nhiều voucher được đổi</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {[
                  { name: 'Highlands Coffee', vouchers: 89, revenue: '₫450K' },
                  { name: 'The Coffee House', vouchers: 76, revenue: '₫380K' },
                  { name: 'Starbucks', vouchers: 65, revenue: '₫325K' },
                  { name: 'Phúc Long Coffee', vouchers: 54, revenue: '₫270K' },
                  { name: 'Cộng Cà Phê', vouchers: 43, revenue: '₫215K' },
                ].map((location, i) => (
                  <div
                    key={i}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div>
                      <p className='font-medium text-sm'>{location.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {location.vouchers} voucher đã đổi
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-bold text-sm'>{location.revenue}</p>
                      <p className='text-xs text-muted-foreground'>Doanh thu</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Cấu hình nhanh */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Settings className='h-4 w-4 mr-2' />
                Cấu hình nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <QuickActionCard
                  title='Điều chỉnh quy tắc tính điểm'
                  description='Cập nhật hệ thống tính điểm'
                  icon={Settings}
                  action='Cấu hình'
                />
                <QuickActionCard
                  title='Tạo huy hiệu mới'
                  description='Thêm huy hiệu cho người dùng'
                  icon={Award}
                  action='Tạo mới'
                />
                <QuickActionCard
                  title='Quản lý voucher'
                  description='Tạo và quản lý voucher'
                  icon={Gift}
                  action='Quản lý'
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6️⃣ System Notifications & Logs */}
        <TabsContent value='system' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='Cảnh báo hệ thống'
              value='3'
              change='2 cần xử lý ngay'
              icon={AlertTriangle}
              color='red'
            />
            <StatsCard
              title='Lỗi thanh toán'
              value='1'
              change='Trong 24h qua'
              icon={CreditCard}
              color='orange'
            />
            <StatsCard
              title='Upload lỗi'
              value='5'
              change='Video upload thất bại'
              icon={Eye}
              color='orange'
            />
            <StatsCard
              title='API thất bại'
              value='12'
              change='Trong 1h qua'
              icon={Activity}
              color='red'
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Cảnh báo hệ thống */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Bell className='h-4 w-4 mr-2 text-red-500' />
                  Cảnh báo hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {[
                  {
                    type: 'Thanh toán',
                    message: 'Lỗi xử lý thanh toán cho giao dịch #12345',
                    severity: 'high',
                    time: '5 phút trước',
                  },
                  {
                    type: 'AI Content',
                    message:
                      'AI phát hiện nội dung nhạy cảm trong bài viết #789',
                    severity: 'medium',
                    time: '15 phút trước',
                  },
                  {
                    type: 'Upload',
                    message: 'Video upload thất bại - dung lượng quá lớn',
                    severity: 'low',
                    time: '1 giờ trước',
                  },
                ].map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 border rounded-lg ${
                      alert.severity === 'high'
                        ? 'border-red-200 bg-red-50'
                        : alert.severity === 'medium'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-gray-200 bg-gray-50'
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
                    <p className='text-sm'>{alert.message}</p>
                    <div className='flex space-x-2 mt-2'>
                      <Button size='sm' variant='outline'>
                        Xem chi tiết
                      </Button>
                      <Button size='sm'>Xử lý</Button>
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
                      <TableHead>Hành động</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>admin1</TableCell>
                      <TableCell>Duyệt địa điểm #123</TableCell>
                      <TableCell>10:30</TableCell>
                      <TableCell>192.168.1.1</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>admin2</TableCell>
                      <TableCell>Khóa user #456</TableCell>
                      <TableCell>09:15</TableCell>
                      <TableCell>192.168.1.2</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>admin1</TableCell>
                      <TableCell>Duyệt rút tiền ₫200K</TableCell>
                      <TableCell>08:45</TableCell>
                      <TableCell>192.168.1.1</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

{
  /* 3️⃣ Location & Event Management */
}
{
  /* <TabsContent value='locations' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='Địa điểm được duyệt'
              value='1,456'
              change='+12 địa điểm mới'
              icon={MapPin}
              color='green'
            />
            <StatsCard
              title='Địa điểm chờ duyệt'
              value='23'
              change='5 mới hôm nay'
              icon={Clock}
              color='orange'
            />
            <StatsCard
              title='Check-in/ngày'
              value='2,847'
              change='+18% so với tuần trước'
              icon={Users}
              color='blue'
            />
            <StatsCard
              title='Sự kiện sắp tới'
              value='89'
              change='15 trong tuần này'
              icon={Calendar}
              color='purple'
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <Map className='h-4 w-4 mr-2' />
                  Heatmap sự kiện nổi bật
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center bg-muted/20 rounded-lg'>
                  <div className='text-center'>
                    <Map className='h-12 w-12 mx-auto text-muted-foreground mb-2' />
                    <p className='text-sm text-muted-foreground'>
                      Bản đồ nhiệt sự kiện
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Khu vực trung tâm có hoạt động cao nhất
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Thống kê sự kiện</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>Sự kiện sắp diễn ra</span>
                    <span>89</span>
                  </div>
                  <Progress value={75} className='h-2' />
                </div>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>Sự kiện đã kết thúc</span>
                    <span>234</span>
                  </div>
                  <Progress value={60} className='h-2' />
                </div>
                <div>
                  <div className='flex justify-between text-sm mb-1'>
                    <span>Tỷ lệ vé bán ra</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className='h-2' />
                </div>
                <div className='pt-2 border-t'>
                  <p className='text-sm font-medium'>Top sự kiện bán chạy:</p>
                  <div className='space-y-1 mt-2'>
                    <p className='text-xs'>• Festival Âm nhạc (95% sold)</p>
                    <p className='text-xs'>• Triển lãm Nghệ thuật (87% sold)</p>
                    <p className='text-xs'>• Workshop Photography (82% sold)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent> */
}

{
  /* 4️⃣ Financial Dashboard */
}
{
  /* <TabsContent value='financial' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
            <StatsCard
              title='Giao dịch hôm nay'
              value='₫2.4M'
              change='+15.3% so với hôm qua'
              icon={CreditCard}
              color='green'
            />
            <StatsCard
              title='Tổng rút tiền'
              value='₫890K'
              change='12 yêu cầu'
              icon={Download}
              color='blue'
            />
            <StatsCard
              title='Tổng nạp tiền'
              value='₫1.8M'
              change='+8.7% so với hôm qua'
              icon={Wallet}
              color='purple'
            />
            <StatsCard
              title='Chờ duyệt rút tiền'
              value='8'
              change='₫450K tổng cộng'
              icon={Clock}
              color='orange'
            />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <TrendingUp className='h-4 w-4 mr-2' />
                  Biểu đồ dòng tiền
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center bg-muted/20 rounded-lg'>
                  <div className='text-center'>
                    <TrendingUp className='h-12 w-12 mx-auto text-muted-foreground mb-2' />
                    <p className='text-sm text-muted-foreground'>
                      Biểu đồ dòng tiền theo ngày
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Xu hướng tăng trưởng ổn định
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu rút tiền chờ duyệt</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ngày yêu cầu</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Nguyễn A</TableCell>
                      <TableCell>₫150K</TableCell>
                      <TableCell>04/11/2024</TableCell>
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
                    <TableRow>
                      <TableCell>Trần B</TableCell>
                      <TableCell>₫200K</TableCell>
                      <TableCell>03/11/2024</TableCell>
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
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trạng thái ví hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-4 border rounded-lg'>
                  <h4 className='font-medium mb-2'>Ví hệ thống</h4>
                  <p className='text-2xl font-bold text-green-600'>₫12.5M</p>
                  <p className='text-xs text-muted-foreground'>
                    Số dư khả dụng
                  </p>
                </div>
                <div className='p-4 border rounded-lg'>
                  <h4 className='font-medium mb-2'>Event Creator</h4>
                  <p className='text-2xl font-bold text-blue-600'>₫3.2M</p>
                  <p className='text-xs text-muted-foreground'>Tổng số dư</p>
                </div>
                <div className='p-4 border rounded-lg'>
                  <h4 className='font-medium mb-2'>Business Owner</h4>
                  <p className='text-2xl font-bold text-purple-600'>₫8.7M</p>
                  <p className='text-xs text-muted-foreground'>Tổng số dư</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */
}
