import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/api/axios-config"; 
import { ApiResponse } from "@/types";

export const useWalletLimit = (walletId?: string) => {
  return useQuery({
    queryKey: ["wallet-limit", walletId],
    queryFn: async () => {
      if (!walletId) return null;
      const res = await axiosInstance.get<ApiResponse<{ maxAmount: number; currentAmount: number }>>(`/v1/private/wallet/daily-withdraw-amount/${walletId}`);
      return res.data.data as { maxAmount: number; currentAmount: number };
    },
    enabled: !!walletId,
  });
};