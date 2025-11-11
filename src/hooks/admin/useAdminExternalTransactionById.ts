"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminExternalTransactionById } from "@/api/admin";

export function useAdminExternalTransactionById(transactionId: string | null) {
  return useQuery({
    queryKey: ['adminExternalTransactionDetail', transactionId],
    queryFn: () => getAdminExternalTransactionById(transactionId!),
    enabled: !!transactionId,
  });
}

