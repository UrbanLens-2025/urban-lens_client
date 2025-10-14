import axiosInstance from "./axios-config";
import type { ApiResponse, BusinessOnboardingPayload, BusinessStatusResponse, CreatorOnboardingPayload } from "@/types";

export const submitBusinessOnboarding = async (payload: BusinessOnboardingPayload): Promise<ApiResponse<null>> => {
  const { data } = await axiosInstance.post('/v1/account/owner/onboard', payload);
  return data;
};

export const submitCreatorOnboarding = async (payload: CreatorOnboardingPayload): Promise<ApiResponse<null>> => {
  const { data } = await axiosInstance.post('/v1/creator/account/onboard', payload);
  return data;
};

export const getBusinessOnboardingStatus = async (): Promise<BusinessStatusResponse> => {
  const { data } = await axiosInstance.get<ApiResponse<BusinessStatusResponse>>('/v1/account/owner/onboard-status');
  return data.data;
};