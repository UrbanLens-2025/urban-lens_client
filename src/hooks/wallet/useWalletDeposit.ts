"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createExternalDeposit } from "@/api/wallet";
import type { CreateExternalDepositPayload, WalletExternalTransaction } from "@/types";

const submitPaymentForm = (paymentUrl: string, checkoutFields: Record<string, string>) => {
  // Create a form element
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.style.display = "none";

  // Add all checkout fields as hidden inputs
  Object.entries(checkoutFields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  // Append form to body and submit
  document.body.appendChild(form);
  form.submit();
};

export function useWalletDeposit() {
  return useMutation<WalletExternalTransaction, Error, CreateExternalDepositPayload>({
    mutationFn: (payload) => createExternalDeposit(payload),
    onSuccess: (data) => {
      // Check if customMetadata with paymentUrl and checkoutFields exists
      if (data.customMetadata?.paymentUrl && data.customMetadata?.checkoutFields) {
        // Auto-submit form to payment gateway
        submitPaymentForm(data.customMetadata.paymentUrl, data.customMetadata.checkoutFields);
      } else if (data.paymentUrl) {
        // Fallback to direct redirect if paymentUrl exists but no customMetadata
        window.location.href = data.paymentUrl;
      } else {
        toast.error("Missing payment URL from provider.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate deposit. Please try again.");
    },
  });
}


