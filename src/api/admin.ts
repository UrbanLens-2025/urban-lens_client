/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type {
  ApiResponse,
  PaginatedData,
  LocationRequest,
  GetRequestsParams,
  ProcessRequestPayload,
} from "@/types";

export const getLocationRequestsForAdmin = async ({
  page = 1,
  limit = 10,
  search,
  status,
  sortBy
}: GetRequestsParams): Promise<PaginatedData<LocationRequest>> => {
  const params: any = {
    page,
    limit,
  };

  if (search) {
    params.search = search;
    params.searchBy = ['name']; 
  }

  if (status) {
    params["filter.status"] = `$eq:${status}`;
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationRequest>>
  >("/v1/admin/location-request/search", {
    params: params,
  });
  return data.data;
};

export const processLocationRequest = async ({
  id,
  payload,
}: {
  id: string;
  payload: ProcessRequestPayload;
}) => {
  const { data } = await axiosInstance.post(
    `/v1/admin/location-request/process/${id}`,
    payload
  );
  return data;
};

export const getLocationRequestByIdForAdmin = async (id: string): Promise<LocationRequest> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationRequest>>(
    `/v1/admin/location-request/search/${id}` 
  );
  return data.data;
};