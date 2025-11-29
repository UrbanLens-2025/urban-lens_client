"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle, CheckCircle2, Wallet, Plus } from "lucide-react";
import { useWallet } from "@/hooks/user/useWallet";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string; // Amount as string (e.g., "2350000.00")
  currency?: string; // Currency code (e.g., "VND")
  onConfirm?: () => void;
  onCancel?: () => void;
  onProceed?: () => Promise<void> | void;
  children?: React.ReactNode; // Dynamic payment details section
  returnUrl?: string;
}

export function PaymentModal({
  open,
  onOpenChange,
  amount,
  currency = "VND",
  onConfirm,
  onCancel,
  onProceed,
  children,
  returnUrl,
}: PaymentModalProps) {
  const { data: wallet, isLoading, error } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const amountNum = parseFloat(amount);
  const balanceNum = wallet ? parseFloat(wallet.balance) : 0;
  const hasEnoughBalance = balanceNum >= amountNum;
  const insufficientAmount = amountNum - balanceNum;

  const handleProceed = async () => {
    if (!hasEnoughBalance || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      if (onProceed) {
        await onProceed();
      }
      if (onConfirm) {
        onConfirm();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete payment.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleDepositRedirect = () => {
    onOpenChange(false);
    const depositPath = returnUrl
      ? `/dashboard/creator/wallet/deposit?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/dashboard/creator/wallet/deposit";
    router.push(depositPath);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Confirmation
          </DialogTitle>
          <DialogDescription>
            Review your payment details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load wallet information. Please try again.
              </AlertDescription>
            </Alert>
          ) : wallet ? (
            <>
              {/* Wallet Balance Card */}
              <Card className={hasEnoughBalance ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"}>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className={`h-5 w-5 ${hasEnoughBalance ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                      <div>
                        <p className={`text-sm font-medium ${hasEnoughBalance ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}>
                          Available Balance
                        </p>
                        <p className={`text-2xl font-bold ${hasEnoughBalance ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                          {formatCurrency(wallet.balance)}
                        </p>
                      </div>
                    </div>
                    {hasEnoughBalance ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  {!hasEnoughBalance && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleDepositRedirect}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Deposit to Wallet
                    </Button>
                  )}
                </CardContent>
              </Card>

              {children && <div className="space-y-3">{children}</div>}

              {/* Total Amount Row */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
              </div>

              {!hasEnoughBalance && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. You need {formatCurrency(insufficientAmount)} more to complete this payment.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleProceed}
            disabled={isLoading || isProcessing || !hasEnoughBalance}
            className="min-w-[120px]"
          >
            {isLoading || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLoading ? "Loading..." : "Processing..."}
              </>
            ) : (
              "Proceed to Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

