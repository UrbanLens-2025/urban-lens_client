"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createExternalDeposit } from "@/api/wallet";
import type { CreateExternalDepositPayload, WalletExternalTransaction } from "@/types";

export function useWalletDeposit() {
  return useMutation<WalletExternalTransaction, Error, CreateExternalDepositPayload>({
    mutationFn: (payload) => createExternalDeposit(payload),
    onSuccess: (data) => {
      const paymentUrl = data.paymentUrl;
      if (paymentUrl) {
        // Redirect to payment provider
        window.location.href = paymentUrl;
      } else {
        toast.error("Missing payment URL from provider.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate deposit. Please try again.");
    },
  });
}


