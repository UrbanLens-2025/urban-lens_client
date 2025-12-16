"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminInternalWalletTransactionById } from "@/api/admin";

export function useAdminInternalWalletTransactionById(
  transactionId: string | null
) {
  return useQuery({
    queryKey: ["adminInternalWalletTransactionDetail", transactionId],
    queryFn: () => getAdminInternalWalletTransactionById(transactionId!),
    enabled: !!transactionId,
  });
}


