"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletTransactionById } from "@/api/wallet";

export function useWalletInternalTransactionById(transactionId: string | null | undefined) {
  return useQuery({
    queryKey: ['walletTransactionInternal', transactionId],
    queryFn: () => getWalletTransactionById(transactionId!),
    enabled: !!transactionId,
  });
}


