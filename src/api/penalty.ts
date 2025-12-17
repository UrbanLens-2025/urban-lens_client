"use client";

import axiosInstance from "./axios-config";
import type { ApiResponse, Penalty, ReportEntityType } from "@/types";

export const getPenaltiesByTarget = async (
  targetId: string,
  targetType: ReportEntityType
): Promise<Penalty[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Penalty[]>>(
    "/v1/admin/penalty/by-target",
    {
      params: {
        targetId,
        targetType,
      },
    }
  );

  return data.data;
};

// Ban a post (penalty)
export const banPostPenalty = async (params: {
  targetEntityId: string;
  targetEntityType: "post";
  banReason: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>("/v1/admin/penalty/ban-post", params);
};

export const warnUserPenalty = async (params: {
  targetEntityId: string;
  targetEntityType: "post" | "event" | "location";
  warningNote: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>("/v1/admin/penalty/warn-user", params);
};

