import { useQuery } from '@tanstack/react-query';
import { getAccountById } from '@/api/admin';
import { User } from '@/types';

export const useAccountById = (accountId: string) => {
  return useQuery<User>({
    queryKey: ['admin', 'account', accountId],
    queryFn: () => getAccountById(accountId),
    enabled: !!accountId,
  });
};

