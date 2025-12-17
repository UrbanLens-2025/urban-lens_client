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

