import { getAdminTicketOrderById } from '@/api/admin';
import { useQuery } from '@tanstack/react-query';

export function useAdminTicketOrderById(id: string | undefined, enabled: boolean = true) {
    return useQuery({
        queryKey: ["admin-ticket-order", id],
        queryFn: () => {
            if (!id) throw new Error("ID is required");
            return getAdminTicketOrderById(id);
        },
        enabled: enabled && !!id,
    });
}