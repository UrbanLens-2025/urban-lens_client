/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type { ApiResponse, LocationAvailability, CreateAvailabilityPayload, UpdateAvailabilityPayload } from "@/types";

// Weekly availability response from API
export interface WeeklyAvailabilityResponse {
  id: number;
  locationId: string;
  createdById: string;
  dayOfWeek: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  createdAt: string;
  updatedAt: string;
}

export const getWeeklyAvailabilities = async (
  locationId: string
): Promise<WeeklyAvailabilityResponse[]> => {
  const { data } = await axiosInstance.get<ApiResponse<WeeklyAvailabilityResponse[]>>(
    `/v1/owner/location-availability/search/${locationId}`
  );
  return data.data;
};

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

// Create weekly availability payload (single entry)
export interface CreateWeeklyAvailabilityPayload {
  locationId: string;
  dayOfWeek: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

export const createWeeklyAvailability = async (
  payload: CreateWeeklyAvailabilityPayload
): Promise<WeeklyAvailabilityResponse> => {
  const { data } = await axiosInstance.post<ApiResponse<WeeklyAvailabilityResponse>>(
    '/v1/owner/location-availability',
    payload
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

// Update weekly availability payload
export interface UpdateWeeklyAvailabilityPayload {
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

export const updateWeeklyAvailability = async (
  id: number,
  payload: UpdateWeeklyAvailabilityPayload
): Promise<WeeklyAvailabilityResponse> => {
  const { data } = await axiosInstance.put<ApiResponse<WeeklyAvailabilityResponse>>(
    `/v1/owner/location-availability/${id}`,
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