"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletTransactions } from "@/api/wallet";
import type { GetWalletTransactionsParams } from "@/types";

export function useWalletTransactions(params: GetWalletTransactionsParams) {
  return useQuery({
    queryKey: ['walletTransactions', params.page, params.limit, params.sortBy],
    queryFn: () => getWalletTransactions(params),
  });
}


