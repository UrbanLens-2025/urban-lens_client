"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@/hooks/user/useWallet";
import { useWalletDeposit } from "@/hooks/wallet/useWalletDeposit";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, ArrowLeft, Landmark } from "lucide-react";

const depositSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .int("Amount must be a whole number")
    .positive("Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function BusinessWalletDepositPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: wallet } = useWallet();
  const deposit = useWalletDeposit();

  // Get amount from query parameter
  const amountParam = searchParams.get("amount");
  const defaultAmount = amountParam ? parseInt(amountParam, 10) : 100000;

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema) as any,
    defaultValues: {
      amount: defaultAmount,
      currency: wallet?.currency || "VND",
    },
  });

  useEffect(() => {
    if (wallet?.currency) {
      form.setValue("currency", wallet.currency);
    }
  }, [wallet?.currency, form]);

  useEffect(() => {
    if (amountParam) {
      const parsedAmount = parseInt(amountParam, 10);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        form.setValue("amount", parsedAmount);
      }
    }
  }, [amountParam, form]);

  const onSubmit = (data: DepositForm) => {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const fromEvent = searchParams.get("fromEvent") === "true";
    
    let returnUrl: string;
    if (isLocalhost) {
      // Keep localhost return URL unchanged
      returnUrl = "https://google.com";
    } else if (fromEvent) {
      // If fromEvent=true, redirect to create event page (production only)
      returnUrl = `${window.location.origin}/dashboard/creator/request/create`;
    } else {
      // Default production return URL
      returnUrl = `${window.location.origin}/dashboard/business/wallet?tab=external`;
    }
    
    deposit.mutate({
      amount: data.amount,
      currency: data.currency,
      returnUrl,
      afterAction: "NONE",
    });
  };

  // Redirect happens after user submits and backend returns paymentUrl

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank Deposit via Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show an immediate redirecting state while we initiate the payment */}
          {deposit.isPending ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting to payment provider...
            </div>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1000}
                          step={1000}
                          placeholder="Enter amount"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Enter the amount to deposit</FormDescription>
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
                        <Select value={field.value} onValueChange={field.onChange}>
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

              {/* returnUrl and afterAction are handled internally; no UI fields needed */}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={deposit.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={deposit.isPending}>
                  {deposit.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>Proceed to Payment</>
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

