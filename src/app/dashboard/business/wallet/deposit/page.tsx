"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWallet } from "@/hooks/user/useWallet";
import { useWalletDeposit } from "@/hooks/wallet/useWalletDeposit";
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
  const { data: wallet } = useWallet();
  const deposit = useWalletDeposit();

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema) as any,
    defaultValues: {
      amount: 100000,
      currency: wallet?.currency || "VND",
    },
  });

  useEffect(() => {
    if (wallet?.currency) {
      form.setValue("currency", wallet.currency);
    }
  }, [wallet?.currency, form]);

  const onSubmit = (data: DepositForm) => {
    // Use mock strings for non-UI fields
    deposit.mutate({
      amount: data.amount,
      currency: data.currency,
      returnUrl: "http://google.com",
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

