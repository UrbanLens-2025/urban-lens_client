/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";

import {
  ApiResponse,
  CreateLocationVoucherPayload,
  GetLocationVouchersParams,
  LocationVoucher,
  PaginatedData,
  UpdateLocationVoucherPayload,
} from "@/types";

export const getLocationVouchers = async ({
  locationId,
  page = 1,
  limit = 10,
  sortBy = "createdAt:DESC",
  search,
}: GetLocationVouchersParams): Promise<PaginatedData<LocationVoucher>> => {
  const params: any = { page, limit, sortBy };

  if (search) {
    params.search = search;
    params.searchBy = ["title", "voucherCode"];
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationVoucher>>
  >(`/v1/business/location-voucher/${locationId}`, { params });
  return data.data;
};

export const createLocationVoucher = async ({
  locationId,
  payload,
}: {
  locationId: string;
  payload: CreateLocationVoucherPayload;
}): Promise<LocationVoucher> => {
  const { data } = await axiosInstance.post<ApiResponse<LocationVoucher>>(
    `/v1/business/location-voucher/${locationId}`,
    payload
  );
  return data.data;
};

export const getLocationVoucherById = async (voucherId: string): Promise<LocationVoucher> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationVoucher>>(
    `/v1/business/location-voucher/voucher/${voucherId}`
  );
  return data.data;
};

export const updateLocationVoucher = async ({
  locationId,
  voucherId,
  payload
}: {
  locationId: string;
  voucherId: string;
  payload: UpdateLocationVoucherPayload;
}): Promise<LocationVoucher> => {
  const { data } = await axiosInstance.put<ApiResponse<LocationVoucher>>(
    `/v1/business/location-voucher/${locationId}/${voucherId}`,
    payload
  );
  return data.data;
};

export const deleteLocationVoucher = async ({
  locationId,
  voucherId
}: {
  locationId: string;
  voucherId: string;
}): Promise<any> => {
  const { data } = await axiosInstance.delete(
    `/v1/business/location-voucher/${locationId}/${voucherId}`
  );
  return data;
};

export interface VerifyVoucherCodePayload {
  userVoucherCode: string;
}

export interface VerifyVoucherCodeResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const verifyVoucherCode = async (
  payload: VerifyVoucherCodePayload
): Promise<VerifyVoucherCodeResponse> => {
  const { data } = await axiosInstance.post<ApiResponse<VerifyVoucherCodeResponse>>(
    `/v1/business/location-voucher/verify-code`,
    payload
  );
  return data.data;
};