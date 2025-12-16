"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminInternalWalletTransactions } from "@/api/admin";
import type { GetAdminWalletTransactionsParams } from "@/types";

export function useAdminInternalWalletTransactions(
  params: GetAdminWalletTransactionsParams | null
) {
  return useQuery({
    queryKey: params
      ? ['adminInternalWalletTransactions', params.walletId, params.page, params.limit, params.sortBy]
      : ['adminInternalWalletTransactions', 'disabled'],
    queryFn: () => {
      if (!params) {
        throw new Error("walletId is required to fetch internal transactions");
      }
      return getAdminInternalWalletTransactions(params);
    },
    enabled: !!params?.walletId,
    placeholderData: (previousData) => previousData,
  });
}


