/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type {
  ApiResponse,
  PaginatedData,
  LocationRequest,
  GetRequestsParams,
  ProcessRequestPayload,
  GetBusinessesParams,
  BusinessProfile,
  CreatePublicLocationPayload,
  GetLocationsParams,
  Location,
  UpdateLocationPayload,
  GetTagsParams,
  Tag,
  CreateTagPayload,
  UpdateTagPayload,
  Wallet,
  WalletExternalTransaction,
  GetWalletExternalTransactionsParams,
} from "@/types";

export const getLocationRequestsForAdmin = async ({
  page = 1,
  limit = 10,
  search,
  status,
  sortBy,
}: GetRequestsParams): Promise<PaginatedData<LocationRequest>> => {
  const params: any = {
    page,
    limit,
  };

  if (search) {
    params.search = search;
    params.searchBy = ["name"];
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

export const getLocationRequestByIdForAdmin = async (
  id: string
): Promise<LocationRequest> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationRequest>>(
    `/v1/admin/location-request/search/${id}`
  );
  return data.data;
};

export const getBusinessAccounts = async ({
  page = 1,
  limit = 10,
  search,
  status,
  sortBy,
}: GetBusinessesParams): Promise<PaginatedData<BusinessProfile>> => {
  const params: any = { page, limit };
  if (search) {
    params.search = search;
    params.searchBy = ["name", "email"];
  }
  if (status) {
    params["filter.status"] = `$eq:${status}`;
  }
  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<BusinessProfile>>
  >("/v1/admin/account/business", { params });
  return data.data;
};

export const processBusinessAccount = async ({
  id,
  payload,
}: {
  id: string;
  payload: ProcessRequestPayload;
}) => {
  const { data } = await axiosInstance.put(
    `/v1/admin/account/business/${id}/process`,
    payload
  );
  return data;
};

export const createPublicLocation = async (
  payload: CreatePublicLocationPayload
): Promise<any> => {
  const { data } = await axiosInstance.post(
    "/v1/admin/locations/public",
    payload
  );
  return data;
};

export const getAllLocationsForAdmin = async ({
  page = 1,
  limit = 10,
  search,
  sortBy,
}: GetLocationsParams): Promise<PaginatedData<Location>> => {
  const params: any = { page, limit };

  if (search) {
    params.search = search;
    params.searchBy = ["name"];
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<Location>>
  >("/v1/admin/locations/search", { params });
  return data.data;
};

export const getLocationByIdForAdmin = async (
  id: string
): Promise<Location> => {
  const { data } = await axiosInstance.get<ApiResponse<Location>>(
    `/v1/admin/locations/${id}`
  );
  return data.data;
};

export const updateLocationAsAdmin = async (
  locationId: string,
  payload: UpdateLocationPayload
): Promise<Location> => {
  const { data } = await axiosInstance.put<ApiResponse<Location>>(
    `/v1/admin/locations/${locationId}`,
    payload
  );
  return data.data;
};

export const getTagsForAdmin = async ({
  page = 1,
  limit = 20,
  sortBy = "displayName:ASC",
  search,
}: GetTagsParams): Promise<PaginatedData<Tag>> => {
  const params: any = { page, limit, sortBy };

  if (search) {
    params.search = search;
    params.searchBy = ["displayName"];
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Tag>>>(
    "/v1/admin/tag",
    { params }
  );
  return data.data;
};

export const createTag = async (payload: CreateTagPayload): Promise<Tag> => {
  const { data } = await axiosInstance.post<ApiResponse<Tag>>(
    "/v1/admin/tag",
    payload
  );
  return data.data;
};

export const updateTag = async (
  tagId: number,
  payload: UpdateTagPayload
): Promise<Tag> => {
  const { data } = await axiosInstance.put<ApiResponse<Tag>>(
    `/v1/admin/tag/${tagId}`,
    payload
  );
  return data.data;
};

export const getEscrowWallet = async (): Promise<Wallet> => {
  const { data } = await axiosInstance.get<ApiResponse<Wallet>>(
    "/v1/admin/wallet/escrow"
  );
  return data.data;
};

export const getSystemWallet = async (): Promise<Wallet> => {
  const { data } = await axiosInstance.get<ApiResponse<Wallet>>(
    "/v1/admin/wallet/system"
  );
  return data.data;
};

export const getAdminExternalTransactions = async ({
  page = 1,
  limit = 20,
  sortBy = 'createdAt:DESC',
}: GetWalletExternalTransactionsParams): Promise<PaginatedData<WalletExternalTransaction>> => {
  const params: any = { page, limit, sortBy };

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<WalletExternalTransaction>>>(
    '/v1/admin/wallet/transactions/external/search',
    { params }
  );
  return data.data;
};

export const getAdminExternalTransactionById = async (
  transactionId: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.get<ApiResponse<WalletExternalTransaction>>(
    `/v1/admin/wallet/transactions/external/${transactionId}`
  );
  return data.data;
};

export const startProcessingWithdrawTransaction = async (
  transactionId: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<ApiResponse<WalletExternalTransaction>>(
    `/v1/admin/wallet/transactions/external/${transactionId}/start-processing`
  );
  return data.data;
};

export const completeProcessingWithdrawTransaction = async (
  transactionId: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<ApiResponse<WalletExternalTransaction>>(
    `/v1/admin/wallet/transactions/external/${transactionId}/complete-processing`
  );
  return data.data;
};

export const markTransferFailed = async (
  transactionId: string,
  failureReason: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<ApiResponse<WalletExternalTransaction>>(
    `/v1/admin/wallet/transactions/external/${transactionId}/mark-transfer-failed`,
    { failureReason }
  );
  return data.data;
};

export const rejectWithdrawTransaction = async (
  transactionId: string,
  rejectionReason: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<ApiResponse<WalletExternalTransaction>>(
    `/v1/admin/wallet/transactions/external/${transactionId}/reject`,
    { rejectionReason }
  );
  return data.data;
};