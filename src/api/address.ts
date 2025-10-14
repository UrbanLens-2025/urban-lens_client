import axiosInstance from "./axios-config";
import type { ApiResponse, PaginatedData, Province, Ward } from "@/types"; 

export const getProvinces = async (search?: string): Promise<Province[]> => {
  const { data: apiResponse } = await axiosInstance.get<ApiResponse<PaginatedData<Province>>>('/v1/public/address/province', {
    params: {
      search: search,
      limit: 34,
    }
  });

  return apiResponse.data.data || []; 
};

export const getWardsByProvinceCode = async (provinceCode: string, search?: string): Promise<Ward[]> => {
  if (!provinceCode) return [];

  const { data: apiResponse } = await axiosInstance.get<ApiResponse<PaginatedData<Ward>>>(`/v1/public/address/province/${provinceCode}/ward`, {
    params: {
      search: search,
      limit: 168,
    }
  });

  return apiResponse.data.data || [];
};