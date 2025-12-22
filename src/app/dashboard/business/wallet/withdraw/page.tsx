"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@/hooks/user/useWallet";
import { useWalletWithdraw } from "@/hooks/wallet/useWalletWithdraw";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Landmark, Building2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useWalletLimit } from "@/hooks/wallet/useWalletLimit";

const withdrawSchema = z.object({
  amountToWithdraw: z
    .number({ error: "Amount is required" })
    .int("Amount must be a whole number")
    .positive("Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  withdrawBankName: z.string().min(1, "Bank name is required"),
  withdrawBankAccountNumber: z.string().min(1, "Bank account number is required"),
  withdrawBankAccountName: z.string().min(1, "Bank account name is required"),
});

type WithdrawForm = z.infer<typeof withdrawSchema>;

const bankOptions = [
  { value: "Vietcombank", label: "Vietcombank" },
  { value: "Techcombank", label: "Techcombank" },
  { value: "BIDV", label: "BIDV" },
  { value: "ACB", label: "ACB" },
  { value: "Vietinbank", label: "Vietinbank" },
  { value: "NCB Bank", label: "NCB Bank" },
  { value: "TPBank", label: "TPBank" },
  { value: "VPBank", label: "VPBank" },
  { value: "Sacombank", label: "Sacombank" },
  { value: "MBBank", label: "MBBank" },
];

export default function BusinessWalletWithdrawPage() {
  const router = useRouter();
  const { data: wallet } = useWallet();
  const withdraw = useWalletWithdraw();

  const form = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema) as any,
    defaultValues: {
      amountToWithdraw: 100000,
      currency: wallet?.currency || "VND",
      withdrawBankName: "",
      withdrawBankAccountNumber: "",
      withdrawBankAccountName: "",
    },
  });

  useEffect(() => {
    if (wallet?.currency) {
      form.setValue("currency", wallet.currency);
    }
  }, [wallet?.currency, form]);

  const totalBalance = wallet ? parseFloat(wallet.balance) : 0;
  const currency = wallet?.currency || "VND";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const { data: limit } = useWalletLimit(wallet?.id);

  const remainingLimit = limit ? limit.maxAmount - limit.currentAmount : 0;

  const onSubmit = (data: WithdrawForm) => {
    // 1. Kiểm tra số dư ví
    if (data.amountToWithdraw > totalBalance) {
      form.setError("amountToWithdraw", {
        type: "manual",
        message: "Withdrawal amount cannot exceed your balance",
      });
      return;
    }

    // 2. Kiểm tra hạn mức ngày (Mới)
    if (limit && data.amountToWithdraw > remainingLimit) {
      form.setError("amountToWithdraw", {
        type: "manual",
        message: `Amount exceeds your remaining daily limit (${formatCurrency(remainingLimit)})`,
      });
      return;
    }

    withdraw.mutate(data);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Withdraw from Wallet</h1>
        </div>
      </div>

      {/* Balance Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalBalance)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Daily Limit Remaining</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {limit ? formatCurrency(remainingLimit) : "---"}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Max: {limit ? formatCurrency(limit.maxAmount) : "---"}</p>
                      <p>Used: {limit ? formatCurrency(limit.currentAmount) : "---"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {wallet?.isLocked && (
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Your wallet is locked. Withdrawals are not available.</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank Withdrawal Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amountToWithdraw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1000}
                          step={1000}
                          placeholder="Enter amount"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={wallet?.isLocked}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum: {formatCurrency(totalBalance)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange} disabled={wallet?.isLocked}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VND">VND</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>Currently only VND is supported</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Account Information
                </h3>

                <FormField
                  control={form.control}
                  name="withdrawBankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange} disabled={wallet?.isLocked}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankOptions.map((bank) => (
                              <SelectItem key={bank.value} value={bank.value}>
                                {bank.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="withdrawBankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter bank account number"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={wallet?.isLocked}
                        />
                      </FormControl>
                      <FormDescription>Enter the bank account number to receive funds</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="withdrawBankAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter account holder name"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={wallet?.isLocked}
                        />
                      </FormControl>
                      <FormDescription>Name as it appears on the bank account</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={withdraw.isPending || wallet?.isLocked}>
                  Cancel
                </Button>
                <Button type="submit" disabled={withdraw.isPending || wallet?.isLocked}>
                  {withdraw.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Submit Withdrawal Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

