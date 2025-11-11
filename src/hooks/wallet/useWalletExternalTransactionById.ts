"use client";

import { useQuery } from "@tanstack/react-query";
import {  } from "@/api/user";
import { getWalletExternalTransactionById } from "@/api/wallet";

export function useWalletExternalTransactionById(transactionId: string | null) {
  return useQuery({
    queryKey: ['walletExternalTransactionDetail', transactionId],
    queryFn: () => getWalletExternalTransactionById(transactionId!),
    enabled: !!transactionId,
  });
}

// Keep the old name for backward compatibility (deprecated - use useWalletExternalTransactionById instead)
export function useWalletTransactionById(transactionId: string | null) {
  return useWalletExternalTransactionById(transactionId);
}