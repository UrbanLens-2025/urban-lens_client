"use client";

import { useQueries } from "@tanstack/react-query";
import { getEscrowWallet, getSystemWallet } from "@/api/admin";

export function useAdminWallets() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['adminEscrowWallet'],
        queryFn: () => getEscrowWallet(),
        placeholderData: (previousData) => previousData,
      },
      {
        queryKey: ['adminSystemWallet'],
        queryFn: () => getSystemWallet(),
        placeholderData: (previousData) => previousData,
      },
    ],
  });

  return {
    escrowWallet: results[0].data,
    systemWallet: results[1].data,
    isLoading: results[0].isLoading || results[1].isLoading,
    isError: results[0].isError || results[1].isError,
    error: results[0].error || results[1].error,
  };
}

