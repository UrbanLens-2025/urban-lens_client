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

export const suspendAccountPenalty = async (params: {
  suspendUntil: string;
  suspensionReason: string;
  targetEntityId: string;
  targetEntityType: "post";
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/penalty/suspend-account",
    params
  );
};

export const banAccountPenalty = async (params: {
  suspensionReason: string;
  targetEntityId: string;
  targetEntityType: "post";
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/penalty/ban-account",
    params
  );
};

export const suspendEventCreationPenalty = async (params: {
  suspendUntil: string;
  suspensionReason: string;
  targetEntityId: string;
  targetEntityType: "event";
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/penalty/suspend-event-creation",
    params
  );
};

export const forceCancelEventPenalty = async (params: {
  targetEntityId: string;
  targetEntityType: "event";
  reason: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/penalty/force-cancel-event",
    params
  );
};

export const suspendLocationBookingPenalty = async (params: {
  targetEntityId: string;
  targetEntityType: "location";
  suspensionReason: string;
  suspendedUntil: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/penalty/suspend-location-booking",
    params
  );
};

export const suspendLocationPenalty = async (params: {
  targetEntityId: string;
  targetEntityType: "location";
  suspensionReason: string;
  suspendedUntil: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>("/v1/admin/penalty/suspend-location", params);
};

export const fineLocationBookingPenalty = async (params: {
  targetEntityId: string;
  targetEntityType: "booking";
  fineAmount: number;
  fineReason: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/penalty/fine-location-booking",
    params
  );
};

