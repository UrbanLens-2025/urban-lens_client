/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type { ApiResponse, LocationAvailability, CreateAvailabilityPayload, UpdateAvailabilityPayload } from "@/types";

export const getAvailabilities = async (
  locationId: string, 
  month: number,
  year: number
): Promise<LocationAvailability[]> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationAvailability[]>>(
    `/v1/owner/location-availability/calendar`,
    { 
      params: { 
        locationId,
        month: month + 1,
        year 
      } 
    }
  );
  return data.data;
};

export const createAvailability = async (payload: CreateAvailabilityPayload): Promise<LocationAvailability> => {
  const { data } = await axiosInstance.post<ApiResponse<LocationAvailability>>(
    '/v1/owner/location-availability',
    payload
  );
  return data.data;
};

export const updateAvailability = async (
  id: string, 
  payload: UpdateAvailabilityPayload
): Promise<LocationAvailability> => {
  const { data } = await axiosInstance.put<ApiResponse<LocationAvailability>>(
    `/v1/owner/location-availability/${id}`,
    payload
  );
  return data.data;
};

export const deleteAvailability = async (id: string): Promise<any> => {
  const { data } = await axiosInstance.delete(
    `/v1/owner/location-availability/${id}`
  );
  return data;
};