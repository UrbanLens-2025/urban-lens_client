/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type { ApiResponse, PaginatedData, EventRequest, GetEventRequestsParams, CreateEventRequestPayload, GetBookableLocationsParams, BookableLocation, GetEventsParams, Event, UpdateEventPayload, AddEventTagsPayload, RemoveEventTagsPayload, EventTagResponse, CreateTicketPayload, UpdateTicketPayload, Ticket, EventAttendance, GetEventAttendanceParams, GetEventOrdersParams, ConfirmAttendancePayload, LocationBooking, Order } from "@/types";

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

export interface CreateEventPayload {
  displayName: string;
  description: string;
  expectedNumberOfParticipants: number;
  categoryIds: number[];
  social?: {
    platform: string;
    url: string;
    isMain: boolean;
  }[];
  eventValidationDocuments?: {
    documentType: string;
    documentImageUrls: string[];
  }[];
  startDate?: string;
  endDate?: string;
  coverUrl?: string;
  avatarUrl?: string;
  locationId?: string;
  dateRanges?: Array<{
    startDateTime: string;
    endDateTime: string;
  }>;
}

export const createEvent = async (
  payload: CreateEventPayload
): Promise<Event> => {
  const { data } = await axiosInstance.post<ApiResponse<Event>>(
    '/v1/creator/events',
    payload
  );
  return data.data;
};

export const getBookableLocations = async ({
  page = 1,
  limit = 10,
  sortBy = 'name:ASC',
  search,
  startTime,
  endTime,
  minPrice,
  maxPrice,
  maxCapacity,
}: GetBookableLocationsParams): Promise<PaginatedData<BookableLocation>> => {
  
  const params: any = { page, limit, sortBy };
  
  // Search parameters
  if (search) {
    params.search = search;
    params.searchBy = ['name', 'addressLine', 'addressLevel1', 'addressLevel2'];
  }
  
  // Date parameters (API expects startDate and endDate, not startTime/endTime)
  if (startTime) {
    params.startDate = startTime;
  }
  if (endTime) {
    params.endDate = endTime;
  }
  
  // Price filter: format as filter.bookingConfig.baseBookingPrice with operations
  if (minPrice !== undefined || maxPrice !== undefined) {
    params['filter.bookingConfig.baseBookingPrice'] = [];
    if (minPrice !== undefined) {
      params['filter.bookingConfig.baseBookingPrice'].push(`$gte:${minPrice}`);
    }
    if (maxPrice !== undefined) {
      if (minPrice !== undefined) {
        // If both min and max, combine with $and
        params['filter.bookingConfig.baseBookingPrice'].push(`$and:$lte:${maxPrice}`);
      } else {
        // If only max, use $lte directly
        params['filter.bookingConfig.baseBookingPrice'].push(`$lte:${maxPrice}`);
      }
    }
  }
  
  // Max capacity filter: format as filter.bookingConfig.maxCapacity with $gte operation
  if (maxCapacity !== undefined) {
    params['filter.bookingConfig.maxCapacity'] = [`$gte:${maxCapacity}`];
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
  locationId: string,
  startDate: string,
  endDate: string
): Promise<BookedDatesResponse> => {
  const { data } = await axiosInstance.get<ApiResponse<BookedDatesResponse>>(
    `/v1/creator/location-booking/booked-dates`,
    {
      params: {
        locationId,
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

export const getOwnerEventById = async (eventId: string): Promise<Event> => {
  const { data } = await axiosInstance.get<ApiResponse<Event>>(
    `/v1/owner/events/get-by-id/${eventId}`
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

export const publishEvent = async (eventId: string): Promise<Event> => {
  const { data } = await axiosInstance.post<ApiResponse<Event>>(
    `/v1/creator/events/${eventId}/publish`,
    {}
  );
  return data.data;
};

export const addEventTags = async (
  eventId: string,
  payload: AddEventTagsPayload
): Promise<EventTagResponse[]> => {
  const { data } = await axiosInstance.post<ApiResponse<EventTagResponse[]>>(
    `/v1/creator/events/${eventId}/tags`,
    payload
  );
  return data.data;
};

export const removeEventTags = async (
  eventId: string,
  payload: RemoveEventTagsPayload
): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(
    `/v1/creator/events/${eventId}/tags`,
    { data: payload }
  );
};

export const createTicket = async (
  eventId: string,
  payload: CreateTicketPayload
): Promise<Ticket> => {
  const { data } = await axiosInstance.post<ApiResponse<Ticket>>(
    `/v1/creator/events/${eventId}/tickets`,
    payload
  );
  return data.data;
};

export const getEventTickets = async (
  eventId: string
): Promise<Ticket[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Ticket[]>>(
    `/v1/creator/events/${eventId}/tickets`
  );
  return data.data;
};

export const getEventAttendance = async (
  eventId: string,
  params?: GetEventAttendanceParams
): Promise<PaginatedData<EventAttendance>> => {
  const queryParams: any = {
    page: params?.page || 1,
    limit: params?.limit || 20,
    sortBy: params?.sortBy || 'updatedAt:DESC',
  };

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<EventAttendance>>>(
    `/v1/creator/events/attendance/${eventId}`,
    { params: queryParams }
  );
  return data.data;
};

export const confirmAttendance = async (
  eventId: string,
  payload: ConfirmAttendancePayload
): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    `/v1/creator/events/${eventId}/attendance/confirm-usage`,
    payload
  );
};

export const updateTicket = async (
  eventId: string,
  ticketId: string,
  payload: UpdateTicketPayload
): Promise<Ticket> => {
  const { data } = await axiosInstance.put<ApiResponse<Ticket>>(
    `/v1/creator/events/${eventId}/tickets/${ticketId}`,
    payload
  );
  return data.data;
};

export const deleteTicket = async (
  eventId: string,
  ticketId: string
): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(
    `/v1/creator/events/${eventId}/tickets/${ticketId}`
  );
};

export interface AddLocationBookingPayload {
  locationId: string;
  dates: Array<{
    startDateTime: string;
    endDateTime: string;
  }>;
}

export interface LocationBookingResponse {
  id: string;
  locationId: string;
  dates: Array<{
    startDateTime: string;
    endDateTime: string;
  }>;
}

export const addLocationBookingToEvent = async (
  eventId: string,
  payload: AddLocationBookingPayload
): Promise<LocationBookingResponse> => {
  const { data } = await axiosInstance.post<ApiResponse<LocationBookingResponse>>(
    `/v1/creator/events/${eventId}/location-bookings`,
    payload
  );
  return data.data;
};

export const initiateLocationBookingPayment = async (
  eventId: string,
  locationBookingId: string
): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    `/v1/creator/events/${eventId}/location-bookings/${locationBookingId}/payment`,
    {}
  );
};

export interface CancelLocationBookingPayload {
  cancellationReason: string;
}

export const cancelLocationBooking = async (
  eventId: string,
  locationBookingId: string,
  payload: CancelLocationBookingPayload
): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(
    `/v1/creator/events/${eventId}/location-bookings/${locationBookingId}/cancel`,
    { data: payload }
  );
};

export const getLocationBookingsForEvent = async (eventId: string): Promise<LocationBooking[]> => {
  const { data } = await axiosInstance.get<ApiResponse<LocationBooking[]>>(
    `/v1/creator/events/${eventId}/location-bookings`
  );
  return data.data;
};

export interface CancelEventPayload {
  cancellationReason: string;
}

export const cancelEvent = async (
  eventId: string,
  payload: CancelEventPayload
): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(
    `/v1/creator/events/${eventId}/cancel`,
    { data: payload }
  );
};

export const finishEvent = async (eventId: string): Promise<Event> => {
  const { data } = await axiosInstance.post<ApiResponse<Event>>(
    `/v1/creator/events/${eventId}/finish`,
    {}
  );
  return data.data;
};

export const getEventOrders = async (
  eventId: string,
  params?: GetEventOrdersParams
): Promise<PaginatedData<Order>> => {
  const queryParams: any = {
    page: params?.page || 1,
    limit: params?.limit || 20,
    sortBy: params?.sortBy || 'createdAt:DESC',
  };
  
  if (params?.search) {
    queryParams.search = params.search;
    if (params?.searchBy && params.searchBy.length > 0) {
      queryParams.searchBy = params.searchBy;
    }
  }
  
  if (params?.status) {
    queryParams['filter.status'] = `$eq:${params.status}`;
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Order>>>(
    `/v1/creator/events/${eventId}/orders`,
    { params: queryParams }
  );
  return data.data;
};

export const getEventOrderById = async (
  eventId: string,
  orderId: string
): Promise<Order> => {
  const { data } = await axiosInstance.get<ApiResponse<Order>>(
    `/v1/creator/events/${eventId}/orders/${orderId}`
  );
  return data.data;
};

export interface ConfirmAttendanceV2Payload {
  eventAttendanceIds: string[];
  ticketOrderId: string;
}

export const confirmAttendanceV2 = async (
  eventId: string,
  payload: ConfirmAttendanceV2Payload
): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    `/v1/creator/events/${eventId}/attendance/confirm-usage-v2`,
    payload
  );
};

export const getEventGeneralAnalytics = async (eventId: string) => {
  const { data } = await axiosInstance.get(`/v1/creator/dashboard/events/general-analytics/${eventId}`);
  return data.data;
};