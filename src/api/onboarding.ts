import axiosInstance from "./axios-config";
import type { ApiResponse, BusinessOnboardingPayload, CreatorOnboardingPayload } from "@/types";

export const submitBusinessOnboarding = async (payload: BusinessOnboardingPayload): Promise<ApiResponse<null>> => {
  const { data } = await axiosInstance.post('/v1/owner/account/onboard', payload);
  return data;
};

export const submitCreatorOnboarding = async (payload: CreatorOnboardingPayload): Promise<ApiResponse<null>> => {
  const { data } = await axiosInstance.post('/v1/creator/account/onboard', payload);
  return data;
};