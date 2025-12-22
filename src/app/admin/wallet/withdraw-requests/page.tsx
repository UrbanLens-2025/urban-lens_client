"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import Image from "next/image";

import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  RefreshCw,
  User,
  DollarSign,
  Clock,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { useAdminExternalTransactions } from "@/hooks/admin/useAdminExternalTransactions";
import { useQueryClient } from "@tanstack/react-query";
import type { WalletExternalTransaction } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const formatCurrency = (amount: string, currency: string = "VND") => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function AdminWithdrawRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "PENDING"
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const itemsPerPage = 10;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();

    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    } else {
      params.delete("search");
    }

    if (statusFilter !== "PENDING") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }

    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusFilter, page, pathname, router, searchParams]);

  // Fetch all withdraw transactions (no status filter - we'll filter client-side)
  const {
    data: transactionsData,
    isLoading,
    isFetching,
  } = useAdminExternalTransactions({
    page,
    limit: itemsPerPage,
    sortBy: "createdAt:DESC",
    filters: {
      direction: "WITHDRAW",
    },
  });

  const totalPages = transactionsData?.meta.totalPages || 1;
  const totalItems = transactionsData?.meta.totalItems || 0;

  // Filter by status and search term (client-side)
  const filteredTransactions = useMemo(() => {
    const transactions = transactionsData?.data || [];

    // First filter by status
    let filtered = transactions;
    if (statusFilter !== "all") {
      filtered = transactions.filter((t: WalletExternalTransaction) => {
        return t.status.toUpperCase() === statusFilter.toUpperCase();
      });
    }

    // Then filter by search term
    if (!debouncedSearchTerm.trim()) return filtered;

    const query = debouncedSearchTerm.toLowerCase();
    return filtered.filter((t: WalletExternalTransaction) => {
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
        .join(" ")
        .toLowerCase();
      return searchableText.includes(query);
    });
  }, [transactionsData?.data, statusFilter, debouncedSearchTerm]);

  // Calculate statistics from all withdraw transactions
  // We need to fetch all statuses to calculate stats properly
  const { data: allStatusesData } = useAdminExternalTransactions({
    page: 1,
    limit: 1000, // Get a large number to calculate stats
    sortBy: "createdAt:DESC",
    filters: {
      direction: "WITHDRAW",
    },
  });

  const stats = useMemo(() => {
    const allWithdrawTransactions = allStatusesData?.data || [];
    const pending = allWithdrawTransactions.filter(
      (t: WalletExternalTransaction) =>
        ["PENDING", "READY_FOR_PAYMENT"].includes(t.status.toUpperCase())
    ).length;
    const processing = allWithdrawTransactions.filter(
      (t: WalletExternalTransaction) => t.status.toUpperCase() === "PROCESSING"
    ).length;
    const totalAmount = allWithdrawTransactions
      .filter((t: WalletExternalTransaction) =>
        ["PENDING", "READY_FOR_PAYMENT", "PROCESSING"].includes(
          t.status.toUpperCase()
        )
      )
      .reduce(
        (sum: number, t: WalletExternalTransaction) =>
          sum + parseFloat(t.amount),
        0
      );
    const completed = allWithdrawTransactions.filter(
      (t: WalletExternalTransaction) =>
        ["COMPLETED", "TRANSFERRED"].includes(t.status.toUpperCase())
    ).length;

    return { pending, processing, totalAmount, completed };
  }, [allStatusesData?.data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["adminExternalTransactions"] });
  };

  const handleRowClick = (transactionId: string) => {
    router.push(`/admin/wallet/transactions/${transactionId}`);
  };

  return (
    <PageContainer maxWidth="full">
      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={stats.pending.toString()}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Processing"
          value={stats.processing.toString()}
          icon={RefreshCw}
          color="blue"
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(stats.totalAmount.toString(), "VND")}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Completed"
          value={stats.completed.toString()}
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Transactions Table */}
      <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-primary/10">
          <div className="flex items-center">
            <div className="flex-1">
              <CardTitle>Withdraw Requests</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading..."
                  : `Showing ${
                      filteredTransactions.length
                    } of ${totalItems} withdraw request${
                      totalItems !== 1 ? "s" : ""
                    }`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, user, amount, or bank info..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 min-w-[200px] w-[30vw] border-2 border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2 border-primary/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="TRANSFER_FAILED">
                    Transfer Failed
                  </SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={refresh}>
              <RefreshCw
                className={`h-5 w-5 cursor-pointer hover:text-foreground transition-colors ${
                  isFetching ? "animate-spin" : ""
                }`}
              />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="font-medium">No withdraw requests found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-center">#</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Bank Name</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(
                    (transaction: WalletExternalTransaction, index: number) => {
                      const rowNumber = (page - 1) * itemsPerPage + index + 1;
                      return (
                        <TableRow
                          key={transaction.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleRowClick(transaction.id)}
                        >
                          <TableCell className="font-mono text-sm text-center">
                            {rowNumber}
                          </TableCell>
                          <TableCell>
                            {transaction.createdBy ? (
                              <div className="flex items-center gap-3 min-w-0">
                                {transaction.createdBy.avatarUrl ? (
                                  <Image
                                    src={transaction.createdBy.avatarUrl}
                                    alt={transaction.createdBy.firstName}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <User className="h-5 w-5" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {transaction.createdBy.firstName}{" "}
                                    {transaction.createdBy.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {transaction.createdBy.email}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1"
                                  >
                                    {transaction.createdBy.role}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Unknown
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">
                              -
                              {formatCurrency(
                                transaction.amount,
                                transaction.currency
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            {transaction.withdrawBankName ? (
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {transaction.withdrawBankName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDateTime(transaction.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/10">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalItems} total requests)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
