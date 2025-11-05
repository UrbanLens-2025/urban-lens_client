/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type { ApiResponse, PaginatedData, EventRequest, GetEventRequestsParams, CreateEventRequestPayload, GetBookableLocationsParams, BookableLocation, GetEventsParams, Event, UpdateEventPayload } from "@/types";

export const getEventRequests = async ({
  page = 1,
  limit = 10,
  search,
  sortBy = 'createdAt:DESC'
}: GetEventRequestsParams): Promise<PaginatedData<EventRequest>> => {
  
  const params: any = { page, limit, sortBy };
  if (search) {
    params.search = search;
    params.searchBy = ['eventName']; 
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<EventRequest>>>(
    '/v1/creator/event-request/search', 
    { params }
  );
  return data.data;
};

export const createEventRequest = async (
  payload: CreateEventRequestPayload
): Promise<EventRequest> => {
  const { data } = await axiosInstance.post<ApiResponse<EventRequest>>(
    '/v1/creator/event-request/with-business-location',
    payload
  );
  return data.data;
};

export const getBookableLocations = async ({
  page = 1,
  limit = 10,
  sortBy = 'name:ASC',
  search
}: GetBookableLocationsParams): Promise<PaginatedData<BookableLocation>> => {
  
  const params: any = { page, limit, sortBy };
  if (search) {
    params.search = search;
    params.searchBy = ['name', 'addressLine'];
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<BookableLocation>>>(
    '/v1/creator/location/booking/search', 
    { params }
  );
  return data.data;
};

export const getEventRequestById = async (requestId: string): Promise<EventRequest> => {
  const { data } = await axiosInstance.get<ApiResponse<EventRequest>>(
    `/v1/creator/event-request/search/${requestId}`
  );
  return data.data;
};

export const getBookableLocationById = async (locationId: string): Promise<BookableLocation> => {
  const { data } = await axiosInstance.get<ApiResponse<BookableLocation>>(
    `/v1/creator/location/booking/search/${locationId}`
  );
  return data.data;
};

export const payForEventBooking = async (eventRequestId: string): Promise<EventRequest> => {
  const { data } = await axiosInstance.post<ApiResponse<EventRequest>>(
    `/v1/creator/event-request/pay-for-booking/${eventRequestId}`,
    {}
  );
  return data.data;
};

export interface BookedDatesResponse {
  dates: Array<{
    startDateTime: string;
    endDateTime: string;
  }>;
}

export const getBookedDates = async (
  startDate: string,
  endDate: string
): Promise<BookedDatesResponse> => {
  const { data } = await axiosInstance.get<ApiResponse<BookedDatesResponse>>(
    `/v1/creator/location-booking/booked-dates`,
    {
      params: {
        startDate,
        endDate,
      },
    }
  );
  return data.data;
};

export const getMyEvents = async ({
  page = 1,
  limit = 10,
  sortBy = 'createdAt:DESC',
  search
}: GetEventsParams): Promise<PaginatedData<Event>> => {
  
  const params: any = { page, limit, sortBy };

  if (search) {
    params.search = search;
    params.searchBy = ['displayName', 'description'];
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Event>>>(
    '/v1/creator/events',
    { params }
  );
  return data.data;
};

export const getEventById = async (eventId: string): Promise<Event> => {
  const { data } = await axiosInstance.get<ApiResponse<Event>>(
    `/v1/creator/events/${eventId}`
  );
  return data.data;
};

export const updateEvent = async (
  eventId: string,
  payload: UpdateEventPayload
): Promise<Event> => {
  const { data } = await axiosInstance.put<ApiResponse<Event>>(
    `/v1/creator/events/${eventId}`,
    payload
  );
  return data.data;
};