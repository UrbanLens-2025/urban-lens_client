/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from './axios-config';
import type {
  ApiResponse,
  CreateLocationPayload,
  CreateLocationBookingConfigPayload,
  GetRequestsParams,
  GetOwnerLocationBookingsParams,
  LocationBooking,
  LocationBookingDetail,
  LocationBookingConfig,
  LocationRequest,
  PaginatedData,
  Tag,
  TagCategory,
  UpdateLocationBookingConfigPayload,
  UpdateLocationPayload,
} from '@/types';

export const getMyLocations = async ({
  page = 1,
  limit = 10,
  search,
  searchBy,
  sortBy,
  filterVisibleOnMap,
}: GetRequestsParams): Promise<PaginatedData<any>> => {
  const params: any = {
    page,
    limit,
  };

  if (search) {
    params.search = search;
  }

  if (searchBy?.length) {
    params.searchBy = searchBy;
  } else if (search) {
    params.searchBy = ['name', 'addressLine'];
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  if (filterVisibleOnMap) {
    params['filter.isVisibleOnMap'] = filterVisibleOnMap;
  }

  const response = await axiosInstance.get<
    ApiResponse<PaginatedData<Location>>
  >('/v1/owner/locations', {
    params: params,
  });
  return response.data.data;
};

export const getLocationRequests = async ({
  page = 1,
  limit = 10,
  status,
  sortBy,
  search,
  searchBy,
}: GetRequestsParams): Promise<PaginatedData<LocationRequest>> => {
  const params: any = {
    page,
    limit,
  };

  if (status) {
    // Use $eq: for direct status filtering (matching admin API pattern)
    params['filter.status'] = `$eq:${status}`;
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  if (search) {
    params.search = search;
  }

  if (searchBy?.length) {
    params.searchBy = searchBy;
  } else if (search) {
    params.searchBy = ['name', 'description', 'addressLine'];
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationRequest>>
  >('/v1/business/location-request', {
    params: params,
  });
  return data.data;
};

export const createLocationRequest = async (
  payload: CreateLocationPayload
): Promise<any> => {
  const { data } = await axiosInstance.post(
    '/v1/business/location-request',
    payload
  );
  return data;
};

export const getLocationRequestById = async (
  id: string
): Promise<LocationRequest> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationRequest>>(
    `/v1/business/location-request/${id}`
  );
  return data.data;
};

export const getLocationById = async (id: string): Promise<Location> => {
  const { data } = await axiosInstance.get<ApiResponse<Location>>(
    `/v1/owner/locations/${id}`
  );
  return data.data;
};

export const updateLocation = async (
  locationId: string,
  payload: UpdateLocationPayload
): Promise<Location> => {
  const { data } = await axiosInstance.put<ApiResponse<Location>>(
    `/v1/owner/locations/${locationId}`,
    payload
  );
  return data.data;
};

export const addTagsToLocation = async (
  locationId: string,
  tagIds: number[]
): Promise<any> => {
  const { data } = await axiosInstance.post(
    `/v1/owner/locations/${locationId}/tags`,
    { tagIds }
  );
  return data;
};

export const addTagsToLocationRequest = async (
  requestId: string,
  tagIds: number[]
): Promise<any> => {
  const { data } = await axiosInstance.post(
    `/v1/business/location-request/${requestId}/tags`,
    { tagIds }
  );
  return data;
};

export const removeTagsFromLocation = async (
  locationId: string,
  tagIds: number[]
): Promise<any> => {
  const { data } = await axiosInstance.delete(
    `/v1/owner/locations/${locationId}/tags`,
    { data: { tagIds } }
  );
  return data;
};

export const removeTagsFromLocationRequest = async (
  requestId: string,
  tagIds: number[]
): Promise<any> => {
  const { data } = await axiosInstance.delete(
    `/v1/business/location-request/${requestId}/tags`,
    { data: { tagIds } }
  );
  return data;
};

export const getAllTags = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedData<Tag>> => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Tag>>>(
    '/v1/public/tag',
    { params: params || { page: 1, limit: 1000 } } // Use high limit to get all tags
  );
  return data.data;
};

export const getTagCategories = async (
  type: 'LOCATION' | 'EVENT'
): Promise<TagCategory[]> => {
  const { data } = await axiosInstance.get<ApiResponse<TagCategory[]>>(
    '/v1/public/tag-categories',
    { params: { type } }
  );
  return data.data;
};

export const updateLocationRequest = async ({
  locationRequestId,
  payload,
}: {
  locationRequestId: string;
  payload: CreateLocationPayload;
}): Promise<any> => {
  const { data } = await axiosInstance.put(
    `/v1/business/location-request/${locationRequestId}`,
    payload
  );
  return data;
};

export const cancelLocationRequest = async (
  requestId: string
): Promise<any> => {
  const { data } = await axiosInstance.put(
    `/v1/business/location-request/${requestId}/cancel`,
    {}
  );
  return data;
};

export const getOwnerLocationBookings = async ({
  page = 1,
  limit = 20,
  sortBy = 'createdAt:ASC',
  search,
  status,
}: GetOwnerLocationBookingsParams): Promise<PaginatedData<LocationBooking>> => {
  const params: any = { page, limit, sortBy };
  if (search) {
    params.search = search;
  }
  if (status && status !== 'ALL') {
    params['filter.status'] = status;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationBooking>>
  >('/v1/owner/location-bookings/search', { params });
  return data.data;
};

export const getLocationBookingById = async (
  locationBookingId: string
): Promise<LocationBookingDetail> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationBookingDetail>>(
    `/v1/owner/location-bookings/search/${locationBookingId}`,
    { params: { locationBookingId } }
  );
  return data.data;
};

export interface GetAllBookingsAtLocationParams {
  locationId: string;
  startDate: string; // ISO date-time string
  endDate: string; // ISO date-time string
  page?: number;
  limit?: number;
}

export const getAllBookingsAtLocation = async ({
  locationId,
  startDate,
  endDate,
  page = 1,
  limit = 100, // Use max limit to get all bookings for the week
}: GetAllBookingsAtLocationParams): Promise<PaginatedData<LocationBooking>> => {
  const params: any = {
    startDate,
    endDate,
    page,
    limit: Math.min(limit, 100), // Ensure limit doesn't exceed max
  };

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationBooking>>
  >(
    `/v1/owner/location-bookings/all-bookings-at-location-paged/${locationId}`,
    { params }
  );
  return data.data;
};

export const getConflictingBookings = async (
  locationBookingId: string
): Promise<LocationBooking[]> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationBooking[]>>(
    `/v1/owner/location-bookings/conflicting-bookings/${locationBookingId}`
  );
  return data.data;
};

export const approveLocationBooking = async (
  locationBookingId: string
): Promise<LocationBookingDetail> => {
  const { data } = await axiosInstance.post<ApiResponse<LocationBookingDetail>>(
    `/v1/owner/location-bookings/approve/${locationBookingId}`
  );
  return data.data;
};

export const rejectLocationBookings = async (
  locationBookingIds: string[]
): Promise<void> => {
  const { data } = await axiosInstance.post<ApiResponse<void>>(
    `/v1/owner/location-bookings/reject`,
    { bookingIds: locationBookingIds }
  );
  return data.data;
};

export const getLocationBookingConfig = async (
  locationId: string
): Promise<LocationBookingConfig> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationBookingConfig>>(
    `/v1/creator/location-booking-config/${locationId}`
  );
  return data.data;
};

export const getOwnerLocationBookingConfig = async (
  locationId: string
): Promise<LocationBookingConfig> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationBookingConfig>>(
    `/v1/owner/location-booking-config/${locationId}`
  );
  return data.data;
};

export const createLocationBookingConfig = async (
  payload: CreateLocationBookingConfigPayload
): Promise<LocationBookingConfig> => {
  const { data } = await axiosInstance.post<ApiResponse<LocationBookingConfig>>(
    `/v1/owner/location-booking-config`,
    payload
  );
  return data.data;
};

export const updateLocationBookingConfig = async (
  configId: string,
  payload: UpdateLocationBookingConfigPayload
): Promise<void> => {
  await axiosInstance.put<ApiResponse<void>>(
    `/v1/owner/location-booking-config/${configId}`,
    payload
  );
};
