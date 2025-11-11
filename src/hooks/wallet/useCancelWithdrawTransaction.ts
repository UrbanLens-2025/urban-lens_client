"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelWithdrawTransaction } from "@/api/wallet";
import { useRouter, usePathname } from "next/navigation";

export function useCancelWithdrawTransaction() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return useMutation({
    mutationFn: (transactionId: string) => cancelWithdrawTransaction(transactionId),
    onSuccess: (data) => {
      toast.success("Withdrawal transaction cancelled successfully");
      
      // Invalidate wallet and transactions queries
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['walletExternalTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['walletExternalTransactionDetail'] });
      
      // Refresh the current page to show updated status
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel withdrawal transaction. Please try again.");
    },
  });
}

