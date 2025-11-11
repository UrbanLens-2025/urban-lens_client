"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminExternalTransactions } from "@/api/admin";
import { GetWalletExternalTransactionsParams } from "@/types";

export function useAdminExternalTransactions(params: GetWalletExternalTransactionsParams) {
  return useQuery({
    queryKey: ['adminExternalTransactions', params],
    queryFn: () => getAdminExternalTransactions(params),
    placeholderData: (previousData) => previousData,
  });
}

