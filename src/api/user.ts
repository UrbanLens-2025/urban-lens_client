import type { ApiResponse, User } from "@/types";
import axiosInstance from "./axios-config";

export async function getUser(): Promise<User> {
  const { data } = await axiosInstance.get<ApiResponse<User>>('/user/auth/profile');
  
  return data.data;
}

export type UpdateProfilePayload = Partial<Omit<User, 'id' | 'role' | 'email'>>;

export const updateProfile = async (profileData: UpdateProfilePayload): Promise<User> => {
  const { data } = await axiosInstance.patch<ApiResponse<User>>('/user/auth/profile', profileData);
  return data.data;
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload): Promise<ApiResponse<null>> => {
  const { data } = await axiosInstance.patch('/user/auth/profile/password', payload);
  return data;
};