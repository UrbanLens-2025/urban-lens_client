"use client";

import { useQuery } from "@tanstack/react-query";
import {  } from "@/api/user";
import { getWalletExternalTransactionById } from "@/api/wallet";

export function useWalletTransactionById(transactionId: string | null) {
  return useQuery({
    queryKey: ['walletExternalTransactionDetail', transactionId],
    queryFn: () => getWalletExternalTransactionById(transactionId!),
    enabled: !!transactionId,
  });
}