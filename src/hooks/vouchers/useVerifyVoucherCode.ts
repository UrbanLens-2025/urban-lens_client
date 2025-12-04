"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyVoucherCode, VerifyVoucherCodePayload } from "@/api/vouchers";

export function useVerifyVoucherCode() {
  return useMutation({
    mutationFn: (payload: VerifyVoucherCodePayload) => 
      verifyVoucherCode(payload),
    
    onSuccess: (data) => {
      toast.success(data.message || "Voucher verified and marked as used successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to verify voucher code.");
    },
  });
}

