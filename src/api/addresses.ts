/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type {
  ApiResponse,
  PaginatedData,
  Province,
  GetProvincesParams,
  CreateProvincePayload,
  UpdateProvincePayload,
  Ward,
  GetWardsParams,
  CreateWardPayload,
  UpdateWardPayload,
} from "@/types";

export const getProvinces = async ({
  page = 1,
  limit = 20,
  search,
  sortBy,
}: GetProvincesParams): Promise<PaginatedData<Province>> => {
  const params: any = {
    page,
    limit,
  };

  if (search) {
    params.search = search;
    params.searchBy = ["name"];
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<Province>>
  >("/v1/admin/address/provinces/search", {
    params: params,
  });
  return data.data;
};

export const createProvinces = async (
  payload: CreateProvincePayload
): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.post<ApiResponse<any>>(
    "/v1/admin/address/provinces",
    payload
  );
  return data;
};

export const updateProvince = async (
  code: string,
  payload: UpdateProvincePayload
): Promise<ApiResponse<Province>> => {
  const { data } = await axiosInstance.put<ApiResponse<Province>>(
    `/v1/admin/address/provinces/${code}`,
    payload
  );
  return data;
};

export const getWards = async ({
  page = 1,
  limit = 20,
  search,
  sortBy,
  provinceCode,
}: GetWardsParams): Promise<PaginatedData<Ward>> => {
  const params: any = {
    page,
    limit,
  };

  if (search) {
    params.search = search;
    params.searchBy = ["name"];
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  if (provinceCode) {
    params["filter.provinceCode"] = `$eq:${provinceCode}`;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<Ward>>
  >("/v1/admin/address/wards/search", {
    params: params,
  });
  return data.data;
};

export const createWards = async (
  payload: CreateWardPayload
): Promise<ApiResponse<any>> => {
  const { data } = await axiosInstance.post<ApiResponse<any>>(
    "/v1/admin/address/wards",
    payload
  );
  return data;
};

export const updateWard = async (
  code: string,
  payload: UpdateWardPayload
): Promise<ApiResponse<Ward>> => {
  const { data } = await axiosInstance.put<ApiResponse<Ward>>(
    `/v1/admin/address/wards/${code}`,
    payload
  );
  return data;
};

