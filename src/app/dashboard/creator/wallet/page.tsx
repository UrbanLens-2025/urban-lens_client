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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Wallet,
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
  Eye,
  X,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/user/useWallet";
import { useWalletExternalTransactions } from "@/hooks/wallet/useWalletExternalTransactions";
import type { WalletExternalTransaction, WalletTransaction } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useWalletExternalTransactionById } from "@/hooks/wallet/useWalletExternalTransactionById";
import { useWalletTransactions } from "@/hooks/wallet/useWalletTransactions";
import { useCancelWithdrawTransaction } from "@/hooks/wallet/useCancelWithdrawTransaction";

// Helper mappers
const getInternalTransactionIcon = (mappedType: string) => {
  if (mappedType === "transfer_in") return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
  if (mappedType === "transfer_out") return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
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
    case "cancelled":
      return "secondary";
    case "ready":
      return "secondary";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3 w-3" />;
    case "pending":
      return <Clock className="h-3 w-3" />;
    case "failed":
      return <XCircle className="h-3 w-3" />;
    case "cancelled":
      return <XCircle className="h-3 w-3" />;
    case "ready":
      return <AlertCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
    case "ready":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    default:
      return "";
  }
};

const getStatusLabel = (status: string) => {
  if (status === "ready") return "Ready for Payment";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "transfer_in":
      return "Received";
    case "transfer_out":
      return "Sent";
    case "transfer":
      return "Receive";
    case "deposit":
      return "Deposit";
    case "withdrawal":
      return "Withdrawal";
    default:
      return type;
  }
};

// Map backend internal type to UI type
function mapInternalType(type: string): "transfer_in" | "transfer_out" | "transfer" {
  const t = (type || "").toUpperCase();
  if (t.includes("FROM_ESCROW") || t === "FROM_ESCROW") return "transfer_in";
  if (t.includes("TO_ESCROW") || t === "TO_ESCROW") return "transfer_out";
  return "transfer";
}

export default function CreatorWalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: walletData, isLoading, error } = useWallet();
  const [currentInternalPage, setCurrentInternalPage] = useState(1);
  const [currentExternalPage, setCurrentExternalPage] = useState(1);
  const itemsPerPage = 10;
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<string | null>(null);
  const cancelWithdraw = useCancelWithdrawTransaction();

  // Get active tab from URL or default to "internal"
  const activeTab = searchParams.get("tab") || "internal";
  const validTab = activeTab === "internal" || activeTab === "external" ? activeTab : "internal";

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

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

  // Use real wallet balance from API
  const totalBalance = walletData ? parseFloat(walletData.balance) : 0;
  const lockedBalance = walletData ? parseFloat(walletData.lockedBalance || "0") : 0;
  const availableBalance = totalBalance - lockedBalance;
  const currency = walletData?.currency || "VND";

  // External
  const externalTransactions = externalTransactionsData?.data || [];
  const totalExternalPages = externalTransactionsData?.meta.totalPages || 1;
  const totalExternalItems = externalTransactionsData?.meta.totalItems || 0;

  // Internal
  const internalTransactions = internalTransactionsData?.data || [];
  const totalInternalPages = internalTransactionsData?.meta.totalPages || 1;
  const totalInternalItems = internalTransactionsData?.meta.totalItems || 0;

  // Stats (external-based and mock for earnings)
  const stats = {
    totalDeposits: externalTransactions
      .filter(t => t.direction.toUpperCase() === "DEPOSIT" && t.status.toUpperCase() === "COMPLETED")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalWithdrawals: externalTransactions
      .filter(t => t.direction.toUpperCase() === "WITHDRAWAL" && t.status.toUpperCase() === "COMPLETED")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalEarnings: 0,
    totalTransactions: walletData?.totalTransactions || 0,
  };

  // External mapping
  const mapExternalTransaction = (transaction: WalletExternalTransaction) => {
    const isDeposit = transaction.direction.toUpperCase() === "DEPOSIT";
    const bankCode = transaction.providerResponse?.vnp_BankCode || transaction.provider || "N/A";
    const bankName = getBankName(bankCode);
    const bankTranNo = transaction.providerResponse?.vnp_BankTranNo;
    const accountNumber = bankTranNo ? `****${String(bankTranNo).slice(-4)}` : "N/A";
    return {
      id: transaction.id,
      type: isDeposit ? "deposit" : "withdrawal",
      amount: parseFloat(transaction.amount),
      description: isDeposit ? "Bank transfer deposit" : "Withdrawal to bank account",
      bankName,
      accountNumber,
      status: mapStatus(transaction.status),
      date: transaction.createdAt,
      reference: transaction.providerTransactionId || transaction.id,
      transactionFee: 0,
    };
  };

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      "COMPLETED": "completed",
      "PENDING": "pending",
      "FAILED": "failed",
      "CANCELLED": "cancelled",
      "READY_FOR_PAYMENT": "ready",
    };
    return statusMap[status.toUpperCase()] || status.toLowerCase();
  };

  const handleCancelClick = (transactionId: string) => {
    setTransactionToCancel(transactionId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (transactionToCancel) {
      cancelWithdraw.mutate(transactionToCancel);
      setCancelDialogOpen(false);
      setTransactionToCancel(null);
    }
  };

  const getBankName = (bankCode: string): string => {
    const bankMap: Record<string, string> = {
      "VNP": "Vietnam Payment",
      "VNB": "Vietcombank",
      "TCB": "Techcombank",
      "BID": "BIDV",
      "ACB": "ACB",
      "VCB": "Vietcombank",
      "CTG": "Vietinbank",
      "NCB": "NCB Bank",
      "VNPAY": "VNPay",
    };
    return bankMap[bankCode.toUpperCase()] || bankCode || "Unknown Bank";
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
          <p className="text-muted-foreground mt-2">
            Manage your balance and transactions
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive font-medium">Failed to load wallet information</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try refreshing the page
              </p>
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
    <div className="space-y-6">
      {/* Title Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground mt-2">
          Manage your balance and transactions
        </p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Total Balance</CardTitle>
            <Wallet className="h-8 w-8 opacity-80" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-4xl font-bold">
                {formatCurrency(totalBalance)}
              </div>
              {lockedBalance > 0 && (
                <div className="space-y-1 text-sm opacity-90">
                  <div className="flex items-center justify-between">
                    <span className="opacity-80">Available Balance</span>
                    <span className="font-semibold">{formatCurrency(availableBalance)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="opacity-80">Locked Balance</span>
                    <span className="font-semibold text-yellow-200">{formatCurrency(lockedBalance)}</span>
                  </div>
                </div>
              )}
            </div>
            {walletData?.isLocked && (
              <Badge variant="destructive" className="bg-red-500/20 text-red-100 border-red-300">
                Wallet Locked
              </Badge>
            )}
            <div className="flex gap-3">
              <Link href="/dashboard/creator/wallet/deposit">
                <Button 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  size="sm"
                  disabled={walletData?.isLocked}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
              </Link>
              <Link href="/dashboard/creator/wallet/withdraw">
                <Button 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  size="sm"
                  disabled={walletData?.isLocked}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">External Deposits</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalDeposits)}
            </div>
            <p className="text-xs text-muted-foreground">
              From bank transfers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internal Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From event tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">External Withdrawals</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalWithdrawals)}
            </div>
            <p className="text-xs text-muted-foreground">
              To bank account
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={validTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex items-center gap-4 mb-6 border-b">
              <TabsList className="inline-flex h-auto p-1 bg-transparent border-0">
                <TabsTrigger 
                  value="internal" 
                  className="px-6 py-3 text-base font-medium rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-sm transition-all"
                >
                  <ArrowLeftRight className="h-5 w-5 mr-2" />
                  Internal Transactions
                </TabsTrigger>
                <TabsTrigger 
                  value="external"
                  className="px-6 py-3 text-base font-medium rounded-t-lg data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-sm transition-all"
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  External Transactions
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Internal Transactions Tab */}
            <TabsContent value="internal" className="space-y-4">
              <div className="rounded-md border border-blue-200 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/50 p-3 mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-medium flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Internal transactions represent money movements within the platform (e.g., to/from escrow)
                </p>
              </div>

              {/* Search and Filter Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ID, date & time, or amount..."
                      className="pl-9"
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex gap-2">
                    {/* Type Filter */}
                    <Select>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="transfer_in">Received</SelectItem>
                        <SelectItem value="transfer_out">Sent</SelectItem>
                        <SelectItem value="transfer">Receive</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="ready">Ready for Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingInternalTransactions ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : internalTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No internal transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    internalTransactions.map((t: WalletTransaction) => {
                      const mappedType = mapInternalType(t.type);
                      const icon = getInternalTransactionIcon(mappedType);
                      const description = mappedType === 'transfer_out' ? 'Transfer to escrow' : mappedType === 'transfer_in' ? 'Transfer from escrow' : 'Transfer';
                      const statusText = mapStatus(t.status);
                      const amountNumber = parseFloat(t.amount);
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            <span className="text-sm font-mono text-muted-foreground">
                              {t.id.slice(0, 8).toUpperCase()}
                            </span>
                          </TableCell>
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
                          <TableCell>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDateTime(t.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={`${getStatusBadgeStyle(statusText)} flex items-center gap-1.5 w-fit`}
                            >
                              {getStatusIcon(statusText)}
                              {getStatusLabel(statusText)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span 
                              className={`text-sm font-bold whitespace-nowrap ${
                                mappedType === "transfer_out"
                                  ? "text-orange-600" 
                                  : "text-green-600"
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {internalTransactions.length} of {totalInternalItems} internal transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentInternalPage((p) => Math.max(1, p - 1))}
                    disabled={currentInternalPage === 1 || isLoadingInternalTransactions}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentInternalPage} of {totalInternalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentInternalPage((p) => Math.min(totalInternalPages, p + 1))}
                    disabled={currentInternalPage >= totalInternalPages || isLoadingInternalTransactions}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* External Transactions Tab */}
            <TabsContent value="external" className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/50 p-3 mb-4">
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  External transactions are deposits from or withdrawals to your bank account
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingExternalTransactions ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : externalTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">No external transactions found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    externalTransactions.map((transaction) => {
                      const mappedTransaction = mapExternalTransaction(transaction);
                      const canCancel = transaction.status.toUpperCase() === "PENDING" || transaction.status.toUpperCase() === "READY_FOR_PAYMENT";
                      return (
                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                          <TableCell>
                            <span className="text-sm font-mono text-muted-foreground">
                              {transaction.id.slice(0, 8).toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              {getExternalTransactionIcon(mappedTransaction.type)}
                              <span className="text-sm font-medium truncate">
                                {getTypeLabel(mappedTransaction.type)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDateTime(mappedTransaction.date)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={`${getStatusBadgeStyle(mappedTransaction.status)} flex items-center gap-1.5 w-fit`}
                            >
                              {getStatusIcon(mappedTransaction.status)}
                              {getStatusLabel(mappedTransaction.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span 
                              className={`text-sm font-bold whitespace-nowrap ${
                                mappedTransaction.type === "withdrawal"
                                  ? "text-orange-600" 
                                  : "text-green-600"
                              }`}
                            >
                              {getTransactionSign(mappedTransaction.type)}
                              {formatCurrency(mappedTransaction.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/creator/wallet/${transaction.id}?type=external`} className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {canCancel && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleCancelClick(transaction.id);
                                    }}
                                    disabled={cancelWithdraw.isPending}
                                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    {cancelWithdraw.isPending && transactionToCancel === transaction.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel Transaction
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {externalTransactions.length} of {totalExternalItems} external transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentExternalPage((p) => Math.max(1, p - 1))}
                    disabled={currentExternalPage === 1 || isLoadingExternalTransactions}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentExternalPage} of {totalExternalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentExternalPage((p) => Math.min(totalExternalPages || 1, p + 1))}
                    disabled={currentExternalPage >= (totalExternalPages || 1) || isLoadingExternalTransactions}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Moved details to a dedicated page; links above */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cancel Transaction Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transaction? This action cannot be undone. The transaction will be moved to CANCELLED status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setTransactionToCancel(null);
              }}
              disabled={cancelWithdraw.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelWithdraw.isPending}
            >
              {cancelWithdraw.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
