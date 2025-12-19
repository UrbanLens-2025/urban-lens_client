import { getBookingsAtLocationForAdmin } from '@/api/admin';
import { GetAllBookingsAtLocationParams } from '@/api/locations';
import {
  LocationBooking,
  GetOwnerLocationBookingsParams,
  PaginatedData,
} from '@/types';
import { useQuery } from '@tanstack/react-query';
import { subMonths, addMonths, format } from 'date-fns';

export function useGetBookingsAtLocationAdmin(
  params: GetAllBookingsAtLocationParams
) {
  return useQuery({
    queryKey: ['bookingsAtLocationAdmin', params],
    queryFn: () => getBookingsAtLocationForAdmin(params),
    enabled: !!params.locationId && !!params.startDate && !!params.endDate,
    placeholderData: (previousData) => previousData,
  });
}
