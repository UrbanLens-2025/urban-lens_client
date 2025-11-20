"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Search,
  Download,
  Upload,
  User,
  CreditCard,
  Calendar,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAdminExternalTransactions } from "@/hooks/admin/useAdminExternalTransactions";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { WalletExternalTransaction } from "@/types";

const formatCurrency = (amount: string, currency: string = "VND") => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "MMM dd, yyyy HH:mm");
};

const getStatusBadge = (status: string) => {
  const statusUpper = status.toUpperCase();
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    COMPLETED: { variant: "default", label: "Completed" },
    PENDING: { variant: "secondary", label: "Pending" },
    READY_FOR_PAYMENT: { variant: "secondary", label: "Ready for Payment" },
    PROCESSING: { variant: "secondary", label: "Processing" },
    TRANSFERRED: { variant: "default", label: "Transferred" },
    TRANSFER_FAILED: { variant: "destructive", label: "Transfer Failed" },
    REJECTED: { variant: "destructive", label: "Rejected" },
    CANCELLED: { variant: "outline", label: "Cancelled" },
  };

  const config = variants[statusUpper] || { variant: "secondary" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getDirectionIcon = (direction: string) => {
  const dir = direction.toUpperCase();
  if (dir === "DEPOSIT") {
    return <Download className="h-4 w-4 text-green-600" />;
  }
  return <Upload className="h-4 w-4 text-orange-600" />;
};

const getDirectionColor = (direction: string) => {
  const dir = direction.toUpperCase();
  return dir === "DEPOSIT" ? "text-green-600" : "text-orange-600";
};

const getDirectionSign = (direction: string) => {
  const dir = direction.toUpperCase();
  return dir === "DEPOSIT" ? "+" : "-";
};

export default function AdminExternalTransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt:DESC");
  const itemsPerPage = 20;

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useAdminExternalTransactions({
    page: currentPage,
    limit: itemsPerPage,
    sortBy,
  });

  const transactions = data?.data || [];
  const totalPages = data?.meta.totalPages || 1;
  const totalItems = data?.meta.totalItems || 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminExternalTransactions'] });
  };

  // Filter transactions client-side (since API doesn't support filters yet)
  const filteredTransactions = transactions.filter((t) => {
    if (statusFilter !== "all" && t.status.toUpperCase() !== statusFilter.toUpperCase()) {
      return false;
    }
    if (directionFilter !== "all" && t.direction.toUpperCase() !== directionFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        t.id,
        t.createdBy?.email,
        t.createdBy?.firstName,
        t.createdBy?.lastName,
        t.amount,
        t.withdrawBankName,
        t.withdrawBankAccountNumber,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchableText.includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Calculate stats
  const stats = {
    totalDeposits: transactions
      .filter((t) => t.direction.toUpperCase() === "DEPOSIT")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalWithdrawals: transactions
      .filter((t) => t.direction.toUpperCase() === "WITHDRAW")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    pendingCount: transactions.filter((t) => t.status.toUpperCase() === "PENDING").length,
    completedCount: transactions.filter((t) => t.status.toUpperCase() === "COMPLETED").length,
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-semibold">Failed to load transactions</p>
              <p className="text-sm mt-1">
                {error instanceof Error ? error.message : "Unknown error occurred"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">External Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Monitor all deposit and withdrawal transactions
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Download className="h-4 w-4 text-green-600" />
              Total Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalDeposits.toString(), "VND")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-orange-600" />
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.totalWithdrawals.toString(), "VND")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="READY_FOR_PAYMENT">Ready for Payment</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                <SelectItem value="TRANSFER_FAILED">Transfer Failed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="WITHDRAW">Withdraw</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:DESC">Newest First</SelectItem>
                <SelectItem value="createdAt:ASC">Oldest First</SelectItem>
                <SelectItem value="amount:DESC">Amount: High to Low</SelectItem>
                <SelectItem value="amount:ASC">Amount: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {totalItems} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="font-medium">No transactions found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Bank Info</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: WalletExternalTransaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-mono text-xs max-w-[120px] truncate">
                          {transaction.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.createdBy ? (
                          <div className="flex items-center gap-2 min-w-0">
                            {transaction.createdBy.avatarUrl ? (
                              <img
                                src={transaction.createdBy.avatarUrl}
                                alt={transaction.createdBy.firstName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {transaction.createdBy.firstName} {transaction.createdBy.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {transaction.createdBy.email}
                              </div>
                              <Badge variant="outline" className="text-xs mt-0.5">
                                {transaction.createdBy.role}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(transaction.direction)}
                          <Badge variant="outline">
                            {transaction.direction.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${getDirectionColor(transaction.direction)}`}>
                          {getDirectionSign(transaction.direction)}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.provider ? (
                          <Badge variant="secondary">{transaction.provider}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.direction.toUpperCase() === "WITHDRAW" && transaction.withdrawBankName ? (
                          <div className="text-xs space-y-0.5">
                            <div className="font-medium">{transaction.withdrawBankName}</div>
                            <div className="text-muted-foreground">
                              {transaction.withdrawBankAccountNumber}
                            </div>
                            <div className="text-muted-foreground">
                              {transaction.withdrawBankAccountName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDateTime(transaction.createdAt)}</div>
                          {transaction.updatedAt !== transaction.createdAt && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Updated: {formatDateTime(transaction.updatedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/wallet/transactions/${transaction.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalItems} total transactions)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

