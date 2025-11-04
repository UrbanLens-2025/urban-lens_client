"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletExternalTransactions } from "@/api/wallet";
import { GetWalletExternalTransactionsParams } from "@/types";

export function useWalletExternalTransactions(params: GetWalletExternalTransactionsParams) {
  return useQuery({
    queryKey: ['walletExternalTransactions', params],
    queryFn: () => getWalletExternalTransactions(params),
    placeholderData: (previousData) => previousData,
  });
}