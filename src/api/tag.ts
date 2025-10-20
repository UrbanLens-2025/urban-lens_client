import axiosInstance from "./axios-config";
import type { ApiResponse, PaginatedData, Tag } from "@/types";

export const getAllTags = async (): Promise<PaginatedData<Tag>> => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Tag>>>('/v1/public/tag');
  return data.data;
};