import { useQuery } from '@tanstack/react-query';
import { getAccountSuspensions, GetAccountSuspensionsParams } from '@/api/admin';

export const useAccountSuspensions = (params: GetAccountSuspensionsParams) => {
  return useQuery({
    queryKey: ['admin', 'account', params.accountId, 'suspensions', params],
    queryFn: () => getAccountSuspensions(params),
    enabled: !!params.accountId,
  });
};

