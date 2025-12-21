'use client';

import type React from 'react';
import { use, useState } from 'react';
import { useEventAttendance } from '@/hooks/events/useEventAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Users,
  Ticket,
  User,
  Mail,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EventAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  // Cập nhật state filter để hỗ trợ tách biệt Cancelled và Refunded
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'checked_in' | 'not_checked_in' | 'cancelled' | 'refunded'
  >('all');
  const limit = 20;

  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    isError,
  } = useEventAttendance(eventId, {
    page: currentPage,
    limit,
    sortBy: 'createdAt:DESC',
  });

  const formatDateTime = (iso: string) => {
    return format(new Date(iso), "MMM dd, yyyy 'at' h:mm a");
  };

  const formatCurrency = (amount: string | number, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getAttendanceStatusVariant = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'CONFIRMED' || s === 'CHECKED_IN' || s === 'ATTENDED')
      return 'default' as const; // Green/Black
    if (s === 'CREATED' || s === 'PENDING') return 'secondary' as const; // Gray
    if (s === 'CANCELLED') return 'destructive' as const; // Red
    if (s === 'REFUNDED') return 'outline' as const; // Outline (hoặc destructive nếu muốn đỏ)
    return 'outline' as const;
  };

  const getAttendanceStatusLabel = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'CREATED') return 'Not Checked In';
    if (s === 'ATTENDED') return 'Checked In';
    // Format lại text cho đẹp (VD: REFUNDED -> Refunded)
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (isLoadingAttendance) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-12 w-12 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isError || !attendanceData) {
    return (
      <div className='text-center py-20 text-red-500'>
        <p className='font-medium'>Error loading attendance data</p>
        <p className='text-sm text-muted-foreground mt-2'>
          Please try refreshing the page
        </p>
      </div>
    );
  }

  const { data: attendances, meta } = attendanceData;

  // Filter at attendance level (per ticket/person)
  const filteredAttendances = attendances.filter((attendance) => {
    const fullName =
      `${attendance.order.createdBy.firstName} ${attendance.order.createdBy.lastName}`.toLowerCase();
    const email = attendance.order.createdBy.email?.toLowerCase() || '';
    const orderNumber = attendance.order.orderNumber?.toLowerCase() || '';
    const query = searchQuery.toLowerCase().trim();

    const matchesQuery =
      !query ||
      fullName.includes(query) ||
      email.includes(query) ||
      orderNumber.includes(query);

    const status = attendance.status?.toUpperCase();


    // Logic lọc trạng thái chi tiết
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'checked_in') {
      matchesStatus =
        status === 'ATTENDED' ||
        status === 'CHECKED_IN' ||
        status === 'CONFIRMED';
    } else if (statusFilter === 'not_checked_in') {
      // Chỉ lấy những vé chưa check-in VÀ chưa bị hủy/refund
      matchesStatus = status === 'CREATED' || status === 'PENDING';
    } else if (statusFilter === 'cancelled') {
      matchesStatus = status === 'CANCELLED';
    } else if (statusFilter === 'refunded') {
      matchesStatus = status === 'REFUNDED';
    }

    return matchesQuery && matchesStatus;
  });

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Attendance Overview
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Monitor individual tickets, check-in status, and cancellations.
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
          <Link href={`/dashboard/creator/events/${eventId}/attendance/scan`}>
            <Button variant='default' size='lg' className='w-full sm:w-auto'>
              <QrCode className='h-4 w-4 mr-2' />
              Scan QR Code
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className='space-y-4'>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle className='flex items-center gap-2'>
              <Ticket className='h-5 w-5' />
              Ticket List
            </CardTitle>
            <Badge variant='outline' className='text-xs px-2 py-1'>
              {filteredAttendances.length} tickets shown
            </Badge>
          </div>

          {/* Controls */}
          <div className='flex flex-col gap-3 md:flex-row md:items-center'>
            <div className='relative flex-1'>
              <Input
                placeholder='Search by name, email or order number...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-3 pr-3'
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className='w-full md:w-[220px]'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All statuses</SelectItem>
                <SelectItem value='checked_in'>Checked In</SelectItem>
                <SelectItem value='not_checked_in'>Not Checked In</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
                <SelectItem value='refunded'>Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttendances.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <Users className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p className='text-lg font-medium'>
                {attendances.length === 0
                  ? 'No tickets yet'
                  : 'No tickets match your filters'}
              </p>
              <p className='text-sm mt-1'>
                {attendances.length === 0
                  ? 'Tickets will appear here once purchased.'
                  : 'Try clearing the search or changing the status filter.'}
              </p>
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-border/60'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead className='w-[180px]'>
                      Order & Ticket ID
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendances.map((attendance) => {
                    const ticketName =
                      attendance.ticketSnapshot?.displayName ||
                      'Unknown Ticket';
                    const price = attendance.ticketSnapshot?.price || 0;
                    const currency = attendance.order.currency || 'VND';

                    return (
                      <TableRow
                        key={attendance.id}
                        className='hover:bg-muted/20'
                      >
                        <TableCell>
                          <div className='space-y-1'>
                            <div className='font-semibold text-sm'>
                              {attendance.order.orderNumber.slice(0, 16)}...
                            </div>
                            <div className='flex items-center gap-1 text-xs text-muted-foreground font-mono'>
                              <Ticket className='h-3 w-3' />
                              {attendance.id.slice(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            {attendance.order.createdBy.avatarUrl ? (
                              <Image
                                src={attendance.order.createdBy.avatarUrl}
                                alt={attendance.order.createdBy.firstName}
                                width={32}
                                height={32}
                                className='rounded-full border'
                              />
                            ) : (
                              <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border'>
                                <User className='h-4 w-4 text-primary' />
                              </div>
                            )}
                            <div>
                              <div className='font-medium text-sm'>
                                {attendance.order.createdBy.firstName}{' '}
                                {attendance.order.createdBy.lastName}
                              </div>
                              <div className='text-xs text-muted-foreground flex items-center gap-1'>
                                <Mail className='h-3 w-3' />
                                {attendance.order.createdBy.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='font-normal'>
                            {ticketName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='font-medium text-sm'>
                            {formatCurrency(price, currency)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getAttendanceStatusVariant(
                              attendance.status
                            )}
                          >
                          <Badge
                            variant={getAttendanceStatusVariant(
                              attendance.status
                            )}
                          >
                            {getAttendanceStatusLabel(attendance.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm text-muted-foreground'>
                            {attendance.checkedInAt ? (
                              <span className='text-green-600 font-medium'>
                                {formatDateTime(attendance.checkedInAt)}
                              </span>
                            ) : (
                              <span>-</span>
                              <span>-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={attendance.status?.toUpperCase() !== "CREATED"}
                                onClick={() => {
                                  setSelectedAttendance({
                                    id: attendance.id,
                                    orderId: attendance.order.id,
                                    ownerName: `${attendance.order.createdBy.firstName} ${attendance.order.createdBy.lastName}`,
                                  });
                                  setIsCheckInDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Check In
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className='flex items-center justify-between mt-6 pt-6 border-t'>
              <div className='text-sm text-muted-foreground'>
                Showing {(currentPage - 1) * limit + 1} to{' '}
                {Math.min(currentPage * limit, meta.totalItems)} of{' '}
                {meta.totalItems} tickets
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                  Previous
                </Button>
                <div className='text-sm text-muted-foreground px-2'>
                  Page {currentPage} of {meta.totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={currentPage === meta.totalPages}
                >
                  Next
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check In Confirmation Dialog */}
      <AlertDialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check In</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check in {selectedAttendance?.ownerName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedAttendance) {
                  confirmAttendance(
                    {
                      eventAttendanceIds: [selectedAttendance.id],
                      ticketOrderId: selectedAttendance.orderId,
                    },
                    {
                      onSuccess: () => {
                        setIsCheckInDialogOpen(false);
                        setSelectedAttendance(null);
                      },
                    }
                  );
                }
              }}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                "Check In"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

