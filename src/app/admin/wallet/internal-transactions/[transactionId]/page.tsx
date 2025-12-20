'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAdminInternalWalletTransactionById } from '@/hooks/admin/useAdminInternalWalletTransactionById';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Hash,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: string, currency = 'VND') {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(num);
}

function getStatusVariant(status: string) {
  const upper = (status || '').toUpperCase();
  if (upper === 'COMPLETED') return 'default' as const;
  if (upper === 'PENDING') return 'secondary' as const;
  if (upper === 'FAILED' || upper === 'CANCELLED')
    return 'destructive' as const;
  return 'outline' as const;
}

function getTypeLabel(type: string) {
  const t = (type || '').toUpperCase();
  if (t === 'TO_ESCROW') return 'Transfer to escrow';
  if (t === 'FROM_ESCROW') return 'Transfer from escrow';
  return type || 'Internal transfer';
}

export default function AdminInternalWalletTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const router = useRouter();
  const transactionId = params?.transactionId || '';

  const {
    data: transaction,
    isLoading,
    isError,
    error,
  } = useAdminInternalWalletTransactionById(transactionId);

  return (
    <PageContainer>
      <div className='flex items-center justify-between mb-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => router.back()}
          className='shadow-sm'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
      </div>

      <Card className='shadow-md border'>
        <CardHeader className='border-b bg-muted/20 py-3 flex flex-row items-center justify-between gap-4'>
          <div>
            <CardTitle className='text-base font-semibold flex items-center gap-2'>
              <Activity className='h-4 w-4 text-primary' />
              Internal transaction overview
            </CardTitle>
            <CardDescription>
              Read-only details for a single internal wallet movement.
            </CardDescription>
          </div>
          {transaction && (
            <Badge variant={getStatusVariant(transaction.status)}>
              {transaction.status}
            </Badge>
          )}
        </CardHeader>
        <CardContent className='pt-4 space-y-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-16 text-sm text-muted-foreground'>
              Loading transaction details...
            </div>
          ) : isError ? (
            <div className='py-8 text-sm text-destructive'>
              {error instanceof Error
                ? error.message
                : 'Failed to load transaction details.'}
            </div>
          ) : !transaction ? (
            <div className='py-8 text-sm text-muted-foreground'>
              Transaction not found.
            </div>
          ) : (
            <>
              {/* Highlighted amount & type */}
              <Card className='bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/50 dark:border-blue-800/60 shadow-sm'>
                <CardContent className='py-4'>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <div className='space-y-2'>
                      <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                        Transaction amount
                      </p>
                      <p className='text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent'>
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency
                        )}
                      </p>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge variant={getStatusVariant(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <Badge
                          variant='outline'
                          className='gap-1 px-2 py-0.5 text-xs'
                        >
                          {transaction.type?.toUpperCase() === 'TO_ESCROW' ? (
                            <>
                              <ArrowDownRight className='h-3 w-3 text-emerald-600' />
                              To escrow
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className='h-3 w-3 text-sky-600' />
                              From escrow
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className='text-xs text-muted-foreground space-y-1 md:text-right'>
                      <p>
                        <span className='font-medium'>Created:&nbsp;</span>
                        {formatDateTime(transaction.createdAt)}
                      </p>
                      <p>
                        <span className='font-medium'>Currency:&nbsp;</span>
                        {transaction.currency}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details & note */}
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-3'>
                  <div className='p-3 rounded-lg bg-muted/30 border border-border/50'>
                    <p className='text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide'>
                      Transaction ID
                    </p>
                    <div className='flex items-start gap-2'>
                      <Hash className='h-3.5 w-3.5 mt-0.5 text-muted-foreground' />
                      <p className='font-mono text-xs break-all flex-1'>
                        {transaction.id}
                      </p>
                    </div>
                  </div>
                  <div className='p-3 rounded-lg bg-muted/30 border border-border/50'>
                    <p className='text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide'>
                      Type
                    </p>
                    <div className='flex items-center gap-2'>
                      <Wallet className='h-3.5 w-3.5 text-muted-foreground' />
                      <span className='text-xs font-medium'>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='p-3 rounded-lg bg-muted/30 border border-border/50'>
                    <p className='text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide'>
                      Raw status
                    </p>
                    <p className='text-xs font-medium'>{transaction.status}</p>
                  </div>
                  <div className='p-3 rounded-lg bg-muted/30 border border-border/50'>
                    <p className='text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide'>
                      Note
                    </p>
                    <p className='text-xs'>
                      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (transaction as any).note ||
                        'No additional note for this transaction.'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
