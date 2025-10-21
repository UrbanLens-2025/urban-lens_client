import axiosInstance from "./axios-config";
import type { ApiResponse, PaginatedData, LocationRequest, GetRequestsParams } from "@/types";

export interface ProcessRequestPayload {
  status: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export const getLocationRequestsForAdmin = async ({ page = 1, limit = 10, search, status }: GetRequestsParams): Promise<PaginatedData<LocationRequest>> => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<LocationRequest>>>(
    '/v1/admin/location-request/search', 
    {
      params: { page, limit, search, status }
    }
  );
  return data.data;
};

export const processLocationRequest = async ({ id, payload }: { id: string, payload: ProcessRequestPayload }) => {
  const { data } = await axiosInstance.post(`/v1/admin/location-request/process/${id}`, payload);
  return data;
};