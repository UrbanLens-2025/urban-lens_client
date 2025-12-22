import { useQuery } from '@tanstack/react-query';
import { getAdminEventById } from '@/api/admin';

export function useAdminEventById(id: string | undefined, enabled: boolean = true) {
    return useQuery({
      queryKey: ["admin-event", id],
      queryFn: () => {
        if (!id) throw new Error("ID is required");
        return getAdminEventById(id);
      },
      enabled: enabled && !!id,
    });
  }