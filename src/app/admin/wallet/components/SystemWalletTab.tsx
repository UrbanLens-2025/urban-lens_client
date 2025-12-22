"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Wallet,
  Lock,
  Unlock,
  TrendingUp,
  Search,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Copy,
  Check,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import LoadingCustom from "@/components/shared/LoadingCustom";
import ErrorCustom from "@/components/shared/ErrorCustom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { WalletTransaction } from "@/types";

const formatCurrency = (amount: string, currency: string = "VND") => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

import { format } from "date-fns";
import { useRouter } from "next/navigation";

const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "MMM dd, yyyy HH:mm");
};

interface TransactionRowProps {
  transaction: WalletTransaction;
  index: number;
  transactionId: string;
  isToRevenue: boolean;
  direction: string;
  formattedAmount: string;
  note: string;
  truncatedNote: string;
  createdAt: string;
  router: ReturnType<typeof useRouter>;
}

function TransactionRow({
  transaction,
  index,
  transactionId,
  isToRevenue,
  direction,
  formattedAmount,
  note,
  truncatedNote,
  createdAt,
  router,
}: TransactionRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(transaction.id);
      setCopied(true);
      toast.success("Transaction ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy transaction ID");
    }
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() =>
        router.push(`/admin/wallet/internal-transactions/${transaction.id}`)
      }
    >
      <TableCell className="text-center w-[50px]">
        <div className="font-mono text-xs">{index + 1}</div>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={
            isToRevenue
              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
          }
        >
          {isToRevenue ? (
            <ArrowDownCircle className="h-3 w-3 mr-1" />
          ) : (
            <ArrowUpCircle className="h-3 w-3 mr-1" />
          )}
          {direction}
        </Badge>
      </TableCell>
      <TableCell>
        <span
          className={
            isToRevenue
              ? "text-green-600 dark:text-green-400 font-semibold"
              : "text-orange-600 dark:text-orange-400 font-semibold"
          }
        >
          {formattedAmount}
        </span>
      </TableCell>

      <TableCell>{formatDateTime(createdAt)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{transactionId.toUpperCase()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy transaction ID"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </TableCell>
      <TableCell
        className="truncate text-sm block"
        title={note !== "-" ? note : undefined}
      >
        {truncatedNote}
      </TableCell>
    </TableRow>
  );
}

interface SystemWalletTabProps {
  systemWallet:
    | {
        balance: string;
        currency: string;
        totalTransactions: number;
        isLocked: boolean;
        walletType: string;
      }
    | null
    | undefined;
  isLoading: boolean;
  systemInternalTransactions: WalletTransaction[];
  isLoadingSystemInternal: boolean;
  systemInternalSearch: string;
  setSystemInternalSearch: (value: string) => void;
  systemInternalStatusFilter: string;
  setSystemInternalStatusFilter: (value: string) => void;
  systemInternalSortBy: string;
  setSystemInternalSortBy: (value: string) => void;
  filteredSystemInternal: WalletTransaction[];
  systemInternalPage: number;
  setSystemInternalPage: (value: number) => void;
  systemInternalMeta?: {
    totalPages: number;
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
  };
  internalItemsPerPage: number;
}

export function SystemWalletTab({
  systemWallet,
  isLoading,
  systemInternalTransactions,
  isLoadingSystemInternal,
  systemInternalSearch,
  setSystemInternalSearch,
  systemInternalStatusFilter,
  setSystemInternalStatusFilter,
  systemInternalSortBy,
  setSystemInternalSortBy,
  filteredSystemInternal,
  systemInternalPage,
  setSystemInternalPage,
  systemInternalMeta,
  internalItemsPerPage,
}: SystemWalletTabProps) {
  const router = useRouter();

  // Reset to page 1 when filters change (excluding search, which is handled in parent)
  useEffect(() => {
    setSystemInternalPage(1);
  }, [systemInternalStatusFilter, systemInternalSortBy, setSystemInternalPage]);

  const totalPages = systemInternalMeta?.totalPages || 1;
  const totalItems = systemInternalMeta?.totalItems || 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingCustom />
      ) : !systemWallet ? (
        <ErrorCustom />
      ) : (
        <Card className="border-2 border-blue-500/20 shadow-xl bg-gradient-to-br from-blue-50/50 via-card/95 to-card/90 dark:from-blue-950/30 dark:via-card/95 dark:to-card/90 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent pointer-events-none" />
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-muted-foreground mb-1">
                  System Wallet Balance
                </CardTitle>
                <div className="text-5xl font-bold text-foreground tracking-tight mt-2">
                  {formatCurrency(systemWallet.balance, systemWallet.currency)}
                </div>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-400/20 flex items-center justify-center shadow-lg">
                <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-primary/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Transactions
              </CardTitle>
              <CardDescription>
                Recent transactions for the system wallet
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={systemInternalSearch}
                  onChange={(e) => setSystemInternalSearch(e.target.value)}
                  className="pl-8 h-12 text-sm"
                />
              </div>
              <Select
                value={systemInternalSortBy}
                onValueChange={setSystemInternalSortBy}
              >
                <SelectTrigger className="h-8 w-40 text-sm border-2 border-primary/20">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt:DESC">Newest first</SelectItem>
                  <SelectItem value="createdAt:ASC">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSystemInternal ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSystemInternal.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">
              No internal transactions match your filters.
            </div>
          ) : (
            <div className="rounded-md border-2 border-primary/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold w-[50px] text-center">
                      #
                    </TableHead>
                    <TableHead className="font-semibold text-center w-min">
                      Direction
                    </TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">
                      Transaction Date
                    </TableHead>
                    <TableHead className="font-semibold w-min">
                      Transaction ID
                    </TableHead>
                    <TableHead className="font-semibold max-w-[600px]">
                      Note
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSystemInternal.map((t, index) => {
                    // Get first segment of UUID (before first hyphen)
                    const transactionId = t.id.split("-")[0];
                    // Determine direction based on type
                    const isToRevenue = t.type === "TO_REVENUE";
                    const direction = isToRevenue ? "IN" : "OUT";
                    // Format amount with + or - based on type
                    const amountSign = isToRevenue ? "+" : "-";
                    const formattedAmount = `${amountSign}${formatCurrency(
                      t.amount,
                      systemWallet?.currency || "VND"
                    )}`;
                    // Truncate note
                    const note = t.note || "-";
                    const truncatedNote =
                      note.length > 50 ? `${note.substring(0, 50)}...` : note;
                    // Calculate row number with pagination
                    const rowNumber = (systemInternalPage - 1) * internalItemsPerPage + index + 1;

                    return (
                      <TransactionRow
                        key={t.id}
                        transaction={t}
                        index={rowNumber - 1}
                        transactionId={transactionId}
                        isToRevenue={isToRevenue}
                        direction={direction}
                        formattedAmount={formattedAmount}
                        note={note}
                        truncatedNote={truncatedNote}
                        createdAt={t.createdAt}
                        router={router}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoadingSystemInternal && filteredSystemInternal.length > 0 && systemInternalMeta && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/10">
              <div className="text-sm text-muted-foreground">
                Page {systemInternalPage} of {totalPages} ({totalItems} total
                transactions)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSystemInternalPage(Math.max(1, systemInternalPage - 1))}
                  disabled={systemInternalPage === 1 || isLoadingSystemInternal}
                  className="border-2 border-primary/20 hover:border-primary/40"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSystemInternalPage(Math.min(totalPages, systemInternalPage + 1))
                  }
                  disabled={
                    systemInternalPage >= totalPages || isLoadingSystemInternal
                  }
                  className="border-2 border-primary/20 hover:border-primary/40"
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
