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
} from "lucide-react";
import { useState } from "react";

// Mock internal transaction data (wallet-to-wallet)
const mockInternalTransactions = [
  {
    id: "int_001",
    type: "transfer_out",
    amount: 25000,
    description: "Payment to vendor",
    otherParty: "John's Catering Services",
    otherPartyType: "business",
    status: "completed",
    date: "2025-10-28T14:30:00",
    reference: "INT-2025-001",
  },
  {
    id: "int_002",
    type: "transfer_in",
    amount: 45000,
    description: "Revenue from Summer Music Festival 2025",
    otherParty: "Event Ticket Platform",
    otherPartyType: "system",
    status: "completed",
    date: "2025-10-26T16:45:00",
    reference: "INT-2025-002",
  },
  {
    id: "int_003",
    type: "transfer_in",
    amount: 120000,
    description: "Revenue from Tech Conference: Future of AI",
    otherParty: "Event Ticket Platform",
    otherPartyType: "system",
    status: "completed",
    date: "2025-10-24T18:30:00",
    reference: "INT-2025-003",
  },
  {
    id: "int_004",
    type: "transfer_out",
    amount: 12000,
    description: "Service fee payment",
    otherParty: "Platform Services",
    otherPartyType: "system",
    status: "completed",
    date: "2025-10-23T09:15:00",
    reference: "INT-2025-004",
  },
  {
    id: "int_005",
    type: "transfer_in",
    amount: 15000,
    description: "Revenue from Art Exhibition Opening",
    otherParty: "Event Ticket Platform",
    otherPartyType: "system",
    status: "completed",
    date: "2025-10-22T10:15:00",
    reference: "INT-2025-005",
  },
  {
    id: "int_006",
    type: "transfer_in",
    amount: 8500,
    description: "Revenue from Food & Wine Tasting Event",
    otherParty: "Event Ticket Platform",
    otherPartyType: "system",
    status: "completed",
    date: "2025-10-20T12:30:00",
    reference: "INT-2025-006",
  },
];

// Mock external transaction data (bank-to-wallet or wallet-to-bank)
const mockExternalTransactions = [
  {
    id: "ext_001",
    type: "deposit",
    amount: 50000,
    description: "Bank transfer deposit",
    bankName: "Vietcombank",
    accountNumber: "****1234",
    status: "completed",
    date: "2025-10-28T14:30:00",
    reference: "EXT-2025-001",
    transactionFee: 0,
  },
  {
    id: "ext_002",
    type: "withdrawal",
    amount: 15000,
    description: "Withdrawal to bank account",
    bankName: "Techcombank",
    accountNumber: "****5678",
    status: "completed",
    date: "2025-10-27T09:15:00",
    reference: "EXT-2025-002",
    transactionFee: 500,
  },
  {
    id: "ext_003",
    type: "deposit",
    amount: 100000,
    description: "Bank transfer deposit",
    bankName: "BIDV",
    accountNumber: "****9012",
    status: "completed",
    date: "2025-10-25T11:20:00",
    reference: "EXT-2025-003",
    transactionFee: 0,
  },
  {
    id: "ext_004",
    type: "withdrawal",
    amount: 30000,
    description: "Withdrawal to bank account",
    bankName: "Vietcombank",
    accountNumber: "****1234",
    status: "pending",
    date: "2025-10-23T13:00:00",
    reference: "EXT-2025-004",
    transactionFee: 500,
  },
  {
    id: "ext_005",
    type: "deposit",
    amount: 25000,
    description: "Bank transfer deposit",
    bankName: "ACB",
    accountNumber: "****3456",
    status: "completed",
    date: "2025-10-21T15:45:00",
    reference: "EXT-2025-005",
    transactionFee: 0,
  },
  {
    id: "ext_006",
    type: "withdrawal",
    amount: 50000,
    description: "Withdrawal to bank account",
    bankName: "Techcombank",
    accountNumber: "****5678",
    status: "failed",
    date: "2025-10-19T08:00:00",
    reference: "EXT-2025-006",
    transactionFee: 0,
  },
];

const getInternalTransactionIcon = (type: string, otherPartyType: string) => {
  if (otherPartyType === "system") {
    return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
  }
  if (type === "transfer_in") {
    return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
  }
  return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
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

export default function CreatorWalletPage() {
  const [currentInternalPage, setCurrentInternalPage] = useState(1);
  const [currentExternalPage, setCurrentExternalPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate balance from all completed transactions
  const internalBalance = mockInternalTransactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => {
      if (t.type === "transfer_out") {
        return sum - t.amount;
      }
      return sum + t.amount;
    }, 0);

  const externalBalance = mockExternalTransactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => {
      if (t.type === "withdrawal") {
        return sum - (t.amount + t.transactionFee);
      }
      return sum + t.amount;
    }, 0);

  const totalBalance = internalBalance + externalBalance;


  // Calculate statistics
  const stats = {
    totalDeposits: mockExternalTransactions
      .filter(t => t.type === "deposit" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: mockExternalTransactions
      .filter(t => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
    totalEarnings: mockInternalTransactions
      .filter(t => t.type === "transfer_in" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
  };

  // Pagination for internal transactions
  const totalInternalPages = Math.ceil(mockInternalTransactions.length / itemsPerPage);
  const paginatedInternalTransactions = mockInternalTransactions.slice(
    (currentInternalPage - 1) * itemsPerPage,
    currentInternalPage * itemsPerPage
  );

  // Pagination for external transactions
  const totalExternalPages = Math.ceil(mockExternalTransactions.length / itemsPerPage);
  const paginatedExternalTransactions = mockExternalTransactions.slice(
    (currentExternalPage - 1) * itemsPerPage,
    currentExternalPage * itemsPerPage
  );


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
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
            <div className="text-4xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <div className="flex gap-3">
              <Button 
                className="bg-white text-blue-600 hover:bg-gray-100"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Deposit
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
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
              {formatCurrency(stats.totalEarnings)}
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
          <Tabs defaultValue="internal" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="internal">
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Internal
              </TabsTrigger>
              <TabsTrigger value="external">
                <Building2 className="h-4 w-4 mr-2" />
                External
              </TabsTrigger>
            </TabsList>

            {/* Internal Transactions Tab */}
            <TabsContent value="internal" className="space-y-4">
              <div className="rounded-md border border-blue-200 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/50 p-3 mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-medium flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  Internal transactions are transfers between wallets within the platform
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>From/To</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInternalTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          {getInternalTransactionIcon(transaction.type, transaction.otherPartyType)}
                          <span className="text-sm font-medium truncate">
                            {getTypeLabel(transaction.type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-sm truncate block">{transaction.description}</span>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="flex items-center gap-2 min-w-0">
                          {transaction.otherPartyType === 'business' ? (
                            <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ArrowLeftRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm text-muted-foreground truncate">
                            {transaction.otherParty}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-mono truncate block">
                          {transaction.reference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(transaction.date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(transaction.status)}>
                          {getStatusLabel(transaction.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span 
                          className={`text-sm font-bold whitespace-nowrap ${
                            transaction.type === "transfer_out"
                              ? "text-orange-600" 
                              : "text-green-600"
                          }`}
                        >
                          {getTransactionSign(transaction.type)}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedInternalTransactions.length} of {mockInternalTransactions.length} internal transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentInternalPage((p) => Math.max(1, p - 1))}
                    disabled={currentInternalPage === 1}
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
                    disabled={currentInternalPage === totalInternalPages}
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
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExternalTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          {getExternalTransactionIcon(transaction.type)}
                          <span className="text-sm font-medium truncate">
                            {getTypeLabel(transaction.type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-sm truncate block">{transaction.description}</span>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                              {transaction.bankName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {transaction.accountNumber}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-mono truncate block">
                          {transaction.reference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(transaction.date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(transaction.status)}>
                          {getStatusLabel(transaction.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {transaction.transactionFee > 0 ? formatCurrency(transaction.transactionFee) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span 
                          className={`text-sm font-bold whitespace-nowrap ${
                            transaction.type === "withdrawal"
                              ? "text-orange-600" 
                              : "text-green-600"
                          }`}
                        >
                          {getTransactionSign(transaction.type)}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedExternalTransactions.length} of {mockExternalTransactions.length} external transactions
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentExternalPage((p) => Math.max(1, p - 1))}
                    disabled={currentExternalPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentExternalPage} of {totalExternalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentExternalPage((p) => Math.min(totalExternalPages, p + 1))}
                    disabled={currentExternalPage === totalExternalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
