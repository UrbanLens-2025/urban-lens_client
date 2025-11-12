"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWalletExternalTransactionById } from "@/hooks/wallet/useWalletExternalTransactionById";
import { useWalletInternalTransactionById } from "@/hooks/wallet/useWalletInternalTransactionById";
import { useCancelWithdrawTransaction } from "@/hooks/wallet/useCancelWithdrawTransaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Copy, ExternalLink, CheckCircle2, Clock, XCircle, AlertCircle, Building2, CreditCard, Calendar, DollarSign, Hash, FileText, History, User, Activity, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    COMPLETED: "completed",
    PENDING: "pending",
    FAILED: "failed",
    CANCELLED: "cancelled",
    READY_FOR_PAYMENT: "ready",
    PROCESSING: "processing",
    TRANSFER_FAILED: "failed",
  };
  return statusMap[status?.toUpperCase()] || status?.toLowerCase() || "pending";
}

function getStatusColor(status: string) {
  const normalizedStatus = mapStatus(status);
  switch (normalizedStatus) {
    case "completed":
      return "default";
    case "ready":
    case "processing":
      return "secondary";
    case "failed":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string) {
  const normalizedStatus = mapStatus(status);
  const labelMap: Record<string, string> = {
    completed: "Completed",
    pending: "Pending",
    failed: "Failed",
    cancelled: "Cancelled",
    ready: "Ready for Payment",
    processing: "Processing",
  };
  return labelMap[normalizedStatus] || status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
}

function getStatusIcon(status: string) {
  const normalizedStatus = mapStatus(status);
  switch (normalizedStatus) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "failed":
      return <XCircle className="h-4 w-4" />;
    case "ready":
    case "processing":
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

function getActionIcon(action: string) {
  if (action.includes('CREATE')) return <FileText className="h-4 w-4" />;
  if (action.includes('CONFIRM')) return <CheckCircle2 className="h-4 w-4" />;
  if (action.includes('BALANCE')) return <DollarSign className="h-4 w-4" />;
  if (action.includes('PROCESSING')) return <Activity className="h-4 w-4" />;
  return <History className="h-4 w-4" />;
}

function getActorIcon(actorType: string) {
  if (actorType === 'EXTERNAL_SYSTEM' || actorType === 'SYSTEM') return <Activity className="h-4 w-4" />;
  return <User className="h-4 w-4" />;
}

function getBankName(bankCode: string): string {
  const bankMap: Record<string, string> = {
    VNP: "Vietnam Payment",
    VNB: "Vietcombank",
    TCB: "Techcombank",
    BID: "BIDV",
    ACB: "ACB",
    VCB: "Vietcombank",
    CTG: "Vietinbank",
    NCB: "NCB Bank",
    VNPAY: "VNPay",
  };
  return bankMap[bankCode?.toUpperCase()] || bankCode || "Unknown Bank";
}

export default function BusinessWalletTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = params?.transactionId || "";
  const transactionType = searchParams.get('type') || 'external'; // default to external for backward compatibility

  // Use the appropriate hook based on transaction type
  const externalTransaction = useWalletExternalTransactionById(transactionType === 'external' ? transactionId : null);
  const internalTransaction = useWalletInternalTransactionById(transactionType === 'internal' ? transactionId : null);
  const cancelWithdraw = useCancelWithdrawTransaction();

  const transaction = transactionType === 'internal' ? internalTransaction.data : externalTransaction.data;
  const isLoading = transactionType === 'internal' ? internalTransaction.isLoading : externalTransaction.isLoading;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const isWithdraw = transaction && 'direction' in transaction && transaction.direction?.toUpperCase() === 'WITHDRAW';
  const isPending = transaction && 'status' in transaction && transaction.status?.toUpperCase() === 'PENDING';
  const canCancel = isWithdraw && isPending;

  const handleCancel = () => {
    cancelWithdraw.mutate(transactionId);
    setCancelDialogOpen(false);
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

  const formatCurrency = (amount: number, currency = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 pb-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1 flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
            Transaction Details
          </h1>
          <p className="text-sm text-muted-foreground break-words">
            {transactionType === 'internal' ? 'Internal transaction information' : 'External transaction information'}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="shadow-sm shrink-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading || !transaction ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading transaction details...</p>
              </div>
            </div>
          ) : 'direction' in transaction ? (
            // External transaction
            <div className="space-y-6">
              {/* Amount and Status Card */}
              <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-md">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-3 flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transaction Amount</p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent break-words">
                        {formatCurrency(parseFloat(transaction.amount), transaction.currency)}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={getStatusColor(mapStatus(transaction.status))} className="gap-1.5 px-3 py-1 text-xs font-medium shadow-sm">
                          {getStatusIcon(transaction.status)}
                          {getStatusLabel(transaction.status)}
                        </Badge>
                        <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
                          {transaction.direction?.toUpperCase() === 'DEPOSIT' ? (
                            <>
                              <ArrowDownLeft className="h-3 w-3 text-green-600" />
                              Deposit
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="h-3 w-3 text-orange-600" />
                              Withdrawal
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap shrink-0">
                      {transaction.paymentUrl && transaction.status !== 'COMPLETED' && (
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                          <a href={transaction.paymentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            <span className="hidden sm:inline">Complete Payment</span>
                            <span className="sm:hidden">Pay</span>
                          </a>
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          variant="destructive"
                          onClick={() => setCancelDialogOpen(true)}
                          disabled={cancelWithdraw.isPending}
                          className="shadow-md hover:shadow-lg transition-all"
                        >
                          {cancelWithdraw.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span className="hidden sm:inline">Cancelling...</span>
                              <span className="sm:hidden">...</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Cancel Withdrawal</span>
                              <span className="sm:hidden">Cancel</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Details */}
              <Card className="shadow-sm border">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Hash className="h-5 w-5 text-primary" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Transaction ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-medium flex-1 break-all">{transaction.id}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            onClick={() => copyToClipboard(transaction.id)}
                            title="Copy Transaction ID"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Provider</p>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{transaction.provider || '-'}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Provider Transaction ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-medium flex-1 break-all">{transaction.providerTransactionId || '-'}</p>
                          {transaction.providerTransactionId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                              onClick={() => copyToClipboard(transaction.providerTransactionId!)}
                              title="Copy Provider Transaction ID"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Created At</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{formatDateTime(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Updated At</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{formatDateTime(transaction.updatedAt)}</p>
                        </div>
                      </div>
                      {transaction.expiresAt && (
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Expires At</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{formatDateTime(transaction.expiresAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              {transaction.providerResponse && (
                <Card className="shadow-sm border">
                  <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Building2 className="h-5 w-5 text-primary" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Bank</p>
                          <p className="text-sm font-medium">{getBankName(transaction.providerResponse.vnp_BankCode || transaction.provider || '')}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Bank Transaction Number</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-medium flex-1 break-all">{transaction.providerResponse.vnp_BankTranNo || '-'}</p>
                            {transaction.providerResponse.vnp_BankTranNo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted"
                                onClick={() => copyToClipboard(transaction.providerResponse!.vnp_BankTranNo!)}
                                title="Copy Bank Transaction Number"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">VNPay Transaction Reference</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-medium flex-1 break-all">{transaction.providerResponse.vnp_TxnRef || '-'}</p>
                            {transaction.providerResponse.vnp_TxnRef && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted"
                                onClick={() => copyToClipboard(transaction.providerResponse!.vnp_TxnRef!)}
                                title="Copy VNPay Transaction Reference"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">VNPay Transaction Number</p>
                          <p className="font-mono text-sm font-medium">{transaction.providerResponse.vnp_TransactionNo || '-'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Order Information</p>
                          <p className="text-sm font-medium break-words">{transaction.providerResponse.vnp_OrderInfo || '-'}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Payment Date</p>
                          <p className="text-sm font-medium">
                            {transaction.providerResponse.vnp_PayDate 
                              ? new Date(transaction.providerResponse.vnp_PayDate.toString().replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).toLocaleString()
                              : '-'
                            }
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Response Code</p>
                          <Badge variant={transaction.providerResponse.vnp_ResponseCode === 0 ? "default" : "destructive"} className="font-medium">
                            {transaction.providerResponse.vnp_ResponseCode}
                          </Badge>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Transaction Status</p>
                          <Badge variant={transaction.providerResponse.vnp_TransactionStatus === 0 ? "default" : "destructive"} className="font-medium">
                            {transaction.providerResponse.vnp_TransactionStatus === 0 ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {transaction.paymentUrl && (
                      <div className="mt-6 pt-6 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Payment URL</p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-4 bg-muted/50 rounded-lg border border-border/50">
                          <p className="font-mono text-xs flex-1 break-all font-medium min-w-0">{transaction.paymentUrl}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted shrink-0"
                              onClick={() => copyToClipboard(transaction.paymentUrl!)}
                              title="Copy Payment URL"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="shadow-sm shrink-0"
                            >
                              <a href={transaction.paymentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Withdrawal Bank Info (if available) */}
              {((transaction as any).withdrawBankName || (transaction as any).withdrawBankAccountNumber) && (
                <Card className="shadow-sm border">
                  <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Building2 className="h-5 w-5 text-primary" />
                      Withdrawal Bank Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Bank Name</p>
                        <p className="text-sm font-medium break-words">{(transaction as any).withdrawBankName || '-'}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Account Number</p>
                        <p className="font-mono text-sm font-medium break-all">{(transaction as any).withdrawBankAccountNumber || '-'}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50 min-w-0 sm:col-span-2 md:col-span-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Account Name</p>
                        <p className="text-sm font-medium break-words">{(transaction as any).withdrawBankAccountName || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card className="shadow-sm border">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <History className="h-5 w-5 text-primary" />
                    Transaction Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {transaction.timeline && transaction.timeline.length > 0 ? (
                    <div className="space-y-6">
                      {transaction.timeline.map((e, index) => (
                        <div key={e.id} className="flex gap-4 relative">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3 border-2 border-primary/20 shadow-sm">
                              <div className="text-primary">
                                {getActionIcon(e.action)}
                              </div>
                            </div>
                            {transaction.timeline && index < transaction.timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-gradient-to-b from-border via-border to-transparent mt-2 min-h-[60px]" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 shadow-sm">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge variant={getStatusColor(mapStatus(e.statusChangedTo))} className="gap-1.5 px-2.5 py-1 text-xs font-medium">
                                      {getStatusIcon(e.statusChangedTo)}
                                      {getStatusLabel(e.statusChangedTo)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-medium">{formatDateTime(e.createdAt)}</span>
                                  </div>
                                  <p className="text-sm font-semibold mt-1">{e.action.replace(/_/g, ' ')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                {getActorIcon(e.actorType)}
                                <span className="font-medium">{e.actorName}</span>
                                {e.actorType && (
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {e.actorType.replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>
                              {e.note && (
                                <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border/50">{e.note}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">No timeline events</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            // Internal transaction - show basic info
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-2 border-green-200/50 dark:border-green-800/50 shadow-md">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-3 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transaction Amount</p>
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent break-words">
                      {formatCurrency(parseFloat(transaction.amount), transaction.currency)}
                    </p>
                    <Badge variant={getStatusColor(mapStatus(transaction.status))} className="gap-1.5 px-3 py-1 text-xs font-medium shadow-sm w-fit">
                      {getStatusIcon(transaction.status)}
                      {getStatusLabel(transaction.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Hash className="h-5 w-5 text-primary" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Transaction ID</p>
                        <p className="font-mono text-sm font-medium break-all">{transaction.id}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Type</p>
                        <p className="text-sm font-medium">{transaction.type}</p>
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Status</p>
                        <Badge variant={getStatusColor(mapStatus(transaction.status))} className="font-medium">
                          {getStatusLabel(mapStatus(transaction.status))}
                        </Badge>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Created At</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{formatDateTime(transaction.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Withdrawal Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Cancel Withdrawal Transaction</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              Are you sure you want to cancel this withdrawal transaction? This will move it to CANCELLED status and unlock the funds in your wallet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelWithdraw.isPending}
              className="shadow-sm"
            >
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelWithdraw.isPending}
              className="shadow-md hover:shadow-lg transition-all"
            >
              {cancelWithdraw.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Yes, Cancel Withdrawal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


