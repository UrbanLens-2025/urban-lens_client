/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type { ApiResponse, Penalty } from "@/types";

export const getEventPenalties = async (
  eventId: string
): Promise<Penalty[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Penalty[]>>(
    `/v1/creator/penalty/event/${eventId}`
  );
  return data.data;
};

