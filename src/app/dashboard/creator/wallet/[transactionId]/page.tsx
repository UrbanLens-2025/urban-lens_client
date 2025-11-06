"use client";

import { useParams, useRouter } from "next/navigation";
import { useWalletInternalTransactionById } from "@/hooks/wallet/useWalletInternalTransactionById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

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

function mapTypeToDirection(type: string): "transfer_in" | "transfer_out" | "transfer" {
  const t = (type || "").toUpperCase();
  if (t === "FROM_ESCROW") return "transfer_in";
  if (t === "TO_ESCROW") return "transfer_out";
  return "transfer";
}

export default function CreatorWalletTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const router = useRouter();
  const transactionId = params?.transactionId || "";
  const { data: transaction, isLoading } = useWalletInternalTransactionById(transactionId);

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
          <p className="text-muted-foreground mt-2">Internal transaction information</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}


