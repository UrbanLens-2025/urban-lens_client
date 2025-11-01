"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteLocationVoucher } from "@/api/vouchers";

export function useDeleteLocationVoucher(locationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (voucherId: string) => 
      deleteLocationVoucher({ locationId, voucherId }),
    
    onSuccess: () => {
      toast.success("Voucher deleted successfully!");
      queryClient.invalidateQueries({ 
        queryKey: ['locationVouchers', { locationId }] 
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete voucher.");
    },
  });
}