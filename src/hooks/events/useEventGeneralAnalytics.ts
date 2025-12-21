import { getEventGeneralAnalytics } from "@/api/events";
import { useQuery } from "@tanstack/react-query";

export const useEventGeneralAnalytics = (eventId: string) => {
    return useQuery({
        queryKey: ['eventGeneralAnalytics', eventId],
        queryFn: () => getEventGeneralAnalytics(eventId),
        enabled: !!eventId,
    });
};