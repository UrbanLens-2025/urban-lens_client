import { useQuery } from '@tanstack/react-query';
import { getAccountWarnings, GetAccountWarningsParams } from '@/api/admin';

export const useAccountWarnings = (params: GetAccountWarningsParams) => {
  return useQuery({
    queryKey: ['admin', 'account', params.accountId, 'warnings', params],
    queryFn: () => getAccountWarnings(params),
    enabled: !!params.accountId,
  });
};


