/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type {
  ApiResponse,
  CreateLocationPayload,
  CreateLocationBookingConfigPayload,
  GetRequestsParams,
  GetOwnerLocationBookingsParams,
  Location,
  LocationBooking,
  LocationBookingDetail,
  LocationBookingConfig,
  LocationRequest,
  PaginatedData,
  ProcessLocationBookingPayload,
  Tag,
  UpdateLocationBookingConfigPayload,
  UpdateLocationPayload,
} from "@/types";

export const getMyLocations = async ({
  page = 1,
  limit = 10,
  search,
}: GetRequestsParams): Promise<PaginatedData<Location>> => {
  const params: any = {
    page,
    limit,
  };

  if (search) {
    params.search = search;
    params.searchBy = ["name"];
  }

  const response = await axiosInstance.get<
    ApiResponse<PaginatedData<Location>>
  >("/v1/owner/locations", {
    params: params,
  });
  return response.data.data;
};

export const getLocationRequests = async ({
  page = 1,
  limit = 10,
  status,
  sortBy,
}: GetRequestsParams): Promise<PaginatedData<LocationRequest>> => {
  const params: any = {
    page,
    limit,
  };

  if (status) {
    params["filter.status"] = `$not:${status}`;
  }

  if (sortBy) {
    params.sortBy = sortBy;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationRequest>>
  >("/v1/business/location-request", {
    params: params,
  });
  return data.data;
};

export const createLocationRequest = async (
  payload: CreateLocationPayload
): Promise<any> => {
  const { data } = await axiosInstance.post(
    "/v1/business/location-request",
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

export const getAllTags = async (params?: { page?: number; limit?: number }): Promise<PaginatedData<Tag>> => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Tag>>>(
    "/v1/public/tag",
    { params: params || { page: 1, limit: 1000 } } // Use high limit to get all tags
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
  sortBy = "createdAt:ASC",
  search,
}: GetOwnerLocationBookingsParams): Promise<PaginatedData<LocationBooking>> => {
  const params: any = { page, limit, sortBy };
  if (search) {
    params.search = search;
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationBooking>>
  >("/v1/owner/location-bookings/search", { params });
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

export const processLocationBooking = async ({
  locationBookingId,
  payload,
}: {
  locationBookingId: string;
  payload: ProcessLocationBookingPayload;
}): Promise<LocationBookingDetail> => {
  const { data } = await axiosInstance.post<ApiResponse<LocationBookingDetail>>(
    `/v1/owner/location-bookings/process/${locationBookingId}`,
    payload
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
  locationId: string,
  payload: UpdateLocationBookingConfigPayload
): Promise<void> => {
  await axiosInstance.put<ApiResponse<void>>(
    `/v1/owner/location-booking-config/${locationId}`,
    payload
  );
};
