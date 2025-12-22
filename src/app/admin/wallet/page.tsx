'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Lock, Building2 } from 'lucide-react';
import { useAdminWallets } from '@/hooks/admin/useAdminWallets';
import { useAdminExternalTransactions } from '@/hooks/admin/useAdminExternalTransactions';
import { useAdminInternalWalletTransactions } from '@/hooks/admin/useAdminInternalWalletTransactions';
import type { WalletExternalTransaction, WalletTransaction } from '@/types';
import { PageContainer } from '@/components/shared/PageContainer';
import { SystemWalletTab } from './components/SystemWalletTab';
import { EscrowWalletTab } from './components/EscrowWalletTab';
import { ExternalTransactionsTab } from './components/ExternalTransactionsTab';


export default function AdminWalletPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const validTabs = ['external-transactions', 'system-wallet', 'escrow-wallet'];
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) 
    ? tabFromUrl 
    : 'external-transactions';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt:DESC');
  const [systemInternalSearch, setSystemInternalSearch] = useState('');
  const [debouncedSystemInternalSearch] = useDebounce(systemInternalSearch, 500);
  const [systemInternalStatusFilter, setSystemInternalStatusFilter] =
    useState<string>('all');
  const [systemInternalSortBy, setSystemInternalSortBy] =
    useState<string>('createdAt:DESC');
  const [escrowInternalSearch, setEscrowInternalSearch] = useState('');
  const [debouncedEscrowInternalSearch] = useDebounce(escrowInternalSearch, 500);
  const [escrowInternalStatusFilter, setEscrowInternalStatusFilter] =
    useState<string>('all');
  const [escrowInternalSortBy, setEscrowInternalSortBy] =
    useState<string>('createdAt:DESC');
  const [systemInternalPage, setSystemInternalPage] = useState(1);
  const [escrowInternalPage, setEscrowInternalPage] = useState(1);
  const itemsPerPage = 10;
  const internalItemsPerPage = 10;

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (activeTab !== 'external-transactions') {
      params.set('tab', activeTab);
    } else {
      params.delete('tab');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [activeTab, pathname, router, searchParams]);

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    setSystemInternalPage(1);
  }, [debouncedSystemInternalSearch, setSystemInternalPage]);

  useEffect(() => {
    setEscrowInternalPage(1);
  }, [debouncedEscrowInternalSearch, setEscrowInternalPage]);

  const { escrowWallet, systemWallet, isLoading } = useAdminWallets();

  const { data: transactionsData, isLoading: isLoadingTransactions } =
    useAdminExternalTransactions({
      page: currentPage,
      limit: itemsPerPage,
      sortBy,
    });

  const transactions = transactionsData?.data || [];
  console.log('🚀 ~ AdminWalletPage ~ transactions:', transactions);
  const totalPages = transactionsData?.meta.totalPages || 1;
  const totalItems = transactionsData?.meta.totalItems || 0;

  // Admin internal transactions per wallet (system & escrow)
  const { data: systemInternalData, isLoading: isLoadingSystemInternal } =
    useAdminInternalWalletTransactions(
      systemWallet
        ? {
            walletId: systemWallet.id,
            page: systemInternalPage,
            limit: internalItemsPerPage,
            sortBy: systemInternalSortBy,
            search: debouncedSystemInternalSearch.trim() || undefined,
          }
        : null
    );

  const systemInternalTransactions: WalletTransaction[] =
    systemInternalData?.data || [];
  const systemInternalMeta = systemInternalData?.meta;
  console.log(
    '🚀 ~ AdminWalletPage ~ systemInternalTransactions:',
    systemInternalTransactions
  );

  const { data: escrowInternalData, isLoading: isLoadingEscrowInternal } =
    useAdminInternalWalletTransactions(
      escrowWallet
        ? {
            walletId: escrowWallet.id,
            page: escrowInternalPage,
            limit: internalItemsPerPage,
            sortBy: escrowInternalSortBy,
            search: debouncedEscrowInternalSearch.trim() || undefined,
          }
        : null
    );

  const escrowInternalTransactions: WalletTransaction[] =
    escrowInternalData?.data || [];
  const escrowInternalMeta = escrowInternalData?.meta;
  console.log(
    '🚀 ~ AdminWalletPage ~ escrowInternalTransactions:',
    escrowInternalTransactions
  );

  // Filter transactions client-side
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: WalletExternalTransaction) => {
      if (
        statusFilter !== 'all' &&
        t.status.toUpperCase() !== statusFilter.toUpperCase()
      ) {
        return false;
      }
      if (
        directionFilter !== 'all' &&
        t.direction.toUpperCase() !== directionFilter.toUpperCase()
      ) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const providerOrderId =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t as any).providerResponse?.order?.order_id ?? '';
        const providerTransactionId =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t as any).providerResponse?.transaction?.transaction_id ?? '';

        const searchableText = [
          t.id,
          t.createdBy?.email,
          t.createdBy?.firstName,
          t.createdBy?.lastName,
          t.amount,
          t.withdrawBankName,
          t.withdrawBankAccountNumber,
          t.providerTransactionId,
          providerOrderId,
          providerTransactionId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, statusFilter, directionFilter, searchQuery]);

  // Calculate stats for external transactions tab
  const stats = useMemo(() => {
    return {
      totalDeposits: transactions
        .filter(
          (t: WalletExternalTransaction) =>
            t.direction.toUpperCase() === 'DEPOSIT'
        )
        .reduce(
          (sum: number, t: WalletExternalTransaction) =>
            sum + parseFloat(t.amount),
          0
        ),
      totalWithdrawals: transactions
        .filter(
          (t: WalletExternalTransaction) =>
            t.direction.toUpperCase() === 'WITHDRAW'
        )
        .reduce(
          (sum: number, t: WalletExternalTransaction) =>
            sum + parseFloat(t.amount),
          0
        ),
      pendingCount: transactions.filter(
        (t: WalletExternalTransaction) => t.status.toUpperCase() === 'PENDING'
      ).length,
      completedCount: transactions.filter(
        (t: WalletExternalTransaction) => t.status.toUpperCase() === 'COMPLETED'
      ).length,
    };
  }, [transactions]);

  // System internal transactions: filter by status (search and sorting are done server-side)
  const filteredSystemInternal = useMemo(() => {
    let data = [...systemInternalTransactions];

    if (systemInternalStatusFilter !== 'all') {
      data = data.filter(
        (t) =>
          t.status.toUpperCase() === systemInternalStatusFilter.toUpperCase()
      );
    }

    return data;
  }, [
    systemInternalTransactions,
    systemInternalStatusFilter,
  ]);

  // Escrow internal transactions: filter by status (search and sorting are done server-side)
  const filteredEscrowInternal = useMemo(() => {
    let data = [...escrowInternalTransactions];

    if (escrowInternalStatusFilter !== 'all') {
      data = data.filter(
        (t) =>
          t.status.toUpperCase() === escrowInternalStatusFilter.toUpperCase()
      );
    }

    return data;
  }, [
    escrowInternalTransactions,
    escrowInternalStatusFilter,
  ]);

  return (
    <PageContainer>
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='grid w-full max-w-xl grid-cols-3 h-12 bg-primary/10'>
          <TabsTrigger
            value='external-transactions'
            className='flex items-center gap-2'
          >
            <Building2 className='h-4 w-4' />
            <span className='text-sm font-medium'>External Transactions</span>
          </TabsTrigger>
          <TabsTrigger
            value='system-wallet'
            className='flex items-center gap-2'
          >
            <Wallet className='h-4 w-4' />
            <span className='text-sm font-medium'>System wallet</span>
          </TabsTrigger>
          <TabsTrigger
            value='escrow-wallet'
            className='flex items-center gap-2'
          >
            <Lock className='h-4 w-4' />
            <span className='text-sm font-medium'>Escrow wallet</span>
          </TabsTrigger>
        </TabsList>

        {/* System Wallet Tab */}
        <TabsContent value='system-wallet' className='space-y-6'>
          <SystemWalletTab
            systemWallet={systemWallet}
            isLoading={isLoading}
            systemInternalTransactions={systemInternalTransactions}
            isLoadingSystemInternal={isLoadingSystemInternal}
            systemInternalSearch={systemInternalSearch}
            setSystemInternalSearch={setSystemInternalSearch}
            systemInternalStatusFilter={systemInternalStatusFilter}
            setSystemInternalStatusFilter={setSystemInternalStatusFilter}
            systemInternalSortBy={systemInternalSortBy}
            setSystemInternalSortBy={setSystemInternalSortBy}
            filteredSystemInternal={filteredSystemInternal}
            systemInternalPage={systemInternalPage}
            setSystemInternalPage={setSystemInternalPage}
            systemInternalMeta={systemInternalMeta}
            internalItemsPerPage={internalItemsPerPage}
          />
        </TabsContent>

        {/* Escrow Wallet Tab */}
        <TabsContent value='escrow-wallet' className='space-y-6'>
          <EscrowWalletTab
            escrowWallet={escrowWallet}
            isLoading={isLoading}
            escrowInternalTransactions={escrowInternalTransactions}
            isLoadingEscrowInternal={isLoadingEscrowInternal}
            escrowInternalSearch={escrowInternalSearch}
            setEscrowInternalSearch={setEscrowInternalSearch}
            escrowInternalStatusFilter={escrowInternalStatusFilter}
            setEscrowInternalStatusFilter={setEscrowInternalStatusFilter}
            escrowInternalSortBy={escrowInternalSortBy}
            setEscrowInternalSortBy={setEscrowInternalSortBy}
            filteredEscrowInternal={filteredEscrowInternal}
            escrowInternalPage={escrowInternalPage}
            setEscrowInternalPage={setEscrowInternalPage}
            escrowInternalMeta={escrowInternalMeta}
            internalItemsPerPage={internalItemsPerPage}
          />
        </TabsContent>

        {/* External Transactions Tab */}
        <TabsContent value='external-transactions' className='space-y-6'>
          <ExternalTransactionsTab
            stats={stats}
            filteredTransactions={filteredTransactions}
            isLoadingTransactions={isLoadingTransactions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            directionFilter={directionFilter}
            setDirectionFilter={setDirectionFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalItems={totalItems}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
