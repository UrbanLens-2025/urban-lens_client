'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';
import { toast } from 'sonner';

import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SingleFileUpload } from '@/components/shared/SingleFileUpload';
import {
  Loader2,
  Upload,
  Search,
  RefreshCw,
  User,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  Play,
  Ban,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { useAdminExternalTransactions } from '@/hooks/admin/useAdminExternalTransactions';
import {
  useStartProcessingWithdraw,
  useCompleteProcessingWithdraw,
  useMarkTransferFailed,
  useRejectWithdrawTransaction,
} from '@/hooks/admin/useAdminTransactionActions';
import { useQueryClient } from '@tanstack/react-query';
import type { WalletExternalTransaction } from '@/types';
import { formatDateTime } from '@/lib/utils';

const formatCurrency = (amount: string, currency: string = 'VND') => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
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

export default function AdminWithdrawRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'pending'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const itemsPerPage = 10;

  // Dialog states
  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletExternalTransaction | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'start' | 'complete' | 'reject' | 'failed';
    transaction: WalletExternalTransaction | null;
  }>({
    open: false,
    action: 'start',
    transaction: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [proofOfTransferUrl, setProofOfTransferUrl] = useState<
    string | undefined
  >(undefined);
  const [transferBankTransactionId, setTransferBankTransactionId] =
    useState('');

  // Mutations
  const startProcessing = useStartProcessingWithdraw();
  const completeProcessing = useCompleteProcessingWithdraw();
  const markFailed = useMarkTransferFailed();
  const rejectTransaction = useRejectWithdrawTransaction();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();

    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    } else {
      params.delete('search');
    }

    if (statusFilter !== 'pending') {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusFilter, page, pathname, router, searchParams]);

  // Fetch transactions - filter for WITHDRAW direction only
  const {
    data: transactionsData,
    isLoading,
    isFetching,
  } = useAdminExternalTransactions({
    page,
    limit: itemsPerPage,
    sortBy: 'createdAt:DESC',
  });

  const allTransactions = transactionsData?.data || [];

  // Filter for withdraw transactions only
  const withdrawTransactions = useMemo(() => {
    return allTransactions.filter(
      (t: WalletExternalTransaction) => t.direction.toUpperCase() === 'WITHDRAW'
    );
  }, [allTransactions]);

  // Filter by status and search
  const filteredTransactions = useMemo(() => {
    return withdrawTransactions.filter((t: WalletExternalTransaction) => {
      // Status filter
      const statusUpper = t.status.toUpperCase();
      if (statusFilter === 'pending') {
        if (!['PENDING', 'READY_FOR_PAYMENT'].includes(statusUpper))
          return false;
      } else if (statusFilter === 'processing') {
        if (statusUpper !== 'PROCESSING') return false;
      } else if (statusFilter !== 'all') {
        if (statusUpper !== statusFilter.toUpperCase()) return false;
      }

      // Search filter
      if (debouncedSearchTerm) {
        const query = debouncedSearchTerm.toLowerCase();
        const searchableText = [
          t.id,
          t.createdBy?.email,
          t.createdBy?.firstName,
          t.createdBy?.lastName,
          t.amount,
          t.withdrawBankName,
          t.withdrawBankAccountNumber,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      return true;
    });
  }, [withdrawTransactions, statusFilter, debouncedSearchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = withdrawTransactions.filter(
      (t: WalletExternalTransaction) =>
        ['PENDING', 'READY_FOR_PAYMENT'].includes(t.status.toUpperCase())
    ).length;
    const processing = withdrawTransactions.filter(
      (t: WalletExternalTransaction) => t.status.toUpperCase() === 'PROCESSING'
    ).length;
    const totalAmount = withdrawTransactions
      .filter((t: WalletExternalTransaction) =>
        ['PENDING', 'READY_FOR_PAYMENT', 'PROCESSING'].includes(
          t.status.toUpperCase()
        )
      )
      .reduce(
        (sum: number, t: WalletExternalTransaction) =>
          sum + parseFloat(t.amount),
        0
      );
    const completed = withdrawTransactions.filter(
      (t: WalletExternalTransaction) =>
        ['COMPLETED', 'TRANSFERRED'].includes(t.status.toUpperCase())
    ).length;

    return { pending, processing, totalAmount, completed };
  }, [withdrawTransactions]);

  const handleStartProcessing = (transaction: WalletExternalTransaction) => {
    setActionDialog({
      open: true,
      action: 'start',
      transaction,
    });
  };

  const handleCompleteProcessing = (transaction: WalletExternalTransaction) => {
    setProofOfTransferUrl(undefined);
    setTransferBankTransactionId('');
    setActionDialog({
      open: true,
      action: 'complete',
      transaction,
    });
  };

  const handleReject = (transaction: WalletExternalTransaction) => {
    setRejectionReason('');
    setActionDialog({
      open: true,
      action: 'reject',
      transaction,
    });
  };

  const handleMarkFailed = (transaction: WalletExternalTransaction) => {
    setFailureReason('');
    setActionDialog({
      open: true,
      action: 'failed',
      transaction,
    });
  };

  const handleConfirmAction = () => {
    if (!actionDialog.transaction) return;

    const transactionId = actionDialog.transaction.id;

    if (actionDialog.action === 'start') {
      startProcessing.mutate(transactionId, {
        onSuccess: () => {
          setActionDialog({ open: false, action: 'start', transaction: null });
          queryClient.invalidateQueries({
            queryKey: ['adminExternalTransactions'],
          });
        },
      });
    } else if (actionDialog.action === 'reject') {
      if (!rejectionReason.trim()) {
        toast.error('Please provide a rejection reason');
        return;
      }
      rejectTransaction.mutate(
        { transactionId, rejectionReason: rejectionReason.trim() },
        {
          onSuccess: () => {
            setActionDialog({
              open: false,
              action: 'reject',
              transaction: null,
            });
            setRejectionReason('');
            queryClient.invalidateQueries({
              queryKey: ['adminExternalTransactions'],
            });
          },
        }
      );
    } else if (actionDialog.action === 'failed') {
      if (!failureReason.trim()) {
        toast.error('Please provide a failure reason');
        return;
      }
      markFailed.mutate(
        { transactionId, failureReason: failureReason.trim() },
        {
          onSuccess: () => {
            setActionDialog({
              open: false,
              action: 'failed',
              transaction: null,
            });
            setFailureReason('');
            queryClient.invalidateQueries({
              queryKey: ['adminExternalTransactions'],
            });
          },
        }
      );
    } else if (actionDialog.action === 'complete') {
      if (!proofOfTransferUrl || !transferBankTransactionId.trim()) {
        toast.error(
          'Please provide proof of transfer and transfer transaction ID'
        );
        return;
      }
      completeProcessing.mutate(
        {
          transactionId,
          proofOfTransferImages: [proofOfTransferUrl],
          transferBankTransactionId: transferBankTransactionId.trim(),
        },
        {
          onSuccess: () => {
            setActionDialog({
              open: false,
              action: 'complete',
              transaction: null,
            });
            setProofOfTransferUrl(undefined);
            setTransferBankTransactionId('');
            queryClient.invalidateQueries({
              queryKey: ['adminExternalTransactions'],
            });
          },
        }
      );
    }
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminExternalTransactions'] });
  };

  const isActionLoading =
    startProcessing.isPending ||
    completeProcessing.isPending ||
    markFailed.isPending ||
    rejectTransaction.isPending;

  return (
    <PageContainer maxWidth='full'>
      {/* Statistics Cards */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Pending Requests'
          value={stats.pending.toString()}
          icon={Clock}
          color='amber'
        />
        <StatCard
          title='Processing'
          value={stats.processing.toString()}
          icon={Play}
          color='blue'
        />
        <StatCard
          title='Total Amount'
          value={formatCurrency(stats.totalAmount.toString(), 'VND')}
          icon={DollarSign}
          color='green'
        />
        <StatCard
          title='Completed'
          value={stats.completed.toString()}
          icon={CheckCircle2}
          color='purple'
        />
      </div>

      {/* Filters */}
      <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
        <CardHeader className='pb-4 border-b border-primary/10'>
          <CardTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5' />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by ID, user, amount, or bank info...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 border-2 border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/20'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='border-2 border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/20'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='pending'>Pending & Ready</SelectItem>
                <SelectItem value='processing'>Processing</SelectItem>
                <SelectItem value='COMPLETED'>Completed</SelectItem>
                <SelectItem value='TRANSFERRED'>Transferred</SelectItem>
                <SelectItem value='REJECTED'>Rejected</SelectItem>
                <SelectItem value='TRANSFER_FAILED'>Transfer Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
        <CardHeader className='pb-4 border-b border-primary/10'>
          <CardTitle>Withdraw Requests</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading...'
              : `Showing ${filteredTransactions.length} withdraw request${
                  filteredTransactions.length !== 1 ? 's' : ''
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-20'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className='text-center py-20 text-muted-foreground'>
              <p className='font-medium'>No withdraw requests found</p>
              <p className='text-sm mt-1'>Try adjusting your filters</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredTransactions.map(
                (transaction: WalletExternalTransaction) => {
                  const statusUpper = transaction.status.toUpperCase();
                  const canStartProcessing =
                    statusUpper === 'PENDING' ||
                    statusUpper === 'READY_FOR_PAYMENT';
                  const canCompleteProcessing = statusUpper === 'PROCESSING';
                  const canMarkFailed = statusUpper === 'PROCESSING';
                  const canReject =
                    statusUpper === 'PENDING' ||
                    statusUpper === 'READY_FOR_PAYMENT';

                  return (
                    <Card
                      key={transaction.id}
                      className='border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg'
                    >
                      <CardContent className='p-6'>
                        <div className='flex flex-col lg:flex-row gap-6'>
                          {/* Left: Transaction Info */}
                          <div className='flex-1 space-y-4'>
                            <div className='flex items-start justify-between'>
                              <div className='space-y-2'>
                                <div className='flex items-center gap-3'>
                                  <div className='p-2 rounded-lg bg-primary/10'>
                                    <CreditCard className='h-5 w-5 text-primary' />
                                  </div>
                                  <div>
                                    <div className='flex items-center gap-2'>
                                      <span className='font-mono text-sm text-muted-foreground'>
                                        {transaction.id.slice(0, 8)}...
                                      </span>
                                      {getStatusBadge(transaction.status)}
                                    </div>
                                    <p className='text-xs text-muted-foreground mt-1'>
                                      {formatDateTime(transaction.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className='text-right'>
                                <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                                  -
                                  {formatCurrency(
                                    transaction.amount,
                                    transaction.currency
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* User Info */}
                            {transaction.createdBy && (
                              <div className='flex items-center gap-3 pt-4 border-t border-primary/10'>
                                {transaction.createdBy.avatarUrl ? (
                                  <img
                                    src={transaction.createdBy.avatarUrl}
                                    alt={transaction.createdBy.firstName}
                                    className='h-10 w-10 rounded-full object-cover'
                                  />
                                ) : (
                                  <div className='h-10 w-10 rounded-full bg-muted flex items-center justify-center'>
                                    <User className='h-5 w-5' />
                                  </div>
                                )}
                                <div className='flex-1 min-w-0'>
                                  <p className='font-medium truncate'>
                                    {transaction.createdBy.firstName}{' '}
                                    {transaction.createdBy.lastName}
                                  </p>
                                  <p className='text-sm text-muted-foreground truncate'>
                                    {transaction.createdBy.email}
                                  </p>
                                  <Badge
                                    variant='outline'
                                    className='text-xs mt-1'
                                  >
                                    {transaction.createdBy.role}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {/* Bank Info */}
                            {transaction.withdrawBankName && (
                              <div className='pt-4 border-t border-primary/10 space-y-2'>
                                <div className='flex items-center gap-2'>
                                  <AlertCircle className='h-4 w-4 text-muted-foreground' />
                                  <p className='text-sm font-semibold'>
                                    Bank Information
                                  </p>
                                </div>
                                <div className='grid grid-cols-2 gap-4 text-sm'>
                                  <div>
                                    <p className='text-xs text-muted-foreground'>
                                      Bank Name
                                    </p>
                                    <p className='font-medium'>
                                      {transaction.withdrawBankName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className='text-xs text-muted-foreground'>
                                      Account Number
                                    </p>
                                    <p className='font-mono font-medium'>
                                      {transaction.withdrawBankAccountNumber}
                                    </p>
                                  </div>
                                  <div className='col-span-2'>
                                    <p className='text-xs text-muted-foreground'>
                                      Account Holder
                                    </p>
                                    <p className='font-medium'>
                                      {transaction.withdrawBankAccountName}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className='lg:w-64 space-y-2'>
                            <div className='flex flex-col gap-2'>
                              {canStartProcessing && (
                                <Button
                                  variant='default'
                                  size='sm'
                                  className='w-full bg-blue-600 hover:bg-blue-700'
                                  onClick={() =>
                                    handleStartProcessing(transaction)
                                  }
                                  disabled={isActionLoading}
                                >
                                  <Play className='h-4 w-4 mr-2' />
                                  Start Processing
                                </Button>
                              )}
                              {canCompleteProcessing && (
                                <Button
                                  variant='default'
                                  size='sm'
                                  className='w-full bg-green-600 hover:bg-green-700'
                                  onClick={() =>
                                    handleCompleteProcessing(transaction)
                                  }
                                  disabled={isActionLoading}
                                >
                                  <CheckCircle2 className='h-4 w-4 mr-2' />
                                  Complete
                                </Button>
                              )}
                              {canMarkFailed && (
                                <Button
                                  variant='destructive'
                                  size='sm'
                                  className='w-full'
                                  onClick={() => handleMarkFailed(transaction)}
                                  disabled={isActionLoading}
                                >
                                  <XCircle className='h-4 w-4 mr-2' />
                                  Mark Failed
                                </Button>
                              )}
                              {canReject && (
                                <Button
                                  variant='destructive'
                                  size='sm'
                                  className='w-full'
                                  onClick={() => handleReject(transaction)}
                                  disabled={isActionLoading}
                                >
                                  <Ban className='h-4 w-4 mr-2' />
                                  Reject
                                </Button>
                              )}
                              <Button
                                variant='outline'
                                size='sm'
                                className='w-full'
                                asChild
                              >
                                <Link
                                  href={`/admin/wallet/transactions/${transaction.id}`}
                                >
                                  <ExternalLink className='h-4 w-4 mr-2' />
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredTransactions.length > 0 && (
            <div className='flex items-center justify-between mt-6 pt-4 border-t border-primary/10'>
              <div className='text-sm text-muted-foreground'>
                Page {page} ({filteredTransactions.length} requests)
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className='border-2 border-primary/20 hover:border-primary/40'
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage((p) => p + 1)}
                  disabled={
                    filteredTransactions.length < itemsPerPage || isLoading
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

      {/* Action Dialogs */}
      {/* Start Processing Dialog */}
      <AlertDialog
        open={actionDialog.open && actionDialog.action === 'start'}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({
              open: false,
              action: 'start',
              transaction: null,
            });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Processing Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start processing this withdrawal
              transaction? This will move it to PROCESSING status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isActionLoading}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {isActionLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Start Processing'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog
        open={actionDialog.open && actionDialog.action === 'reject'}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({
              open: false,
              action: 'reject',
              transaction: null,
            });
            setRejectionReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this withdrawal transaction? This
              will move it to REJECTED status and unlock the funds.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='rejectionReason'>Rejection Reason *</Label>
              <Textarea
                id='rejectionReason'
                placeholder='Please provide a reason for rejecting this transaction...'
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className='resize-none'
                disabled={isActionLoading}
              />
              <p className='text-xs text-muted-foreground'>
                This reason will be recorded in the transaction history and
                visible to the user.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setActionDialog({
                  open: false,
                  action: 'reject',
                  transaction: null,
                });
                setRejectionReason('');
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmAction}
              disabled={isActionLoading || !rejectionReason.trim()}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Reject Transaction'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Failed Dialog */}
      <Dialog
        open={actionDialog.open && actionDialog.action === 'failed'}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({
              open: false,
              action: 'failed',
              transaction: null,
            });
            setFailureReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Transfer as Failed</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this transfer as failed? This will
              move the transaction to TRANSFER_FAILED status and unlock the
              funds.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='failureReason'>Failure Reason *</Label>
              <Textarea
                id='failureReason'
                placeholder='Please provide a reason for why the transfer failed...'
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                rows={4}
                className='resize-none'
                disabled={isActionLoading}
              />
              <p className='text-xs text-muted-foreground'>
                This reason will be recorded in the transaction history and
                visible to the user.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setActionDialog({
                  open: false,
                  action: 'failed',
                  transaction: null,
                });
                setFailureReason('');
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmAction}
              disabled={isActionLoading || !failureReason.trim()}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Mark as Failed'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Processing Dialog */}
      <Dialog
        open={actionDialog.open && actionDialog.action === 'complete'}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({
              open: false,
              action: 'complete',
              transaction: null,
            });
            setProofOfTransferUrl(undefined);
            setTransferBankTransactionId('');
          }
        }}
      >
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Complete Processing Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this transaction as completed? This
              will mark it as TRANSFERRED and unlock the funds.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='proofOfTransfer'>Proof of Transfer *</Label>
              <p className='text-xs text-muted-foreground mb-2'>
                Upload an image showing the transfer success message from the
                bank
              </p>
              <SingleFileUpload
                value={proofOfTransferUrl}
                onChange={(url) => setProofOfTransferUrl(url)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='transferBankTransactionId'>
                Transfer Transaction ID *
              </Label>
              <Input
                id='transferBankTransactionId'
                placeholder='Enter the bank transfer transaction ID'
                value={transferBankTransactionId}
                onChange={(e) => setTransferBankTransactionId(e.target.value)}
                disabled={isActionLoading}
              />
              <p className='text-xs text-muted-foreground'>
                Enter the transaction ID from your bank transfer confirmation
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setActionDialog({
                  open: false,
                  action: 'complete',
                  transaction: null,
                });
                setProofOfTransferUrl(undefined);
                setTransferBankTransactionId('');
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                isActionLoading ||
                !proofOfTransferUrl ||
                !transferBankTransactionId.trim()
              }
              className='bg-green-600 hover:bg-green-700'
            >
              {isActionLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Complete Processing
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
