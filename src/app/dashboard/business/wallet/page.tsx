"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet as WalletIcon,
  Download,
  Upload,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Users,
  ArrowLeftRight,
  Landmark,
  Loader2,
  History,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/user/useWallet";
import { useWalletExternalTransactions } from "@/hooks/wallet/useWalletExternalTransactions";
import { useWalletTransactions } from "@/hooks/wallet/useWalletTransactions";
import type { WalletExternalTransaction, WalletTransaction } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWalletExternalTransactionById } from "@/hooks/wallet/useWalletExternalTransactionById";

const mapInternalType = (type: string): "transfer_in" | "transfer_out" | "transfer" => {
  const t = (type || "").toUpperCase();
  if (t.includes("FROM_ESCROW") || t === "FROM_ESCROW") return "transfer_in";
  if (t.includes("TO_ESCROW") || t === "TO_ESCROW") return "transfer_out";
  return "transfer";
};

const getInternalTransactionIcon = (type: string) => {
  const mappedType = mapInternalType(type);
  if (mappedType === "transfer_in") {
    return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
  }
  if (mappedType === "transfer_out") {
    return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
  }
  return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
};

const getExternalTransactionIcon = (type: string) => {
  if (type === "deposit") {
    return <Building2 className="h-4 w-4 text-green-600" />;
  }
  return <Landmark className="h-4 w-4 text-orange-600" />;
};

const getTransactionSign = (type: string) => {
  return type === "withdrawal" || type === "transfer_out" ? "-" : "+";
};

const getStatusColor = (status: string) => {
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
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "transfer_in":
      return "Received";
    case "transfer_out":
      return "Sent";
    case "deposit":
      return "Deposit";
    case "withdrawal":
      return "Withdrawal";
    default:
      return type;
  }
};

export default function BusinessWalletPage() {
  const { data: walletData, isLoading, error } = useWallet();
  const [currentInternalPage, setCurrentInternalPage] = useState(1);
  const [currentExternalPage, setCurrentExternalPage] = useState(1);
  const itemsPerPage = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // External transactions
  const { 
    data: externalTransactionsData, 
    isLoading: isLoadingExternalTransactions 
  } = useWalletExternalTransactions({
    page: currentExternalPage,
    limit: itemsPerPage,
    sortBy: 'createdAt:DESC'
  });

  // Internal transactions
  const {
    data: internalTransactionsData,
    isLoading: isLoadingInternalTransactions,
  } = useWalletTransactions({
    page: currentInternalPage,
    limit: itemsPerPage,
    sortBy: 'createdAt:DESC',
  });

  const { data: transactionDetail, isLoading: isLoadingDetail } = useWalletExternalTransactionById(selectedTransactionId);

  const totalBalance = walletData ? parseFloat(walletData.balance) : 0;
  const currency = walletData?.currency || "VND";

  // External
  const externalTransactions = externalTransactionsData?.data || [];
  const totalExternalPages = externalTransactionsData?.meta.totalPages || 1;
  const totalExternalItems = externalTransactionsData?.meta.totalItems || 0;

  // Internal
  const internalTransactions = internalTransactionsData?.data || [];
  const totalInternalPages = internalTransactionsData?.meta.totalPages || 1;
  const totalInternalItems = internalTransactionsData?.meta.totalItems || 0;

  // Stats calculated from real data
  const stats = {
    totalDeposits: externalTransactions
      .filter((t) => t.direction.toUpperCase() === "DEPOSIT" && t.status.toUpperCase() === "COMPLETED")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalWithdrawals: externalTransactions
      .filter((t) => t.direction.toUpperCase() === "WITHDRAWAL" && t.status.toUpperCase() === "COMPLETED")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalEarnings: internalTransactions
      .filter((t) => {
        const mappedType = mapInternalType(t.type);
        return mappedType === "transfer_in" && t.status.toUpperCase() === "COMPLETED";
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalTransactions: walletData?.totalTransactions || 0,
  };

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      COMPLETED: "completed",
      PENDING: "pending",
      FAILED: "failed",
      CANCELLED: "cancelled",
    };
    return statusMap[status.toUpperCase()] || status.toLowerCase();
  };

  const getBankName = (bankCode: string): string => {
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
    return bankMap[bankCode.toUpperCase()] || bankCode || "Unknown Bank";
  };

  const mapExternalTransaction = (t: WalletExternalTransaction) => {
    const isDeposit = t.direction.toUpperCase() === "DEPOSIT";
    const bankCode = t.providerResponse?.vnp_BankCode || t.provider || "N/A";
    const accountNumber = t.providerResponse?.vnp_BankTranNo
      ? `****${String(t.providerResponse.vnp_BankTranNo).slice(-4)}`
      : "N/A";
    return {
      id: t.id,
      type: isDeposit ? "deposit" : "withdrawal",
      amount: parseFloat(t.amount),
      description: isDeposit ? "Bank transfer deposit" : "Withdrawal to bank account",
      bankName: getBankName(bankCode),
      accountNumber,
      status: mapStatus(t.status),
      date: t.createdAt,
      reference: t.providerTransactionId || t.id,
      transactionFee: 0,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground mt-2">Manage your balance and transactions</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive font-medium">Failed to load wallet information</p>
              <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 pb-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1 flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
            Wallet
          </h1>
          <p className="text-sm text-muted-foreground break-words">Manage your balance and transactions</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl border-0">
        <CardHeader className="border-b border-white/20">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-white text-lg sm:text-xl font-semibold break-words">Total Balance</CardTitle>
            <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm shrink-0">
              <WalletIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6 min-w-0">
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight break-words">{formatCurrency(totalBalance)}</div>
            {walletData?.isLocked && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-100 border-red-300/50 backdrop-blur-sm w-fit">
                Wallet Locked
              </Badge>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/business/wallet/deposit">
                <Button className="bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all font-semibold" size="default" disabled={walletData?.isLocked}>
                  <Download className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
              </Link>
              <Link href="/dashboard/business/wallet/withdraw">
                <Button className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 shadow-lg hover:shadow-xl transition-all font-semibold" size="default" disabled={walletData?.isLocked}>
                  <Upload className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Total Transactions</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.totalTransactions}</div>
            <p className="text-xs font-medium text-muted-foreground">All time transactions</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow border-2 hover:border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">External Deposits</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Building2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(stats.totalDeposits)}</div>
            <p className="text-xs font-medium text-muted-foreground">From bank transfers</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow border-2 hover:border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Internal Earnings</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatCurrency(stats.totalEarnings)}</div>
            <p className="text-xs font-medium text-muted-foreground">From bookings</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow border-2 hover:border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">External Withdrawals</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Landmark className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{formatCurrency(stats.totalWithdrawals)}</div>
            <p className="text-xs font-medium text-muted-foreground">To bank account</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="internal" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="internal" className="font-medium">
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Internal
              </TabsTrigger>
              <TabsTrigger value="external" className="font-medium">
                <Building2 className="h-4 w-4 mr-2" />
                External
              </TabsTrigger>
            </TabsList>

            <TabsContent value="internal" className="space-y-4">
              <div className="rounded-lg border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:border-blue-700/50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 mb-4 shadow-sm">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Internal transactions are transfers within the platform
                </p>
              </div>
              <div className="rounded-lg border-2 overflow-hidden">
                <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">From/To</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingInternalTransactions ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : internalTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">No internal transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    internalTransactions.map((t: WalletTransaction) => {
                      const mappedType = mapInternalType(t.type);
                      const icon = getInternalTransactionIcon(t.type);
                      const description = mappedType === 'transfer_out' ? 'Transfer to escrow' : mappedType === 'transfer_in' ? 'Transfer from escrow' : 'Transfer';
                      const statusText = mapStatus(t.status);
                      const amountNumber = parseFloat(t.amount);
                      return (
                        <TableRow key={t.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              {icon}
                              <span className="text-sm font-medium truncate">
                                {getTypeLabel(mappedType)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="text-sm truncate block">{description}</span>
                          </TableCell>
                          <TableCell className="max-w-[180px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <ArrowLeftRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground truncate">Escrow</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground font-mono truncate block">
                              <Link href={`/dashboard/business/wallet/${t.id}?type=internal`} className="hover:underline text-primary font-medium">
                                {t.id}
                              </Link>
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
                              {formatDateTime(t.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(statusText)} className="font-medium">
                              {getStatusLabel(statusText)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span 
                              className={`text-sm font-bold whitespace-nowrap ${
                                mappedType === "transfer_out"
                                  ? "text-orange-600 dark:text-orange-400" 
                                  : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              {getTransactionSign(mappedType)}
                              {formatCurrency(amountNumber)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Showing {internalTransactions.length} of {totalInternalItems} internal transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentInternalPage((p) => Math.max(1, p - 1))}
                    disabled={currentInternalPage === 1 || isLoadingInternalTransactions}
                    className="shadow-sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium">
                    Page {currentInternalPage} of {totalInternalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentInternalPage((p) => Math.min(totalInternalPages, p + 1))}
                    disabled={currentInternalPage >= totalInternalPages || isLoadingInternalTransactions}
                    className="shadow-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="external" className="space-y-4">
              <div className="rounded-lg border-2 border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:border-amber-700/50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 mb-4 shadow-sm">
                <p className="text-sm text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  External transactions are deposits from or withdrawals to your bank account
                </p>
              </div>
              <div className="rounded-lg border-2 overflow-hidden">
                <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Bank Details</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Reference</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Date & Time</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold hidden xl:table-cell">Fee</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingExternalTransactions ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : externalTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">No external transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    externalTransactions.map((t) => {
                      const m = mapExternalTransaction(t);
                      return (
                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              {getExternalTransactionIcon(m.type)}
                              <span className="text-sm font-medium truncate">{getTypeLabel(m.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/business/wallet/${t.id}?type=external`} className="text-sm truncate block text-primary hover:underline font-medium break-words">{m.description}</Link>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">{m.bankName}</span>
                                <span className="text-xs text-muted-foreground truncate">{m.accountNumber}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground font-mono truncate block">
                              <Link href={`/dashboard/business/wallet/${t.id}?type=external`} className="hover:underline text-primary font-medium break-all">{m.reference}</Link>
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell"><span className="text-sm text-muted-foreground whitespace-nowrap font-medium">{formatDateTime(m.date)}</span></TableCell>
                          <TableCell><Badge variant={getStatusColor(m.status)} className="font-medium">{getStatusLabel(m.status)}</Badge></TableCell>
                          <TableCell className="hidden xl:table-cell"><span className="text-sm text-muted-foreground whitespace-nowrap font-medium">{m.transactionFee > 0 ? formatCurrency(m.transactionFee) : '-'}</span></TableCell>
                          <TableCell className="text-right">
                            <span className={`text-sm font-bold whitespace-nowrap ${m.type === "withdrawal" ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}>
                              {getTransactionSign(m.type)}
                              {formatCurrency(m.amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground font-medium">Showing {externalTransactions.length} of {totalExternalItems} external transactions</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentExternalPage((p) => Math.max(1, p - 1))} disabled={currentExternalPage === 1 || isLoadingExternalTransactions} className="shadow-sm">Previous</Button>
                  <span className="text-sm font-medium">Page {currentExternalPage} of {totalExternalPages || 1}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentExternalPage((p) => Math.min(totalExternalPages || 1, p + 1))} disabled={currentExternalPage >= (totalExternalPages || 1) || isLoadingExternalTransactions} className="shadow-sm">Next</Button>
                </div>
              </div>

              {/* Moved details to a dedicated page; links above */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


