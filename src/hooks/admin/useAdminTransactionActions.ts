"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  startProcessingWithdrawTransaction,
  completeProcessingWithdrawTransaction,
  markTransferFailed,
  rejectWithdrawTransaction,
} from "@/api/admin";

export function useStartProcessingWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => startProcessingWithdrawTransaction(transactionId),
    onSuccess: () => {
      toast.success("Transaction processing started successfully");
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactionDetail'] });
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to start processing transaction");
    },
  });
}

export function useCompleteProcessingWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, proofOfTransferImages, transferBankTransactionId }: { transactionId: string; proofOfTransferImages: string[]; transferBankTransactionId: string }) =>
      completeProcessingWithdrawTransaction(transactionId, proofOfTransferImages, transferBankTransactionId),
    onSuccess: () => {
      toast.success("Transaction processing completed successfully");
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactionDetail'] });
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to complete processing transaction");
    },
  });
}

export function useMarkTransferFailed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, failureReason }: { transactionId: string; failureReason: string }) =>
      markTransferFailed(transactionId, failureReason),
    onSuccess: () => {
      toast.success("Transaction marked as failed");
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactionDetail'] });
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to mark transaction as failed");
    },
  });
}

export function useRejectWithdrawTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, rejectionReason }: { transactionId: string; rejectionReason: string }) =>
      rejectWithdrawTransaction(transactionId, rejectionReason),
    onSuccess: () => {
      toast.success("Transaction rejected successfully");
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactionDetail'] });
      queryClient.invalidateQueries({ queryKey: ['adminExternalTransactions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reject transaction");
    },
  });
}

