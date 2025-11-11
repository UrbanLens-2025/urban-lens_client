"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createExternalWithdraw } from "@/api/wallet";
import { useRouter, usePathname } from "next/navigation";
import type { CreateExternalWithdrawPayload, WalletExternalTransaction } from "@/types";

export function useWalletWithdraw() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return useMutation<WalletExternalTransaction, Error, CreateExternalWithdrawPayload>({
    mutationFn: (payload) => createExternalWithdraw(payload),
    onSuccess: (data) => {
      toast.success("Withdrawal request submitted successfully!");
      
      // Invalidate wallet and transactions queries
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletExternalTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      
      // Navigate to transaction detail page based on current route
      const isBusiness = pathname?.includes('/business/');
      const walletPath = isBusiness ? '/dashboard/business/wallet' : '/dashboard/creator/wallet';
      router.push(`${walletPath}/${data.id}?type=external`);
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit withdrawal request. Please try again.");
    },
  });
}

