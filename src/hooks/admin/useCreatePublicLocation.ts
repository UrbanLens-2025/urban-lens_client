'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPublicLocation } from '@/api/admin';
import { CreatePublicLocationPayload } from '@/types';
import { useRouter } from 'next/navigation';

export function useCreatePublicLocation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreatePublicLocationPayload) =>
      createPublicLocation(payload),
    onSuccess: () => {
      toast.success('Public location created successfully!');
      queryClient.invalidateQueries({ queryKey: ['allLocations'] });
      router.push('/admin/locations');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create public location.');
    },
  });
}
