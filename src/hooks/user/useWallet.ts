"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletInfo } from "@/api/wallet";

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'], 
    queryFn: getWalletInfo,
  });
}