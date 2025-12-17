/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from './axios-config';
import type {
  ApiResponse,
  LocationMission,
  CreateLocationMissionPayload,
  GetLocationMissionsParams,
  PaginatedData,
  UpdateLocationMissionPayload,
} from '@/types';

export const createLocationMission = async ({
  locationId,
  payload,
}: {
  locationId: string;
  payload: CreateLocationMissionPayload;
}): Promise<LocationMission> => {
  const { data } = await axiosInstance.post<ApiResponse<LocationMission>>(
    `/v1/business/location-mission/${locationId}`,
    payload
  );
  return data.data;
};

export const getLocationMissions = async ({
  locationId,
  page = 1,
  limit = 10,
  sortBy,
  search,
}: GetLocationMissionsParams): Promise<PaginatedData<LocationMission>> => {
  const params: any = { page, limit };

  if (sortBy) {
    params.sortBy = sortBy;
  }

  if (search) {
    params.search = search;
    params.searchBy = ['title'];
  }

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationMission>>
  >(`/v1/business/location-mission/${locationId}`, { params });
  return data.data;
};

export const getLocationMissionById = async (
  missionId: string
): Promise<LocationMission> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationMission>>(
    `/v1/business/location-mission/mission/${missionId}`
  );
  return data.data;
};

export const updateLocationMission = async ({
  missionId,
  payload,
}: {
  missionId: string;
  payload: UpdateLocationMissionPayload;
}): Promise<LocationMission> => {
  const { data } = await axiosInstance.put<ApiResponse<LocationMission>>(
    `/v1/business/location-mission/mission/${missionId}`,
    payload
  );
  return data.data;
};

export const deleteLocationMission = async (
  missionId: string
): Promise<any> => {
  const { data } = await axiosInstance.delete(
    `/v1/business/location-mission/mission/${missionId}`
  );
  return data;
};

export interface GenerateOneTimeQRCodePayload {
  missionId?: string;
}

export interface GenerateOneTimeQRCodeResponse {
  id: string;
  qrCodeData: string; // The data encoded in the QR code
  qrCodeUrl: string; // URL to the QR code image (may be empty)
  locationId: string;
  expiresAt: string;
  referenceId: string | null;
  isUsed: boolean;
  createdAt: string;
}

export const generateOneTimeQRCode = async ({
  locationId,
  payload,
}: {
  locationId: string;
  payload?: GenerateOneTimeQRCodePayload;
}): Promise<GenerateOneTimeQRCodeResponse> => {
  const { data } = await axiosInstance.post<
    ApiResponse<GenerateOneTimeQRCodeResponse>
  >(
    `/v1/business/location-mission/${locationId}/generate-one-time-qr`,
    payload || {}
  );
  return data.data;
};

// ---- Mission Participants ----

export interface GetMissionParticipantsParams {
  missionId: string;
  page?: number;
  limit?: number;
  // Raw filter string for completed, e.g. "$eq:true" or "$eq:false"
  completedFilter?: string;
  sortBy?: string[];
  search?: string;
  searchBy?: string[];
}

export const getMissionParticipants = async ({
  missionId,
  page = 1,
  limit = 20,
  completedFilter,
  sortBy,
  search,
  searchBy,
}: GetMissionParticipantsParams): Promise<PaginatedData<any>> => {
  const params: any = {
    page,
    limit,
    // Backend filter format: filter.missionId=$eq:missionId
    'filter.missionId': `$eq:${missionId}`,
  };
  if (completedFilter) {
    // completedFilter should already be in raw form, e.g. "$eq:true"
    params['filter.completed'] = completedFilter;
  }
  if (sortBy && sortBy.length > 0) {
    params.sortBy = sortBy;
  } else {
    params.sortBy = ['progress:DESC'];
  }
  if (search) {
    params.search = search;
    if (searchBy && searchBy.length > 0) {
      params.searchBy = searchBy;
    }
  }
  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<any>>>(
    '/v1/business/location-mission/mission/participants',
    { params }
  );

  return data.data;
};
