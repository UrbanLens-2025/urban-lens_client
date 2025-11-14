"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateOneTimeQRCode, GenerateOneTimeQRCodePayload } from "@/api/missions";

export function useGenerateOneTimeQRCode(locationId: string) {
  return useMutation({
    mutationFn: (payload?: GenerateOneTimeQRCodePayload) =>
      generateOneTimeQRCode({ locationId, payload }),
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate QR code.");
    },
  });
}

