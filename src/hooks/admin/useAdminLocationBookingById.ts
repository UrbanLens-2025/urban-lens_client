// hooks/admin/useAdminLocationBookingById.ts
import { useQuery } from '@tanstack/react-query';
import { getAdminLocationBookingById } from '@/api/admin';

export function useAdminLocationBookingById(id: string, enabled: boolean) {
    return useQuery({
        queryKey: ["admin-location-booking", id],
        queryFn: () => {
          if (!id) throw new Error("ID is required");
          return getAdminLocationBookingById(id);
        },
        enabled: enabled && !!id,
      });
}