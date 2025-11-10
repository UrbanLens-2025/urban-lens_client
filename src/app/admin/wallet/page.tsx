"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, Lock, Unlock, RefreshCw, Calendar, TrendingUp } from "lucide-react";
import { useAdminWallets } from "@/hooks/admin/useAdminWallets";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const formatCurrency = (amount: string, currency: string = "VND") => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

function WalletCard({
  title,
  wallet,
  isLoading,
  icon: Icon,
  color,
}: {
  title: string;
  wallet: any;
  isLoading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No wallet data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge
            variant={wallet.isLocked ? "destructive" : "default"}
            className="flex items-center gap-1"
          >
            {wallet.isLocked ? (
              <>
                <Lock className="h-3 w-3" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3" />
                Active
              </>
            )}
          </Badge>
        </div>
        <CardDescription className="mt-2">
          {wallet.walletType === "ESCROW" 
            ? "Holds funds in escrow for location bookings"
            : "System wallet for platform operations"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Current Balance
          </div>
          <div className="text-3xl font-bold">
            {formatCurrency(wallet.balance, wallet.currency)}
          </div>
        </div>

        {/* Wallet Details */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Wallet ID</span>
            <span className="font-mono text-xs">{wallet.id}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Currency</span>
            <Badge variant="outline">{wallet.currency}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Transactions</span>
            <span className="font-semibold">{wallet.totalTransactions.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Owner</span>
            <span className="text-xs">
              {wallet.ownedBy ? (
                <span className="font-mono">{wallet.ownedBy}</span>
              ) : (
                <Badge variant="secondary">System</Badge>
              )}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Created: {format(new Date(wallet.createdAt), "MMM dd, yyyy HH:mm")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>Updated: {format(new Date(wallet.updatedAt), "MMM dd, yyyy HH:mm")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminWalletPage() {
  const { escrowWallet, systemWallet, isLoading, isError, error } = useAdminWallets();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminEscrowWallet'] });
    queryClient.invalidateQueries({ queryKey: ['adminSystemWallet'] });
  };

  const totalBalance = 
    (parseFloat(escrowWallet?.balance || "0") + parseFloat(systemWallet?.balance || "0")).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage system wallets
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-semibold">Failed to load wallet data</p>
              <p className="text-sm mt-1">
                {error instanceof Error ? error.message : "Unknown error occurred"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Balance Summary */}
      {!isLoading && (escrowWallet || systemWallet) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Total System Balance
            </CardTitle>
            <CardDescription>
              Combined balance across all system wallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalBalance, escrowWallet?.currency || systemWallet?.currency || "VND")}
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Escrow: </span>
                <span className="font-semibold">
                  {formatCurrency(escrowWallet?.balance || "0", escrowWallet?.currency || "VND")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">System: </span>
                <span className="font-semibold">
                  {formatCurrency(systemWallet?.balance || "0", systemWallet?.currency || "VND")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <WalletCard
          title="Escrow Wallet"
          wallet={escrowWallet}
          isLoading={isLoading}
          icon={Wallet}
          color="text-green-600 dark:text-green-400"
        />
        <WalletCard
          title="System Wallet"
          wallet={systemWallet}
          isLoading={isLoading}
          icon={Wallet}
          color="text-blue-600 dark:text-blue-400"
        />
      </div>
    </div>
  );
}

