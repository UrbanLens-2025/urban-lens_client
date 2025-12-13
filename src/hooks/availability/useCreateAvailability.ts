'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createAvailability } from '@/api/availability';
import { CreateAvailabilityPayload } from '@/types';

export function useCreateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAvailabilityPayload) =>
      createAvailability(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
