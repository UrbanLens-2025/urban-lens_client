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
  Search,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Copy,
  Check,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const formatDateTime = (dateString: string) => {
  return format(new Date(dateString), "MMM dd, yyyy HH:mm");
};

interface EscrowTransactionRowProps {
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
  currency: string;
}

function EscrowTransactionRow({
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
  currency,
}: EscrowTransactionRowProps) {
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
      <TableCell className="">
        <div className='flex items-center gap-4'>
          <Badge
            variant="outline"
            className={
              cn("w-20", isToRevenue
                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800")
            }
          >
            {isToRevenue ? (
              <ArrowDownCircle className="h-3 w-3 mr-1" />
            ) : (
              <ArrowUpCircle className="h-3 w-3 mr-1" />
            )}
            {direction}
          </Badge>
          <div className=''>
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const tx = transaction as any;
              const sourceOwner = tx.sourceWalletOwner;
              const destinationOwner = tx.destinationWalletOwner;

              if (transaction.type === "TO_WALLET") {
                // Money going TO a wallet, show destination owner
                if (destinationOwner) {
                  const name =
                    `${destinationOwner.firstName || ""} ${
                      destinationOwner.lastName || ""
                    }`.trim() || destinationOwner.email;
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm">
                          <div className="font-semibold">{name}</div>
                          {destinationOwner.email &&
                            name !== destinationOwner.email && (
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {destinationOwner.email}
                              </div>
                            )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-semibold">{name}</div>
                          {destinationOwner.email &&
                            name !== destinationOwner.email && (
                              <div className="text-xs">
                                {destinationOwner.email}
                              </div>
                            )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <span className="text-sm text-muted-foreground">
                    To: Wallet
                  </span>
                );
              } else if (transaction.type === "TO_ESCROW") {
                // Money going TO escrow, show source owner
                if (sourceOwner) {
                  const name =
                    `${sourceOwner.firstName || ""} ${
                      sourceOwner.lastName || ""
                    }`.trim() || sourceOwner.email;
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm">
                          <div className="font-semibold">{name}</div>
                          {sourceOwner.email && name !== sourceOwner.email && (
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {sourceOwner.email}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-semibold">{name}</div>
                          {sourceOwner.email && name !== sourceOwner.email && (
                            <div className="text-xs">{sourceOwner.email}</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <span className="text-sm text-muted-foreground">
                    From: Wallet
                  </span>
                );
              } else if (transaction.type === "FROM_ESCROW") {
                // Money coming FROM escrow, show destination owner
                if (destinationOwner) {
                  const name =
                    `${destinationOwner.firstName || ""} ${
                      destinationOwner.lastName || ""
                    }`.trim() || destinationOwner.email;
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm">
                          <div className="font-semibold">{name}</div>
                          {destinationOwner.email &&
                            name !== destinationOwner.email && (
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {destinationOwner.email}
                              </div>
                            )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-semibold">{name}</div>
                          {destinationOwner.email &&
                            name !== destinationOwner.email && (
                              <div className="text-xs">
                                {destinationOwner.email}
                              </div>
                            )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <span className="text-sm text-muted-foreground">
                    To: Wallet
                  </span>
                );
              }
              return (
                <span className="text-sm text-muted-foreground">System</span>
              );
            })()}
          </div>
        </div>
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

interface EscrowWalletTabProps {
  escrowWallet:
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
  escrowInternalTransactions: WalletTransaction[];
  isLoadingEscrowInternal: boolean;
  escrowInternalSearch: string;
  setEscrowInternalSearch: (value: string) => void;
  escrowInternalStatusFilter: string;
  setEscrowInternalStatusFilter: (value: string) => void;
  escrowInternalSortBy: string;
  setEscrowInternalSortBy: (value: string) => void;
  filteredEscrowInternal: WalletTransaction[];
  escrowInternalPage: number;
  setEscrowInternalPage: (value: number) => void;
  escrowInternalMeta?: {
    totalPages: number;
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
  };
  internalItemsPerPage: number;
}

export function EscrowWalletTab({
  escrowWallet,
  isLoading,
  escrowInternalTransactions,
  isLoadingEscrowInternal,
  escrowInternalSearch,
  setEscrowInternalSearch,
  escrowInternalStatusFilter,
  setEscrowInternalStatusFilter,
  escrowInternalSortBy,
  setEscrowInternalSortBy,
  filteredEscrowInternal,
  escrowInternalPage,
  setEscrowInternalPage,
  escrowInternalMeta,
  internalItemsPerPage,
}: EscrowWalletTabProps) {
  const router = useRouter();

  // Reset to page 1 when filters change (excluding search, which is handled in parent)
  useEffect(() => {
    setEscrowInternalPage(1);
  }, [escrowInternalStatusFilter, escrowInternalSortBy, setEscrowInternalPage]);

  const totalPages = escrowInternalMeta?.totalPages || 1;
  const totalItems = escrowInternalMeta?.totalItems || 0;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingCustom />
      ) : !escrowWallet ? (
        <ErrorCustom />
      ) : (
        <Card className="border-2 border-green-500/20 shadow-xl bg-gradient-to-br from-green-50/50 via-card/95 to-card/90 dark:from-green-950/30 dark:via-card/95 dark:to-card/90 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent pointer-events-none" />
          <CardHeader className="relative z-10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-muted-foreground mb-1">
                  Escrow Wallet Balance
                </CardTitle>
                <div className="text-5xl font-bold text-foreground tracking-tight mt-2">
                  {formatCurrency(escrowWallet.balance, escrowWallet.currency)}
                </div>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500/30 to-green-400/20 flex items-center justify-center shadow-lg">
                <Wallet className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                Transactions
              </CardTitle>
              <CardDescription>
                Recent transactions for the escrow wallet
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={escrowInternalSearch}
                  onChange={(e) => setEscrowInternalSearch(e.target.value)}
                  className="pl-8 h-12 text-sm"
                />
              </div>
              <Select
                value={escrowInternalSortBy}
                onValueChange={setEscrowInternalSortBy}
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
          {isLoadingEscrowInternal ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEscrowInternal.length === 0 ? (
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
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold w-min">
                      To/From
                    </TableHead>
                    <TableHead className="font-semibold">
                      Transaction Date
                    </TableHead>
                    <TableHead className="font-semibold w-min">
                      Transaction ID
                    </TableHead>
                    <TableHead className="font-semibold max-w-[200px]">
                      Note
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEscrowInternal.map((t, index) => {
                    // Get first segment of UUID (before first hyphen)
                    const transactionId = t.id.split("-")[0];
                    // Determine direction based on type
                    const isToRevenue = t.type === "TO_ESCROW";
                    const direction = isToRevenue ? "FROM" : "TO";
                    // Format amount with + or - based on type
                    const amountSign = isToRevenue ? "+" : "-";
                    const formattedAmount = `${amountSign}${formatCurrency(
                      t.amount,
                      escrowWallet?.currency || "VND"
                    )}`;
                    // Truncate note
                    const note = t.note || "-";
                    const truncatedNote =
                      note.length > 50 ? `${note.substring(0, 50)}...` : note;
                    // Calculate row number with pagination
                    const rowNumber =
                      (escrowInternalPage - 1) * internalItemsPerPage +
                      index +
                      1;

                    return (
                      <EscrowTransactionRow
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
                        currency={escrowWallet?.currency || "VND"}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoadingEscrowInternal &&
            filteredEscrowInternal.length > 0 &&
            escrowInternalMeta &&
            totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/10">
                <div className="text-sm text-muted-foreground">
                  Page {escrowInternalPage} of {totalPages} ({totalItems} total
                  transactions)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEscrowInternalPage(Math.max(1, escrowInternalPage - 1))
                    }
                    disabled={
                      escrowInternalPage === 1 || isLoadingEscrowInternal
                    }
                    className="border-2 border-primary/20 hover:border-primary/40"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEscrowInternalPage(
                        Math.min(totalPages, escrowInternalPage + 1)
                      )
                    }
                    disabled={
                      escrowInternalPage >= totalPages ||
                      isLoadingEscrowInternal
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
