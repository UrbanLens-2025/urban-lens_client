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
  BarChart3,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowRight,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const summaryCards = [
  {
    title: 'Người dùng',
    value: 12540,
    delta: 12.5,
    trend: 'up',
    icon: Users,
    description: 'Tăng so với 7 ngày trước',
  },
  {
    title: 'Locations',
    value: 842,
    delta: 3.1,
    trend: 'up',
    icon: MapPin,
    description: 'Điểm đang hiển thị',
  },
  {
    title: 'Events',
    value: 312,
    delta: -1.8,
    trend: 'down',
    icon: Calendar,
    description: 'Sự kiện sắp diễn ra',
  },
  {
    title: 'Tổng số dư ví',
    value: 1850000000,
    delta: 4.2,
    trend: 'up',
    icon: DollarSign,
    description: 'System + Escrow',
  },
];
const userGrowthData = [
  { day: 'T2', users: 120 },
  { day: 'T3', users: 180 },
  { day: 'T4', users: 150 },
  { day: 'T5', users: 210 },
  { day: 'T6', users: 260 },
  { day: 'T7', users: 190 },
  { day: 'CN', users: 230 },
];
const revenueData = [
  { day: 'T2', deposit: 320_000_000, withdraw: 180_000_000 },
  { day: 'T3', deposit: 410_000_000, withdraw: 220_000_000 },
  { day: 'T4', deposit: 380_000_000, withdraw: 190_000_000 },
  { day: 'T5', deposit: 450_000_000, withdraw: 250_000_000 },
  { day: 'T6', deposit: 520_000_000, withdraw: 310_000_000 },
  { day: 'T7', deposit: 480_000_000, withdraw: 260_000_000 },
  { day: 'CN', deposit: 500_000_000, withdraw: 280_000_000 },
];
const locationEventData = [
  { label: 'Tháng 1', locations: 60, events: 22 },
  { label: 'Tháng 2', locations: 68, events: 28 },
  { label: 'Tháng 3', locations: 75, events: 25 },
  { label: 'Tháng 4', locations: 82, events: 31 },
  { label: 'Tháng 5', locations: 90, events: 34 },
  { label: 'Tháng 6', locations: 97, events: 40 },
];
const recentReports = [
  {
    id: '1',
    type: 'post',
    title: 'Nội dung không phù hợp',
    reporter: 'Nguyễn Văn A',
    target: 'Post #1234',
    status: 'PENDING',
    createdAt: '2 giờ trước',
  },
  {
    id: '2',
    type: 'location',
    title: 'Thông tin địa điểm sai',
    reporter: 'Trần Thị B',
    target: 'Location: Quán cà phê ABC',
    status: 'PENDING',
    createdAt: '5 giờ trước',
  },
  {
    id: '3',
    type: 'event',
    title: 'Sự kiện vi phạm quy định',
    reporter: 'Lê Văn C',
    target: 'Event: Workshop Marketing',
    status: 'RESOLVED',
    createdAt: '1 ngày trước',
  },
  {
    id: '4',
    type: 'post',
    title: 'Spam hoặc lừa đảo',
    reporter: 'Phạm Thị D',
    target: 'Post #5678',
    status: 'PENDING',
    createdAt: '2 ngày trước',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className='space-y-8 pb-10'>
      {/* Summary */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {summaryCards.map((card) => (
          <Card key={card.title} className='hover:shadow-md transition-shadow'>
            <CardContent className='p-5'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>{card.title}</p>
                  <p className='text-3xl font-bold'>
                    {card.title === 'Tổng số dư ví'
                      ? formatCurrency(card.value)
                      : card.value.toLocaleString()}
                  </p>
                  <div className='flex items-center gap-2 text-sm'>
                    {card.trend === 'up' ? (
                      <TrendingUp className='h-4 w-4 text-green-600' />
                    ) : (
                      <TrendingDown className='h-4 w-4 text-red-600' />
                    )}
                    <span
                      className={
                        card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {card.delta > 0 ? `+${card.delta}%` : `${card.delta}%`}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {card.description}
                    </span>
                  </div>
                </div>
                <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center'>
                  <card.icon className='h-5 w-5 text-muted-foreground' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts */}
      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Tăng trưởng người dùng (7 ngày)
            </CardTitle>
            <CardDescription>Lượt đăng ký mới mỗi ngày</CardDescription>
          </CardHeader>
          <CardContent className='h-[320px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='day' tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <RechartsTooltip
                  formatter={(val: number) => `${val} user`}
                  labelFormatter={(label) => `Ngày ${label}`}
                />
                <Line
                  type='monotone'
                  dataKey='users'
                  stroke='var(--primary)'
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5' />
              Dòng tiền ví (7 ngày)
            </CardTitle>
            <CardDescription>Nạp / Rút theo ngày</CardDescription>
          </CardHeader>
          <CardContent className='h-[320px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='day' tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <RechartsTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Ngày ${label}`}
                />
                <Legend />
                <Bar
                  dataKey='deposit'
                  name='Nạp'
                  fill='var(--primary)'
                  radius={6}
                />
                <Bar
                  dataKey='withdraw'
                  name='Rút'
                  fill='hsl(var(--chart-2))'
                  radius={6}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Locations & Events */}
      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle>Locations vs Events (6 tháng)</CardTitle>
            <CardDescription>Xu hướng tạo mới</CardDescription>
          </CardHeader>
          <CardContent className='h-[320px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={locationEventData}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='label' tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <RechartsTooltip />
                <Legend />
                <Bar
                  dataKey='locations'
                  name='Locations'
                  fill='var(--primary)'
                  radius={6}
                />
                <Bar
                  dataKey='events'
                  name='Events'
                  fill='hsl(var(--chart-3))'
                  radius={6}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-1'>
            <CardTitle className='flex items-center gap-2'>
              <Flag className='h-5 w-5' />
              Report gần đây
            </CardTitle>
            <CardDescription>Các báo cáo mới nhất cần xử lý</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {recentReports.map((report) => (
              <Link href={`/admin/reports`} key={report.id} className='block'>
                <div className='flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors'>
                  <div
                    className={`mt-1 p-1.5 rounded ${
                      report.status === 'PENDING'
                        ? 'bg-orange-100 dark:bg-orange-950'
                        : 'bg-green-100 dark:bg-green-950'
                    }`}
                  >
                    {report.status === 'PENDING' ? (
                      <AlertTriangle className='h-4 w-4 text-orange-600 dark:text-orange-400' />
                    ) : (
                      <Flag className='h-4 w-4 text-green-600 dark:text-green-400' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-sm truncate'>
                      {report.title}
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      {report.target}
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                      <span className='text-xs text-muted-foreground'>
                        {report.reporter}
                      </span>
                      <span className='text-xs text-muted-foreground'>·</span>
                      <span className='text-xs text-muted-foreground'>
                        {report.createdAt}
                      </span>
                    </div>
                  </div>
                  <div className='mt-1'>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        report.status === 'PENDING'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                      }`}
                    >
                      {report.status === 'PENDING' ? 'Chờ xử lý' : 'Đã xử lý'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            <Link href='/admin/reports'>
              <Button variant='outline' className='w-full mt-2'>
                Xem tất cả reports
                <ArrowRight className='h-4 w-4 ml-2' />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
