"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLocationVoucher } from "@/api/vouchers";
import { UpdateLocationVoucherPayload } from "@/types";
import { useRouter } from "next/navigation";

export function useUpdateLocationVoucher() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ 
      locationId, 
      voucherId, 
      payload 
    }: { 
      locationId: string, 
      voucherId: string, 
      payload: UpdateLocationVoucherPayload 
    }) => 
      updateLocationVoucher({ locationId, voucherId, payload }),
    
    onSuccess: (updatedVoucher) => {
      toast.success("Voucher updated successfully!");
      
      queryClient.invalidateQueries({ 
        queryKey: ['locationVouchers', { locationId: updatedVoucher.locationId }] 
      });
      queryClient.setQueryData(
        ['locationVoucher', updatedVoucher.id], 
        updatedVoucher
      );
      
      router.back();
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update voucher.");
    },
  });
}