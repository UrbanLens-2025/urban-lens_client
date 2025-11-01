"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLocationVoucher } from "@/api/vouchers";
import { CreateLocationVoucherPayload } from "@/types";
import { useRouter } from "next/navigation";

export function useCreateLocationVoucher(locationId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateLocationVoucherPayload) => 
      createLocationVoucher({ locationId, payload }),
    
    onSuccess: () => {
      toast.success("New voucher created successfully!");
      queryClient.invalidateQueries({ queryKey: ['locationVouchers', { locationId }] });
      
      router.back();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create voucher.");
    },
  });
}