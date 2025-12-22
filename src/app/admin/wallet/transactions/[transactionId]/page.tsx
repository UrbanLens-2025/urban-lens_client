'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ArrowLeft,
  Download,
  Upload,
  Calendar,
  CreditCard,
  Building2,
  User,
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  History,
} from 'lucide-react';
import { useAdminExternalTransactionById } from '@/hooks/admin/useAdminExternalTransactionById';
import {
  useStartProcessingWithdraw,
  useCompleteProcessingWithdraw,
  useMarkTransferFailed,
  useRejectWithdrawTransaction,
} from '@/hooks/admin/useAdminTransactionActions';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Play, Ban, AlertTriangle } from 'lucide-react';
import { SingleFileUpload } from '@/components/shared/SingleFileUpload';

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
  return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
};

function getStatusIcon(status: string) {
  const statusUpper = status.toUpperCase();
  if (statusUpper === 'COMPLETED' || statusUpper === 'TRANSFERRED') {
    return <CheckCircle2 className='h-5 w-5 text-green-600' />;
  }
  if (
    statusUpper === 'PENDING' ||
    statusUpper === 'PROCESSING' ||
    statusUpper === 'READY_FOR_PAYMENT'
  ) {
    return <Clock className='h-5 w-5 text-yellow-600' />;
  }
  if (statusUpper === 'TRANSFER_FAILED' || statusUpper === 'REJECTED') {
    return <XCircle className='h-5 w-5 text-red-600' />;
  }
  if (statusUpper === 'CANCELLED') {
    return <AlertCircle className='h-5 w-5 text-gray-600' />;
  }
  return <AlertCircle className='h-5 w-5 text-muted-foreground' />;
}

function getStatusBadge(status: string) {
  const statusUpper = status.toUpperCase();
  const variants: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      label: string;
    }
  > = {
    COMPLETED: { variant: 'default', label: 'Completed' },
    PENDING: { variant: 'secondary', label: 'Pending' },
    READY_FOR_PAYMENT: { variant: 'secondary', label: 'Ready for Payment' },
    PROCESSING: { variant: 'secondary', label: 'Processing' },
    TRANSFERRED: { variant: 'default', label: 'Transferred' },
    TRANSFER_FAILED: { variant: 'destructive', label: 'Transfer Failed' },
    REJECTED: { variant: 'destructive', label: 'Rejected' },
    CANCELLED: { variant: 'outline', label: 'Cancelled' },
  };

  const config = variants[statusUpper] || {
    variant: 'secondary' as const,
    label: status,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getActionIcon(action: string) {
  const actionUpper = action.toUpperCase();
  if (actionUpper.includes('CREATE')) {
    return <CreditCard className='h-4 w-4' />;
  }
  if (actionUpper.includes('CONFIRM') || actionUpper.includes('COMPLETE')) {
    return <CheckCircle2 className='h-4 w-4 text-green-600' />;
  }
  if (actionUpper.includes('FAIL') || actionUpper.includes('REJECT')) {
    return <XCircle className='h-4 w-4 text-red-600' />;
  }
  if (actionUpper.includes('PROCESS') || actionUpper.includes('TRANSFER')) {
    return <Clock className='h-4 w-4 text-yellow-600' />;
  }
  return <History className='h-4 w-4' />;
}

function getActorIcon(actorType: string) {
  const typeUpper = actorType.toUpperCase();
  if (typeUpper.includes('USER') || typeUpper.includes('PRIVATE')) {
    return <User className='h-4 w-4' />;
  }
  if (typeUpper.includes('ADMIN')) {
    return <Building2 className='h-4 w-4' />;
  }
  if (typeUpper.includes('SYSTEM') || typeUpper.includes('EXTERNAL')) {
    return <Landmark className='h-4 w-4' />;
  }
  return <User className='h-4 w-4' />;
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export default function AdminTransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const { transactionId } = use(params);
  const router = useRouter();

  const {
    data: transaction,
    isLoading,
    isError,
  } = useAdminExternalTransactionById(transactionId);

  // Action mutations
  const startProcessing = useStartProcessingWithdraw();
  const completeProcessing = useCompleteProcessingWithdraw();
  const markFailed = useMarkTransferFailed();
  const rejectTransaction = useRejectWithdrawTransaction();

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    description: string;
    requiresReason?: boolean;
    requiresProof?: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    action: '',
    title: '',
    description: '',
    requiresReason: false,
    requiresProof: false,
    onConfirm: () => {},
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [proofOfTransferUrl, setProofOfTransferUrl] = useState<
    string | undefined
  >(undefined);
  const [transferBankTransactionId, setTransferBankTransactionId] =
    useState('');

  const handleStartProcessing = () => {
    setConfirmDialog({
      open: true,
      action: 'start',
      title: 'Start Processing Transaction',
      description:
        'Are you sure you want to start processing this withdrawal transaction? This will move it to PROCESSING status.',
      onConfirm: () => {
        startProcessing.mutate(transactionId);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleCompleteProcessing = () => {
    setProofOfTransferUrl(undefined);
    setTransferBankTransactionId('');
    setConfirmDialog({
      open: true,
      action: 'complete',
      title: 'Complete Processing Transaction',
      description:
        'Are you sure you want to mark this transaction as completed? This will mark it as TRANSFERRED and unlock the funds.',
      requiresProof: true,
      onConfirm: () => {}, // Will be handled by handleConfirmAction
    });
  };

  const handleMarkFailed = () => {
    setFailureReason('');
    setConfirmDialog({
      open: true,
      action: 'failed',
      title: 'Mark Transfer as Failed',
      description:
        'Are you sure you want to mark this transfer as failed? This will move the transaction to TRANSFER_FAILED status and unlock the funds.',
      requiresReason: true,
      onConfirm: () => {}, // Will be handled by handleConfirmAction
    });
  };

  const handleReject = () => {
    setRejectionReason('');
    setConfirmDialog({
      open: true,
      action: 'reject',
      title: 'Reject Transaction',
      description:
        'Are you sure you want to reject this withdrawal transaction? This will move it to REJECTED status and unlock the funds.',
      requiresReason: true,
      onConfirm: () => {}, // Will be handled by handleConfirmAction
    });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'reject') {
      // Read the current state value when the button is clicked
      const currentReason = rejectionReason.trim();
      if (!currentReason) {
        toast.error('Please provide a rejection reason');
        return;
      }
      rejectTransaction.mutate({
        transactionId,
        rejectionReason: currentReason,
      });
      setConfirmDialog({ ...confirmDialog, open: false });
      setRejectionReason('');
    } else if (confirmDialog.action === 'failed') {
      // Read the current state value when the button is clicked
      const currentReason = failureReason.trim();
      if (!currentReason) {
        toast.error('Please provide a failure reason');
        return;
      }
      markFailed.mutate({ transactionId, failureReason: currentReason });
      setConfirmDialog({ ...confirmDialog, open: false });
      setFailureReason('');
    } else if (confirmDialog.action === 'complete') {
      if (!proofOfTransferUrl || !transferBankTransactionId.trim()) {
        toast.error(
          'Please provide proof of transfer and transfer transaction ID'
        );
        return;
      }
      completeProcessing.mutate({
        transactionId,
        proofOfTransferImages: [proofOfTransferUrl],
        transferBankTransactionId: transferBankTransactionId.trim(),
      });
      setConfirmDialog({ ...confirmDialog, open: false });
      setProofOfTransferUrl(undefined);
      setTransferBankTransactionId('');
    } else {
      confirmDialog.onConfirm();
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className='space-y-6 p-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>Transaction Details</h1>
          <Button variant='outline' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
        </div>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center text-destructive'>
              <p className='font-semibold'>
                Failed to load transaction details
              </p>
              <p className='text-sm mt-1'>Please try again later</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isDeposit = transaction.direction.toUpperCase() === 'DEPOSIT';
  const isWithdraw = transaction.direction.toUpperCase() === 'WITHDRAW';
  const statusUpper = transaction.status.toUpperCase();

  // Determine which actions are available based on status and direction
  const canStartProcessing = isWithdraw && statusUpper === 'PENDING';
  const canCompleteProcessing = isWithdraw && statusUpper === 'PROCESSING';
  const canMarkFailed = isWithdraw && statusUpper === 'PROCESSING';
  const canReject = isWithdraw && statusUpper === 'PENDING';

  const isActionLoading =
    startProcessing.isPending ||
    completeProcessing.isPending ||
    markFailed.isPending ||
    rejectTransaction.isPending;

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Transaction Details
          </h1>
          <p className='text-muted-foreground mt-2'>
            External transaction information
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Left Column - Main Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Amount & Status Card */}
          <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800'>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span className='flex items-center gap-2'>
                  {isDeposit ? (
                    <Download className='h-6 w-6 text-green-600' />
                  ) : (
                    <Upload className='h-6 w-6 text-orange-600' />
                  )}
                  {isDeposit ? 'Deposit' : 'Withdrawal'}
                </span>
                {getStatusBadge(transaction.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm text-muted-foreground mb-1'>Amount</p>
                  <p
                    className={`text-4xl font-bold ${
                      isDeposit ? 'text-green-600' : 'text-orange-600'
                    }`}
                  >
                    {isDeposit ? '+' : '-'}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
                <div className='flex items-center gap-2 pt-2 border-t'>
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className='text-sm font-medium'>
                      Status: {transaction.status}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {transaction.status === 'PENDING' &&
                        'Awaiting processing'}
                      {transaction.status === 'COMPLETED' &&
                        'Transaction completed successfully'}
                      {transaction.status === 'TRANSFERRED' &&
                        'Funds transferred'}
                      {transaction.status === 'TRANSFER_FAILED' &&
                        'Transfer failed'}
                      {transaction.status === 'REJECTED' &&
                        'Transaction rejected'}
                      {transaction.status === 'CANCELLED' &&
                        'Transaction cancelled'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Provider Information */}
          {transaction.provider && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  Payment Provider Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Provider
                    </p>
                    <Badge variant='secondary' className='mt-1'>
                      {transaction.provider}
                    </Badge>
                  </div>
                  {transaction.providerTransactionId && (
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Provider Transaction ID
                      </p>
                      <div className='flex items-center gap-2'>
                        <p className='font-mono text-sm flex-1 truncate'>
                          {transaction.providerTransactionId}
                        </p>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            copyToClipboard(transaction.providerTransactionId!)
                          }
                          title='Copy Provider Transaction ID'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  )}
                  {transaction.paymentUrl && (
                    <div className='md:col-span-2'>
                      <p className='text-xs text-muted-foreground mb-2'>
                        Payment URL
                      </p>
                      <div className='flex items-center gap-2'>
                        <p className='font-mono text-xs flex-1 truncate bg-muted p-2 rounded'>
                          {transaction.paymentUrl}
                        </p>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            copyToClipboard(transaction.paymentUrl!)
                          }
                          title='Copy Payment URL'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                        <Button variant='ghost' size='sm' asChild>
                          <a
                            href={transaction.paymentUrl}
                            target='_blank'
                            rel='noreferrer'
                          >
                            <ExternalLink className='h-4 w-4' />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                  {transaction.expiresAt && (
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Expires At
                      </p>
                      <p className='text-sm font-medium flex items-center gap-2 mt-1'>
                        <Clock className='h-4 w-4' />
                        {formatDateTime(transaction.expiresAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdrawal Bank Information */}
          {isWithdraw && transaction.withdrawBankName && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Landmark className='h-5 w-5' />
                  Withdrawal Bank Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Bank Name
                    </p>
                    <p className='text-sm font-medium'>
                      {transaction.withdrawBankName}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Account Number
                    </p>
                    <div className='flex items-center gap-2'>
                      <p className='font-mono text-sm flex-1'>
                        {transaction.withdrawBankAccountNumber}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Account Holder Name
                    </p>
                    <p className='text-sm font-medium'>
                      {transaction.withdrawBankAccountName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {transaction.timeline && transaction.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <History className='h-5 w-5' />
                  Transaction Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {transaction.timeline.map((event, index) => (
                    <div key={event.id} className='flex gap-4'>
                      <div className='flex flex-col items-center'>
                        <div className='rounded-full bg-muted p-2'>
                          {getActionIcon(event.action)}
                        </div>
                        {index < transaction.timeline!.length - 1 && (
                          <div className='w-0.5 h-full bg-muted mt-2' />
                        )}
                      </div>
                      <div className='flex-1 space-y-1 pb-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            {getActorIcon(event.actorType)}
                            <p className='text-sm font-medium'>
                              {event.actorName}
                            </p>
                            <Badge variant='outline' className='text-xs'>
                              {event.actorType}
                            </Badge>
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {formatDateTime(event.createdAt)}
                          </p>
                        </div>
                        <p className='text-sm font-semibold'>
                          {event.action.replace(/_/g, ' ')}
                        </p>
                        <Badge variant='secondary' className='text-xs'>
                          Status: {event.statusChangedTo}
                        </Badge>
                        {event.note && (
                          <p className='text-sm text-muted-foreground mt-1'>
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - User Information */}
        <div className='space-y-6'>
          {/* User Information */}
          {transaction.createdBy && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-4'>
                  {transaction.createdBy.avatarUrl ? (
                    <img
                      src={transaction.createdBy.avatarUrl}
                      alt={`${transaction.createdBy.firstName} ${transaction.createdBy.lastName}`}
                      className='h-16 w-16 rounded-full object-cover border-2'
                    />
                  ) : (
                    <div className='h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2'>
                      <User className='h-8 w-8 text-muted-foreground' />
                    </div>
                  )}
                  <div className='flex-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='font-semibold'>
                        {transaction.createdBy.firstName}{' '}
                        {transaction.createdBy.lastName}
                      </p>
                      <Badge variant='outline' className=''>
                        {transaction.createdBy.role}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {transaction.createdBy.email}
                    </p>
                    {transaction.createdBy.phoneNumber && (
                      <p className='text-sm text-muted-foreground'>
                        {transaction.createdBy.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className='space-y-2 pt-4 border-t'>
                  <div>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Onboarding Status
                    </p>
                    <Badge
                      variant={
                        transaction.createdBy.hasOnboarded
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {transaction.createdBy.hasOnboarded
                        ? 'Onboarded'
                        : 'Not Onboarded'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions */}
          {isWithdraw &&
            (canStartProcessing ||
              canCompleteProcessing ||
              canMarkFailed ||
              canReject) && (
              <Card className='border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5 text-amber-600' />
                    Admin Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {canStartProcessing && (
                    <Button
                      variant='default'
                      className='w-full justify-start bg-blue-600 hover:bg-blue-700'
                      onClick={handleStartProcessing}
                      disabled={isActionLoading}
                    >
                      <Play className='mr-2 h-4 w-4' />
                      Start Processing
                    </Button>
                  )}
                  {canCompleteProcessing && (
                    <Button
                      variant='default'
                      className='w-full justify-start bg-green-600 hover:bg-green-700'
                      onClick={handleCompleteProcessing}
                      disabled={isActionLoading}
                    >
                      <CheckCircle2 className='mr-2 h-4 w-4' />
                      Complete Processing
                    </Button>
                  )}
                  {canMarkFailed && (
                    <Button
                      variant='destructive'
                      className='w-full justify-start'
                      onClick={handleMarkFailed}
                      disabled={isActionLoading}
                    >
                      <XCircle className='mr-2 h-4 w-4' />
                      Mark Transfer Failed
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      variant='destructive'
                      className='w-full justify-start'
                      onClick={handleReject}
                      disabled={isActionLoading}
                    >
                      <Ban className='mr-2 h-4 w-4' />
                      Reject Transaction
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {transaction.createdBy && (
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href={`/admin/users/${transaction.createdBy.id}`}>
                    <User className='mr-2 h-4 w-4' />
                    View User Profile
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ ...confirmDialog, open: false });
            setRejectionReason('');
            setFailureReason('');
            setProofOfTransferUrl(undefined);
            setTransferBankTransactionId('');
          }
        }}
      >
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          {confirmDialog.requiresReason && (
            <div className='space-y-2 py-4'>
              <Label
                htmlFor={
                  confirmDialog.action === 'reject'
                    ? 'rejectionReason'
                    : 'failureReason'
                }
              >
                {confirmDialog.action === 'reject'
                  ? 'Rejection Reason *'
                  : 'Failure Reason *'}
              </Label>
              <Textarea
                id={
                  confirmDialog.action === 'reject'
                    ? 'rejectionReason'
                    : 'failureReason'
                }
                placeholder={
                  confirmDialog.action === 'reject'
                    ? 'Please provide a reason for rejecting this transaction...'
                    : 'Please provide a reason for why the transfer failed...'
                }
                value={
                  confirmDialog.action === 'reject'
                    ? rejectionReason
                    : failureReason
                }
                onChange={(e) => {
                  if (confirmDialog.action === 'reject') {
                    setRejectionReason(e.target.value);
                  } else {
                    setFailureReason(e.target.value);
                  }
                }}
                rows={4}
                className='resize-none'
                disabled={isActionLoading}
              />
              <p className='text-xs text-muted-foreground'>
                This reason will be recorded in the transaction history.
              </p>
            </div>
          )}
          {confirmDialog.requiresProof && (
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
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setConfirmDialog({ ...confirmDialog, open: false });
                setRejectionReason('');
                setFailureReason('');
                setProofOfTransferUrl(undefined);
                setTransferBankTransactionId('');
              }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmDialog.action === 'reject' ||
                confirmDialog.action === 'failed'
                  ? 'destructive'
                  : 'default'
              }
              onClick={handleConfirmAction}
              disabled={
                isActionLoading ||
                (confirmDialog.requiresReason &&
                  confirmDialog.action === 'reject' &&
                  !rejectionReason.trim()) ||
                (confirmDialog.requiresReason &&
                  confirmDialog.action === 'failed' &&
                  !failureReason.trim()) ||
                (confirmDialog.requiresProof &&
                  confirmDialog.action === 'complete' &&
                  (!proofOfTransferUrl || !transferBankTransactionId.trim()))
              }
            >
              {isActionLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
