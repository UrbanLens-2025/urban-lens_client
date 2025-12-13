'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createWeeklyAvailability,
  CreateWeeklyAvailabilityPayload,
} from '@/api/availability';

export function useCreateWeeklyAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWeeklyAvailabilityPayload) =>
      createWeeklyAvailability(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['weeklyAvailabilities', variables.locationId],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
