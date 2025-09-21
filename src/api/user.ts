import type { ApiResponse, User } from "@/types";
import axiosInstance from "./axios-config";

export async function getUser(): Promise<User> {
  const { data } = await axiosInstance.get<ApiResponse<User>>('/user/auth/profile');
  
  return data.data;
}

export type UpdateProfilePayload = Partial<Omit<User, 'id' | 'role' | 'email'>>;

export const updateProfile = async (profileData: UpdateProfilePayload): Promise<User> => {
  const { data } = await axiosInstance.put<ApiResponse<User>>('/user/auth/profile', profileData);
  return data.data;
};