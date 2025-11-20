import { useQuery } from '@tanstack/react-query';
import { getAllAccounts } from '@/api/admin';
import { ApiResponse, PaginatedData, User } from '@/types';

interface UseAllAccountsParams {
  page?: number;
  limit?: number;
  sortBy?: string[];
  search?: string;
  searchBy?: string[];
  filterRole?: string;
  filterHasOnboarded?: string;
  filterIsLocked?: string;
}

export const useAllAccounts = (params: UseAllAccountsParams = {}) => {
  return useQuery<ApiResponse<PaginatedData<User>>>({
    queryKey: ['admin', 'accounts', params],
    queryFn: () => getAllAccounts(params),
  });
};

