import type { ApiResponse, User } from "@/types";
import axiosInstance from "./axios-config";

export async function getUser(): Promise<User> {
  const { data } = await axiosInstance.get<ApiResponse<User>>(
    "/v1/private/account"
  );

  return data.data;
}

export type UpdateProfilePayload = Partial<Omit<User, "id" | "role" | "email" | "phoneNumber">>;

export const updateProfile = async (
  profileData: UpdateProfilePayload
): Promise<User> => {
  const { data } = await axiosInstance.patch<ApiResponse<User>>(
    "/v1/auth/profile",
    profileData
  );
  return data.data;
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (
  payload: ChangePasswordPayload
): Promise<ApiResponse<null>> => {
  const { data } = await axiosInstance.patch(
    "/v1/auth/profile/password",
    payload
  );
  return data;
};

export async function getUserById(userId: string): Promise<User> {
  const { data } = await axiosInstance.get<ApiResponse<User>>(
    `/v1/public/account/info/${userId}`
  );
  return data.data;
}
