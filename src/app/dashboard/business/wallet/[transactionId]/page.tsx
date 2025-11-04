"use client";

import { useParams, useRouter } from "next/navigation";
import { useWalletTransactionById } from "@/hooks/wallet/useWalletExternalTransactionById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft } from "lucide-react";

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    COMPLETED: "completed",
    PENDING: "pending",
    FAILED: "failed",
    CANCELLED: "cancelled",
  };
  return statusMap[status?.toUpperCase()] || status?.toLowerCase() || "pending";
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  const transactionId = params?.transactionId || "";
  const { data: transaction, isLoading } = useWalletTransactionById(transactionId);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
          <p className="text-muted-foreground mt-2">External transaction information</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !transaction ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm truncate">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(mapStatus(transaction.status))}>{getStatusLabel(mapStatus(transaction.status))}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm">{transaction.direction?.toUpperCase() === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold">{formatCurrency(parseFloat(transaction.amount), transaction.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="text-sm">{transaction.provider}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Provider Txn ID</p>
                  <p className="text-sm font-mono truncate">{transaction.providerTransactionId || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">{formatDateTime(transaction.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires At</p>
                  <p className="text-sm">{formatDateTime(transaction.expiresAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Bank/Payment Info</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="text-sm">{getBankName(transaction.providerResponse?.vnp_BankCode || transaction.provider)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Ref</p>
                    <p className="text-sm font-mono truncate">{transaction.providerResponse?.vnp_BankTranNo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">VNPay Ref</p>
                    <p className="text-sm font-mono truncate">{transaction.providerResponse?.vnp_TxnRef || '-'}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-xs text-muted-foreground">Order Info</p>
                    <p className="text-sm break-words">{transaction.providerResponse?.vnp_OrderInfo || '-'}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-xs text-muted-foreground">Payment URL</p>
                    <a href={transaction.paymentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline break-all">{transaction.paymentUrl}</a>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Timeline</p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transaction.timeline && transaction.timeline.length > 0 ? (
                        transaction.timeline.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="whitespace-nowrap">{formatDateTime(e.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(mapStatus(e.statusChangedTo))}>{getStatusLabel(mapStatus(e.statusChangedTo))}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{e.action}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{e.actorName}</TableCell>
                            <TableCell className="max-w-[320px] text-sm"><span className="block truncate" title={e.note}>{e.note}</span></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No timeline events</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


