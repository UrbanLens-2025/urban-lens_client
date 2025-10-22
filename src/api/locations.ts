/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type { ApiResponse, CreateLocationPayload, Location, LocationRequest, PaginatedData } from "@/types";

export const getMyLocations = async (): Promise<PaginatedData<Location>> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedData<Location>>>(
    '/v1/owner/locations'
  );
  return response.data.data;
};

export const getLocationRequests = async (): Promise<PaginatedData<LocationRequest>> => {
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<LocationRequest>>>('/v1/business/location-request');
  return data.data;
};

export const createLocationRequest = async (payload: CreateLocationPayload): Promise<any> => {
  const { data } = await axiosInstance.post('/v1/business/location-request', payload);
  return data;
};

export const getLocationRequestById = async (id: string): Promise<LocationRequest> => {
  const response = await axiosInstance.get<ApiResponse<LocationRequest>>(
    `/v1/business/location-request/${id}`
  );
  return response.data.data;
};

export const getLocationById = async (id: string): Promise<Location> => {
  const { data } = await axiosInstance.get<ApiResponse<Location>>(
    `/v1/owner/locations/${id}`
  );
  return data.data;
};