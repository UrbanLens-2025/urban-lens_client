"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWalletInternalTransactionById } from "@/hooks/wallet/useWalletInternalTransactionById";
import { useWalletExternalTransactionById } from "@/hooks/wallet/useWalletExternalTransactionById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Copy, ExternalLink, CheckCircle2, Clock, XCircle, AlertCircle, Building2, CreditCard, Calendar, DollarSign, Hash, FileText, History, User, Activity } from "lucide-react";

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

function mapTypeToDirection(type: string): "transfer_in" | "transfer_out" | "transfer" {
  const t = (type || "").toUpperCase();
  if (t === "FROM_ESCROW") return "transfer_in";
  if (t === "TO_ESCROW") return "transfer_out";
  return "transfer";
}

export default function CreatorWalletTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = params?.transactionId || "";
  const transactionType = searchParams.get('type') || 'internal'; // default to internal for backward compatibility
  
  // Use the appropriate hook based on transaction type
  const externalTransaction = useWalletExternalTransactionById(transactionType === 'external' ? transactionId : null);
  const internalTransaction = useWalletInternalTransactionById(transactionType === 'internal' ? transactionId : null);
  
  const transaction = transactionType === 'internal' ? internalTransaction.data : externalTransaction.data;
  const isLoading = transactionType === 'internal' ? internalTransaction.isLoading : externalTransaction.isLoading;

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

  const renderTypeIcon = (type: string) => {
    const dir = mapTypeToDirection(type);
    if (dir === "transfer_in") return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
    if (dir === "transfer_out") return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
    return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
  };

  const renderTypeLabel = (type: string) => {
    const dir = mapTypeToDirection(type);
    if (dir === "transfer_in") return "Transfer from escrow";
    if (dir === "transfer_out") return "Transfer to escrow";
    return "Transfer";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
          <p className="text-muted-foreground mt-2">
            {transactionType === 'internal' ? 'Internal transaction information' : 'External transaction information'}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

          {isLoading || !transaction ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : 'type' in transaction ? (
            // Internal transaction
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-sm truncate">{transaction.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-sm flex items-center gap-2">
                          {renderTypeIcon(transaction.type)}
                          {renderTypeLabel(transaction.type)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={getStatusColor(mapStatus(transaction.status))}>{getStatusLabel(mapStatus(transaction.status))}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-sm font-semibold">{formatCurrency(parseFloat(transaction.amount), transaction.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Currency</p>
                      <p className="text-sm">{transaction.currency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created At</p>
                      <p className="text-sm">{formatDateTime(transaction.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // External transaction
            <div className="space-y-6">
              {/* Amount and Status Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Transaction Amount</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(parseFloat(transaction.amount), transaction.currency)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getStatusColor(mapStatus(transaction.status))} className="gap-1">
                          {getStatusIcon(transaction.status)}
                          {getStatusLabel(transaction.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {transaction.direction?.toUpperCase() === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </div>
                    </div>
                    {transaction.paymentUrl && transaction.status !== 'COMPLETED' && (
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <a href={transaction.paymentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Complete Payment
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{transaction.id}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(transaction.id)}
                            title="Copy Transaction ID"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Provider</p>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{transaction.provider || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Provider Transaction ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{transaction.providerTransactionId || '-'}</p>
                          {transaction.providerTransactionId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(transaction.providerTransactionId!)}
                              title="Copy Provider Transaction ID"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Created At</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{formatDateTime(transaction.createdAt)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Updated At</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm">{formatDateTime(transaction.updatedAt)}</p>
                        </div>
                      </div>
                      {transaction.expiresAt && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Expires At</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{formatDateTime(transaction.expiresAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              {transaction.providerResponse && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Bank</p>
                          <p className="text-sm font-medium">{getBankName(transaction.providerResponse.vnp_BankCode || transaction.provider || '')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Bank Transaction Number</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm">{transaction.providerResponse.vnp_BankTranNo || '-'}</p>
                            {transaction.providerResponse.vnp_BankTranNo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(transaction.providerResponse!.vnp_BankTranNo!)}
                                title="Copy Bank Transaction Number"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">VNPay Transaction Reference</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm">{transaction.providerResponse.vnp_TxnRef || '-'}</p>
                            {transaction.providerResponse.vnp_TxnRef && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(transaction.providerResponse!.vnp_TxnRef!)}
                                title="Copy VNPay Transaction Reference"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">VNPay Transaction Number</p>
                          <p className="font-mono text-sm">{transaction.providerResponse.vnp_TransactionNo || '-'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Order Information</p>
                          <p className="text-sm break-words">{transaction.providerResponse.vnp_OrderInfo || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Payment Date</p>
                          <p className="text-sm">
                            {transaction.providerResponse.vnp_PayDate 
                              ? new Date(transaction.providerResponse.vnp_PayDate.toString().replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).toLocaleString()
                              : '-'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Response Code</p>
                          <Badge variant={transaction.providerResponse.vnp_ResponseCode === 0 ? "default" : "destructive"}>
                            {transaction.providerResponse.vnp_ResponseCode}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Transaction Status</p>
                          <Badge variant={transaction.providerResponse.vnp_TransactionStatus === 0 ? "default" : "destructive"}>
                            {transaction.providerResponse.vnp_TransactionStatus === 0 ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {transaction.paymentUrl && (
                      <div className="mt-6 pt-6 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Payment URL</p>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <p className="font-mono text-xs flex-1 truncate">{transaction.paymentUrl}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(transaction.paymentUrl!)}
                            title="Copy Payment URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={transaction.paymentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Withdrawal Bank Info (if available) */}
              {((transaction as any).withdrawBankName || (transaction as any).withdrawBankAccountNumber) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Withdrawal Bank Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                        <p className="text-sm font-medium">{(transaction as any).withdrawBankName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                        <p className="font-mono text-sm">{(transaction as any).withdrawBankAccountNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                        <p className="text-sm">{(transaction as any).withdrawBankAccountName || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transaction.timeline && transaction.timeline.length > 0 ? (
                    <div className="space-y-4">
                      {transaction.timeline.map((e, index) => (
                        <div key={e.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary/10 p-2">
                              {getActionIcon(e.action)}
                            </div>
                            {index < transaction.timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={getStatusColor(mapStatus(e.statusChangedTo))} className="gap-1">
                                    {getStatusIcon(e.statusChangedTo)}
                                    {getStatusLabel(e.statusChangedTo)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                                </div>
                                <p className="text-sm font-medium mt-1">{e.action.replace(/_/g, ' ')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              {getActorIcon(e.actorType)}
                              <span>{e.actorName}</span>
                              {e.actorType && (
                                <Badge variant="outline" className="text-xs">
                                  {e.actorType.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{e.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No timeline events</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
    </div>
  );
}


