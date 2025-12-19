/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from './axios-config';
import { ScheduledJobStatus } from '@/types';
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
  UpdateLocationPayload,
  GetTagsParams,
  Tag,
  CreateTagPayload,
  UpdateTagPayload,
  Wallet,
  WalletExternalTransaction,
  GetWalletExternalTransactionsParams,
  GetAdminWalletTransactionsParams,
  GetEventsParams,
  User,
  WalletTransaction,
  LocationBooking,
} from '@/types';
import { GetAllBookingsAtLocationParams } from './locations';

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
    params.searchBy = ['name'];
  }

  if (status) {
    params['filter.status'] = `$eq:${status}`;
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationRequest>>
  >('/v1/admin/location-request/search', {
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
    params.searchBy = ['name', 'email'];
  }
  if (status) {
    params['filter.status'] = `$eq:${status}`;
  }
  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<BusinessProfile>>
  >('/v1/admin/account/business', { params });
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
    '/v1/admin/locations/public',
    payload
  );
  return data;
};

export const getAllLocationsForAdmin = async ({
  page = 1,
  limit = 10,
  search,
  sortBy,
  isBusiness,
  isVisibleOnMap,
}: GetLocationsParams & {
  isBusiness?: boolean;
  isVisibleOnMap?: boolean;
}): Promise<PaginatedData<Location>> => {
  const params: any = { page, limit };

  if (search) {
    params.search = search;
    params.searchBy = ['name'];
  }

  if (isBusiness !== undefined) {
    // Filter by businessId: not null for business locations, null for public locations
    if (isBusiness) {
      // Business locations have a businessId (not null)
      params['filter.businessId'] = '$ne:null';
    } else {
      // Public locations don't have a businessId (null)
      params['filter.businessId'] = '$eq:null';
    }
  }

  if (isVisibleOnMap !== undefined) {
    params['filter.isVisibleOnMap'] = `$eq:${isVisibleOnMap}`;
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<Location>>
  >('/v1/admin/locations/search', { params });
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
  sortBy = 'displayName:ASC',
  search,
  isVisible,
  groupName,
}: GetTagsParams & {
  isVisible?: boolean;
  groupName?: string;
}): Promise<PaginatedData<Tag>> => {
  const params: any = { page, limit, sortBy };

  if (search) {
    params.search = search;
    params.searchBy = ['displayName'];
  }

  if (isVisible !== undefined) {
    params['filter.isVisible'] = `$eq:${isVisible}`;
  }

  if (groupName) {
    params['filter.groupName'] = `$eq:${groupName}`;
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Tag>>>(
    '/v1/admin/tag',
    { params }
  );
  return data.data;
};

export const createTag = async (payload: CreateTagPayload): Promise<Tag> => {
  const { data } = await axiosInstance.post<ApiResponse<Tag>>(
    '/v1/admin/tag',
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
    '/v1/admin/wallet/escrow'
  );
  return data.data;
};

export const getSystemWallet = async (): Promise<Wallet> => {
  const { data } = await axiosInstance.get<ApiResponse<Wallet>>(
    '/v1/admin/wallet/system'
  );
  return data.data;
};

export const getAdminInternalWalletTransactions = async ({
  walletId,
  page = 1,
  limit = 20,
  sortBy = 'createdAt:DESC',
}: GetAdminWalletTransactionsParams): Promise<
  PaginatedData<WalletTransaction>
> => {
  const params: any = { page, limit, sortBy };

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<WalletTransaction>>
  >(`/v1/admin/wallet/transactions/internal/${walletId}`, {
    params,
  });

  return data.data;
};

export const getAdminInternalWalletTransactionById = async (
  transactionId: string
): Promise<WalletTransaction> => {
  const { data } = await axiosInstance.get<ApiResponse<WalletTransaction>>(
    `/v1/admin/wallet/transactions/internal/get-by-id/${transactionId}`
  );
  return data.data;
};

export const getAdminExternalTransactions = async ({
  page = 1,
  limit = 20,
  sortBy = 'createdAt:DESC',
}: GetWalletExternalTransactionsParams): Promise<
  PaginatedData<WalletExternalTransaction>
> => {
  const params: any = { page, limit, sortBy };

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<WalletExternalTransaction>>
  >('/v1/admin/wallet/transactions/external/search', { params });
  return data.data;
};

export const getAdminExternalTransactionById = async (
  transactionId: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.get<
    ApiResponse<WalletExternalTransaction>
  >(`/v1/admin/wallet/transactions/external/${transactionId}`);
  return data.data;
};

export const startProcessingWithdrawTransaction = async (
  transactionId: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<
    ApiResponse<WalletExternalTransaction>
  >(`/v1/admin/wallet/transactions/external/${transactionId}/start-processing`);
  return data.data;
};

export const completeProcessingWithdrawTransaction = async (
  transactionId: string,
  proofOfTransferImages: string[],
  transferBankTransactionId: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<
    ApiResponse<WalletExternalTransaction>
  >(
    `/v1/admin/wallet/transactions/external/${transactionId}/complete-processing`,
    {
      proofOfTransferImages,
      transferBankTransactionId,
    }
  );
  return data.data;
};

export const markTransferFailed = async (
  transactionId: string,
  failureReason: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<
    ApiResponse<WalletExternalTransaction>
  >(
    `/v1/admin/wallet/transactions/external/${transactionId}/mark-transfer-failed`,
    { failureReason }
  );
  return data.data;
};

export const rejectWithdrawTransaction = async (
  transactionId: string,
  rejectionReason: string
): Promise<WalletExternalTransaction> => {
  const { data } = await axiosInstance.post<
    ApiResponse<WalletExternalTransaction>
  >(`/v1/admin/wallet/transactions/external/${transactionId}/reject`, {
    rejectionReason,
  });
  return data.data;
};

// Admin Event APIs
export const getAllEventsForAdmin = async ({
  page = 1,
  limit = 10,
  search,
  sortBy,
  status,
}: GetEventsParams & { status?: string }): Promise<PaginatedData<any>> => {
  const params: any = { page, limit };

  if (search) {
    params.search = search;
    params.searchBy = ['displayName', 'description'];
  }

  if (status) {
    params['filter.status'] = `$eq:${status}`;
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<any>>>(
    '/v1/admin/events',
    { params }
  );
  return data.data;
};

export const getEventByIdForAdmin = async (id: string): Promise<any> => {
  const { data } = await axiosInstance.get<ApiResponse<any>>(
    `/v1/admin/events/${id}`
  );
  return data.data;
};

// Admin Post APIs
export interface GetAllPostsForAdminParams {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: string[];
  sortBy?: string | string[];
  type?: string;
  visibility?: string;
  select?: string[];
}

export interface AdminPost {
  postId: string;
  content: string;
  imageUrls: string[];
  type: string;
  isVerified: boolean;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    isFollow?: boolean;
  };
  rating: number | null;
  eventId: string | null;
  location?: {
    id: string;
    name: string;
    addressLine: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string[];
  };
  analytics?: {
    totalUpvotes: number;
    totalDownvotes: number;
    totalComments: number;
  };
  currentUserReaction?: string | null;
}

export const getAllPostsForAdmin = async ({
  page = 1,
  limit = 10,
  search,
  searchBy,
  sortBy,
  type,
  visibility,
  select,
}: GetAllPostsForAdminParams): Promise<PaginatedData<AdminPost>> => {
  const params: any = { page, limit };

  if (search) {
    params.search = search;
    params.searchBy = searchBy || ['content'];
  }

  if (type) {
    params['filter.type'] = `$eq:${type}`;
  }

  if (visibility) {
    params['filter.visibility'] = `$eq:${visibility}`;
  }

  if (sortBy) {
    // Handle both string format "column:direction" and array format
    if (typeof sortBy === 'string') {
      params.sortBy = [sortBy];
    } else {
      params.sortBy = sortBy;
    }
  }

  if (select) {
    params.select = select;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<AdminPost>>
  >('/v1/post', { params });
  return data.data;
};

export const getPostByIdForAdmin = async (
  postId: string
): Promise<AdminPost> => {
  const { data } = await axiosInstance.get<ApiResponse<AdminPost>>(
    `/v1/post/${postId}`
  );
  return data.data;
};

// Admin Account APIs
interface GetAllAccountsParams {
  page?: number;
  limit?: number;
  sortBy?: string[];
  search?: string;
  searchBy?: string[];
  filterRole?: string;
  filterHasOnboarded?: string;
  filterIsLocked?: string;
}

export const getAllAccounts = async ({
  page = 1,
  limit = 20,
  sortBy,
  search,
  searchBy,
  filterRole,
  filterHasOnboarded,
  filterIsLocked,
}: GetAllAccountsParams = {}): Promise<ApiResponse<PaginatedData<any>>> => {
  const params: any = { page, limit };

  if (search && searchBy) {
    params.search = search;
    params.searchBy = searchBy;
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  if (filterRole) {
    params['filter.role'] = filterRole;
  }

  if (filterHasOnboarded) {
    params['filter.hasOnboarded'] = filterHasOnboarded;
  }

  if (filterIsLocked) {
    params['filter.isLocked'] = filterIsLocked;
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<any>>>(
    '/v1/admin/account',
    { params }
  );
  return data;
};

export const getAccountById = async (id: string): Promise<User> => {
  const { data } = await axiosInstance.get<ApiResponse<User>>(
    `/v1/admin/account/${id}`
  );
  return data.data;
};

export interface AccountSuspension {
  id: string;
  accountId: string;
  suspensionReason: string | null;
  suspendedUntil: string | null;
  suspendedById: string | null;
  suspendedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetAccountSuspensionsParams {
  accountId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  isActive?: boolean;
}

export const getAccountSuspensions = async ({
  accountId,
  page = 1,
  limit = 20,
  sortBy,
  search,
  isActive,
}: GetAccountSuspensionsParams): Promise<PaginatedData<AccountSuspension>> => {
  const params: any = { page, limit };

  if (sortBy) {
    params.sortBy = sortBy;
  }

  if (search) {
    params.search = search;
    params.searchBy = 'suspensionReason';
  }

  if (isActive !== undefined) {
    params['filter.isActive'] = `$eq:${isActive}`;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<AccountSuspension>>
  >(`/v1/admin/account/${accountId}/suspensions`, { params });
  return data.data;
};

export interface SuspendAccountPayload {
  suspendUntil: string;
  suspensionReason: string;
}

export const suspendAccount = async (
  accountId: string,
  payload: SuspendAccountPayload
): Promise<void> => {
  await axiosInstance.post(`/v1/admin/account/${accountId}/suspend`, payload);
};

export const liftSuspension = async (
  accountId: string,
  suspensionId: string
): Promise<void> => {
  await axiosInstance.put(
    `/v1/admin/account/${accountId}/suspensions/${suspensionId}/lift`
  );
};

export interface AccountWarning {
  id: string;
  accountId: string;
  warningNote: string | null;
  warnedById: string | null;
  warnedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  createdById: string | null;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    role?: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    hasOnboarded?: boolean;
    isLocked?: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetAccountWarningsParams {
  accountId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export const getAccountWarnings = async ({
  accountId,
  page = 1,
  limit = 20,
  sortBy,
  search,
}: GetAccountWarningsParams): Promise<PaginatedData<AccountWarning>> => {
  const params: any = { page, limit };

  if (sortBy) {
    params.sortBy = sortBy;
  }

  if (search) {
    params.search = search;
    params.searchBy = 'warningNote';
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<AccountWarning>>
  >(`/v1/admin/account/${accountId}/warnings`, { params });
  return data.data;
};

export interface CreateWarningPayload {
  warningNote: string;
}

export const createWarning = async (
  accountId: string,
  payload: CreateWarningPayload
): Promise<void> => {
  await axiosInstance.post(`/v1/admin/account/${accountId}/warnings`, payload);
};

export interface ScheduledJob {
  id: number;
  createdAt: string;
  updatedAt: string;
  status: ScheduledJobStatus;
  jobType: string;
  executeAt: string;
  payload: Record<string, any>;
  associatedId: string | null;
}

export interface GetScheduledJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: string[];
  status?: ScheduledJobStatus;
  jobType?: string;
  sortBy?: string;
}

export const getScheduledJobs = async (
  params: GetScheduledJobsParams
): Promise<PaginatedData<ScheduledJob>> => {
  const queryParams: any = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };

  if (params.search && params.searchBy) {
    queryParams.search = params.search;
    queryParams.searchBy = params.searchBy;
  }

  if (params.status) {
    queryParams['filter.status'] = `$eq:${params.status}`;
  }

  if (params.jobType) {
    queryParams['filter.jobType'] = `$eq:${params.jobType}`;
  }

  if (params.sortBy) {
    queryParams.sortBy = params.sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<ScheduledJob>>
  >('/v1/admin/scheduled-jobs', { params: queryParams });

  return data.data;
};

export const getScheduledJobTypes = async (): Promise<string[]> => {
  const { data } = await axiosInstance.get<ApiResponse<string[]>>(
    '/v1/admin/scheduled-jobs/types'
  );
  return data.data;
};

export const runScheduledJob = async (
  scheduledJobId: number
): Promise<void> => {
  await axiosInstance.put<ApiResponse<void>>(
    `/v1/admin/scheduled-jobs/${scheduledJobId}/run`
  );
};

export interface SystemConfigValue {
  id: string;
  key: string;
  value: string | number;
  createdAt: string;
  updatedAt: string;
  updatedById: string | null;
  updatedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    hasOnboarded: boolean;
    isLocked: boolean;
  } | null;
}

export interface UpdateSystemConfigValuePayload {
  value: string;
}

export const getSystemConfigValues = async (): Promise<SystemConfigValue[]> => {
  const { data } = await axiosInstance.get<ApiResponse<SystemConfigValue[]>>(
    '/v1/admin/system-config/values'
  );
  return data.data;
};

export const updateSystemConfigValue = async (
  key: string,
  payload: UpdateSystemConfigValuePayload
): Promise<SystemConfigValue> => {
  const { data } = await axiosInstance.put<ApiResponse<SystemConfigValue>>(
    `/v1/admin/system-config/value/${key}`,
    payload
  );
  return data.data;
};

export const getBookingsAtLocationForAdmin = async ({
  locationId,
  startDate,
  endDate,
  page = 1,
  limit = 100,
}: GetAllBookingsAtLocationParams): Promise<PaginatedData<LocationBooking>> => {
  const params: any = {
    startDate,
    endDate,
    page,
    limit: Math.min(limit, 100),
  };

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationBooking>>
  >(
    `/v1/admin/location-bookings/all-bookings-at-location-paged/${locationId}`,
    { params }
  );
  return data.data;
};
