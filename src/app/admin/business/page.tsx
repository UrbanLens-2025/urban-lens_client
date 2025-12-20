'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useBusinessAccounts } from '@/hooks/admin/useBusinessAccounts';
import { useProcessBusinessAccount } from '@/hooks/admin/useProcessBusinessAccount';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconSearch,
  IconFilter,
  IconBriefcase,
  IconCheck,
  IconX,
  IconRefresh,
  IconMail,
  IconPhone,
  IconWorld,
  IconFileText,
  IconUser,
  IconMapPin,
  IconCalendar,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CheckCircle, Clock, Loader2, XCircle, ChevronRight } from 'lucide-react';
import { BusinessProfile, BusinessStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ImageViewer } from '@/components/shared/ImageViewer';
import StatisticCard from '@/components/admin/StatisticCard';
import { toTitleCase } from '@/lib/utils';

export default function AdminBusinessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusTab, setStatusTab] = useState<BusinessStatus>(
    (searchParams.get('status') as BusinessStatus) || 'PENDING'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const itemsPerPage = 10;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();

    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    } else {
      params.delete('search');
    }

    if (statusTab !== 'PENDING') {
      params.set('status', statusTab);
    } else {
      params.delete('status');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusTab, page, pathname, router, searchParams]);

  const {
    data: response,
    isLoading,
    isFetching,
  } = useBusinessAccounts({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    status: statusTab,
    sortBy: 'createdAt:DESC',
  });
  const businesses = response?.data || [];
  const meta = response?.meta;

  const { mutate: processAccount, isPending } = useProcessBusinessAccount();

  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessProfile | null>(null);
  const [approvingBusiness, setApprovingBusiness] =
    useState<BusinessProfile | null>(null);
  const [rejectingBusiness, setRejectingBusiness] =
    useState<BusinessProfile | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAdminPopover, setShowAdminPopover] = useState(false);

  const handleConfirmApprove = () => {
    if (!approvingBusiness) return;
    processAccount(
      { id: approvingBusiness.accountId, payload: { status: 'APPROVED' } },
      {
        onSuccess: () => {
          setStatusTab('APPROVED');
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ['businessAccounts'] });
          setApprovingBusiness(null);
          // Keep selection if it's the same, or clear it if it moved lists
          if (selectedBusiness?.accountId === approvingBusiness.accountId) {
             // Optional: update local state to reflect change immediately
          }
        },
      }
    );
  };

  const handleConfirmReject = () => {
    if (!rejectingBusiness) return;
    processAccount(
      {
        id: rejectingBusiness.accountId,
        payload: { status: 'REJECTED', adminNotes: adminNotes },
      },
      {
        onSuccess: () => {
          setStatusTab('REJECTED');
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ['businessAccounts'] });
          setRejectingBusiness(null);
          setAdminNotes('');
        },
      }
    );
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['businessAccounts'] });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Fetch statistics for all statuses
  const { data: pendingResponse } = useBusinessAccounts({
    page: 1,
    limit: 1,
    status: 'PENDING',
    sortBy: 'createdAt:DESC',
  });

  const { data: approvedResponse } = useBusinessAccounts({
    page: 1,
    limit: 1,
    status: 'APPROVED',
    sortBy: 'createdAt:DESC',
  });

  const { data: rejectedResponse } = useBusinessAccounts({
    page: 1,
    limit: 1,
    status: 'REJECTED',
    sortBy: 'createdAt:DESC',
  });

  // Calculate statistics from API data
  const stats = useMemo(() => {
    const pending = pendingResponse?.meta?.totalItems || 0;
    const approved = approvedResponse?.meta?.totalItems || 0;
    const rejected = rejectedResponse?.meta?.totalItems || 0;
    const total = pending + approved + rejected;

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }, [
    pendingResponse?.meta?.totalItems,
    approvedResponse?.meta?.totalItems,
    rejectedResponse?.meta?.totalItems,
  ]);

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatisticCard
          title='Total Businesses'
          value={stats.total}
          icon={Briefcase}
          iconColorClass='blue'
          subtitle='All business accounts'
        />

        <StatisticCard
          title='Pending Businesses'
          value={stats.pending}
          icon={Clock}
          iconColorClass='amber'
          subtitle='Awaiting review'
        />

        <StatisticCard
          title='Approved Businesses'
          value={stats.approved}
          icon={CheckCircle}
          iconColorClass='green'
          subtitle='Approved businesses'
        />
        <StatisticCard
          title='Rejected Businesses'
          value={stats.rejected}
          icon={XCircle}
          iconColorClass='red'
          subtitle='Rejected businesses'
        />
      </div>

      {/* Two Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)]'>
        {/* Left Column - Business List */}
        <div className='lg:col-span-5 xl:col-span-4 flex flex-col border rounded-lg bg-card overflow-hidden'>
          {/* Search and Filters */}
          <div className='p-4 border-b space-y-3'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>All Registrations</h2>
              <Button
                variant='outline'
                size='icon'
                onClick={refresh}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <IconRefresh className='h-4 w-4' />
                )}
              </Button>
            </div>
            <div className='relative'>
              <IconSearch className='absolute left-2.5 top-4 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search businesses...'
                className='pl-8'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={statusTab}
              onValueChange={(value) => {
                setStatusTab(value as BusinessStatus);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <div className='flex items-center gap-2'>
                  <IconFilter className='h-4 w-4' />
                  <SelectValue placeholder='Filter by Status' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='PENDING'>Pending</SelectItem>
                <SelectItem value='APPROVED'>Approved</SelectItem>
                <SelectItem value='REJECTED'>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className='text-sm text-muted-foreground'>
              {meta?.totalItems || 0} results
            </div>
          </div>

          {/* Business List */}
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='flex items-center justify-center h-64'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : businesses.length === 0 ? (
              <div className='flex items-center justify-center h-64 text-muted-foreground'>
                <div className='text-center'>
                  <IconBriefcase className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No businesses found</p>
                </div>
              </div>
            ) : (
              <div className='divide-y'>
                {businesses.map((biz: BusinessProfile, index: number) => (
                  <div
                    key={biz.accountId}
                    onClick={() => {
                      setSelectedBusiness(biz);
                      setExpandedDescription(false);
                    }}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedBusiness?.accountId === biz.accountId
                        ? 'bg-muted border-l-4 border-l-primary'
                        : ''
                    }`}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-base line-clamp-1'>
                        {biz.name}
                      </h3>
                      <Badge variant='secondary' className='ml-2 shrink-0'>
                        {biz.category}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground mb-1'>
                      {biz.email}
                    </p>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-xs text-muted-foreground'>
                        {formatDateTime((biz as any).createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className='p-4 border-t flex items-center justify-between'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {meta.totalPages}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Details Panel */}
        <div className='lg:col-span-7 xl:col-span-8 border rounded-lg bg-card overflow-hidden'>
          {selectedBusiness ? (
            <div className='h-full overflow-y-auto'>
              <div className='p-6 pb-20'> {/* Added pb-20 to ensure content isn't cut off at bottom */}
                {/* Header with Name and Actions */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <div className='flex items-start gap-4'>
                      {selectedBusiness.avatar && (
                        <img
                          src={selectedBusiness.avatar}
                          alt={selectedBusiness.name}
                          className='w-16 h-16 rounded-lg object-cover border'
                        />
                      )}
                      <div className='flex-1'>
                        <h1 className='text-2xl font-bold mb-2'>
                          {selectedBusiness.name}
                        </h1>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <Badge variant='secondary'>
                            {selectedBusiness.category}
                          </Badge>
                          <Badge
                            variant={
                              (selectedBusiness as any).status === 'APPROVED'
                                ? 'default'
                                : (selectedBusiness as any).status ===
                                  'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {(selectedBusiness as any).status || statusTab}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Description - Truncated */}
                    {selectedBusiness.description && (
                      <div className='mt-4'>
                        <p
                          className={`text-sm text-muted-foreground ${
                            !expandedDescription ? 'line-clamp-2' : ''
                          }`}
                        >
                          {selectedBusiness.description}
                        </p>
                        {selectedBusiness.description.length > 150 && (
                          <button
                            onClick={() =>
                              setExpandedDescription(!expandedDescription)
                            }
                            className='text-sm text-blue-600 hover:underline mt-1'
                          >
                            {expandedDescription ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {statusTab === 'PENDING' && (
                    <div className='flex gap-2 ml-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setApprovingBusiness(selectedBusiness)}
                        className='border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800'
                      >
                        <IconCheck className='h-4 w-4 mr-1' />
                        Approve
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setRejectingBusiness(selectedBusiness)}
                        className='border-red-600 text-red-700 hover:bg-red-50 hover:text-red-800'
                      >
                        <IconX className='h-4 w-4 mr-1' />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Approval Notice - Above Documents */}
                {(selectedBusiness as any).status === 'APPROVED' &&
                  (selectedBusiness as any).processedBy && (
                    <Card className='mt-6 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 py-0'>
                      <CardContent className='pt-4 pb-4'>
                        <div className='flex items-start gap-3'>
                          <IconCheck className='h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5' />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm text-green-900 dark:text-green-100'>
                              This report was approved by{' '}
                              {(selectedBusiness as any).processedBy ? (
                                <Popover open={showAdminPopover} onOpenChange={setShowAdminPopover}>
                                  <PopoverTrigger asChild>
                                    <span
                                      className='font-medium cursor-pointer hover:underline'
                                      onMouseEnter={() => setShowAdminPopover(true)}
                                      onMouseLeave={() => setShowAdminPopover(false)}
                                    >
                                      {(selectedBusiness as any).processedBy?.firstName &&
                                      (selectedBusiness as any).processedBy?.lastName
                                        ? `${(selectedBusiness as any).processedBy.firstName} ${(selectedBusiness as any).processedBy.lastName}`
                                        : 'Admin'}
                                    </span>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className='w-64'
                                    side='top'
                                    onMouseEnter={() => setShowAdminPopover(true)}
                                    onMouseLeave={() => setShowAdminPopover(false)}
                                  >
                                    <div className='space-y-2'>
                                      <div>
                                        <p className='text-xs font-medium text-muted-foreground mb-1'>
                                          Admin Information
                                        </p>
                                        <p className='text-sm font-semibold'>
                                          {(selectedBusiness as any).processedBy?.firstName &&
                                          (selectedBusiness as any).processedBy?.lastName
                                            ? `${(selectedBusiness as any).processedBy.firstName} ${(selectedBusiness as any).processedBy.lastName}`
                                            : 'Admin'}
                                        </p>
                                      </div>
                                      {(selectedBusiness as any).processedBy?.email && (
                                        <div>
                                          <p className='text-xs font-medium text-muted-foreground mb-0.5'>
                                            Email
                                          </p>
                                          <p className='text-sm'>
                                            {(selectedBusiness as any).processedBy.email}
                                          </p>
                                        </div>
                                      )}
                                      {(selectedBusiness as any).processedBy?.phoneNumber && (
                                        <div>
                                          <p className='text-xs font-medium text-muted-foreground mb-0.5'>
                                            Phone
                                          </p>
                                          <p className='text-sm'>
                                            {(selectedBusiness as any).processedBy.phoneNumber}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span className='font-medium'>Admin</span>
                              )}{' '}
                              on{' '}
                              {(selectedBusiness as any).processedAt && (
                                <span className='font-medium'>
                                  {formatDateTime((selectedBusiness as any).processedAt)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Rejection Notice - Above Documents */}
                {(selectedBusiness as any).status === 'REJECTED' &&
                  selectedBusiness.adminNotes && (
                    <Card className='mt-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 py-0'>
                      <CardContent className='pt-6 pb-4'>
                        <div className='flex items-start gap-3'>
                          <IconX className='h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5' />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm text-red-900 dark:text-red-100'>
                              This report has been rejected by{' '}
                              {(selectedBusiness as any).processedBy ? (
                                <Popover open={showAdminPopover} onOpenChange={setShowAdminPopover}>
                                  <PopoverTrigger asChild>
                                    <span
                                      className='font-medium cursor-pointer hover:underline'
                                      onMouseEnter={() => setShowAdminPopover(true)}
                                      onMouseLeave={() => setShowAdminPopover(false)}
                                    >
                                      {(selectedBusiness as any).processedBy?.firstName &&
                                      (selectedBusiness as any).processedBy?.lastName
                                        ? `${(selectedBusiness as any).processedBy.firstName} ${(selectedBusiness as any).processedBy.lastName}`
                                        : 'Admin'}
                                    </span>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className='w-64'
                                    side='top'
                                    onMouseEnter={() => setShowAdminPopover(true)}
                                    onMouseLeave={() => setShowAdminPopover(false)}
                                  >
                                    <div className='space-y-2'>
                                      <div>
                                        <p className='text-xs font-medium text-muted-foreground mb-1'>
                                          Admin Information
                                        </p>
                                        <p className='text-sm font-semibold'>
                                          {(selectedBusiness as any).processedBy?.firstName &&
                                          (selectedBusiness as any).processedBy?.lastName
                                            ? `${(selectedBusiness as any).processedBy.firstName} ${(selectedBusiness as any).processedBy.lastName}`
                                            : 'Admin'}
                                        </p>
                                      </div>
                                      {(selectedBusiness as any).processedBy?.email && (
                                        <div>
                                          <p className='text-xs font-medium text-muted-foreground mb-0.5'>
                                            Email
                                          </p>
                                          <p className='text-sm'>
                                            {(selectedBusiness as any).processedBy.email}
                                          </p>
                                        </div>
                                      )}
                                      {(selectedBusiness as any).processedBy?.phoneNumber && (
                                        <div>
                                          <p className='text-xs font-medium text-muted-foreground mb-0.5'>
                                            Phone
                                          </p>
                                          <p className='text-sm'>
                                            {(selectedBusiness as any).processedBy.phoneNumber}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span className='font-medium'>Admin</span>
                              )}{' '}
                              for reason:{' '}
                              <span className='font-medium'>
                                {selectedBusiness.adminNotes}
                              </span>
                            </p>
                            {(selectedBusiness as any).processedAt && (
                              <p className='text-xs text-red-700 dark:text-red-300 mt-2 text-right'>
                                {formatDateTime((selectedBusiness as any).processedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Documents - Full Width */}
                {(selectedBusiness as any).licenses &&
                  (selectedBusiness as any).licenses.length > 0 && (
                    <Card className='mt-6'>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <IconFileText className='h-4 w-4' />
                          Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-3'>
                          {(selectedBusiness as any).licenses.map(
                            (license: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => setSelectedLicense(license)}
                                className='w-full border border-primary/20 rounded-lg p-4 bg-primary/10 hover:bg-primary/20 transition-colors text-left cursor-pointer group flex items-center gap-3'
                              >
                                <IconFileText className='h-5 w-5 text-primary shrink-0' />
                                <div className='flex-1 min-w-0'>
                                  <p className='font-medium text-sm text-primary'>
                                    {toTitleCase(
                                      license.licenseType || 'Business License'
                                    )}
                                  </p>
                                  {license.documentImageUrls &&
                                    license.documentImageUrls.length > 0 && (
                                      <p className='text-xs text-primary/70 mt-1'>
                                        {license.documentImageUrls.length}{' '}
                                        {license.documentImageUrls.length === 1
                                          ? 'image'
                                          : 'images'}
                                      </p>
                                    )}
                                </div>
                                <ChevronRight className='h-5 w-5 text-primary/70 shrink-0' />
                              </button>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Two Column Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                  {/* Contact Information Card */}
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className='text-base flex items-center gap-2'>
                        <IconUser className='h-4 w-4' />
                        Business Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-1.5 pt-0 pb-3'>
                      <div className='flex items-start gap-2'>
                        <IconMail className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <p className='text-xs font-medium text-muted-foreground mb-0.5'>
                            Email
                          </p>
                          <p className='text-sm break-all'>
                            {selectedBusiness.email}
                          </p>
                        </div>
                      </div>
                      {selectedBusiness.phone && (
                        <div className='flex items-start gap-2'>
                          <IconPhone className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <p className='text-xs font-medium text-muted-foreground mb-0.5'>
                              Phone
                            </p>
                            <p className='text-sm'>{selectedBusiness.phone}</p>
                          </div>
                        </div>
                      )}
                      {selectedBusiness.website && (
                        <div className='flex items-start gap-2'>
                          <IconWorld className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <p className='text-xs font-medium text-muted-foreground mb-0.5'>
                              Website
                            </p>
                            <a
                              href={selectedBusiness.website}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-sm text-blue-600 hover:underline break-all'
                            >
                              {selectedBusiness.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                   {/* Location & System Info Card */}
                   <Card className="h-full">
                    <CardHeader>
                      <CardTitle className='text-base flex items-center gap-2'>
                        <IconMapPin className='h-4 w-4' />
                        Location & System Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                       <div>
                          <p className='text-xs font-medium text-muted-foreground mb-1'>
                            Full Address
                          </p>
                          <p className='text-sm text-foreground'>
                            {[
                              (selectedBusiness as any).addressLine,
                              (selectedBusiness as any).addressLevel1,
                              (selectedBusiness as any).addressLevel2,
                            ]
                              .filter(Boolean)
                              .join(', ') || 'Not provided'}
                          </p>
                       </div>
                       <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <div>
                            <p className='text-xs font-medium text-muted-foreground mb-1'>
                              Created
                            </p>
                            <p className='text-sm'>
                              {formatDateTime((selectedBusiness as any).createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className='text-xs font-medium text-muted-foreground mb-1'>
                              Updated
                            </p>
                            <p className='text-sm'>
                               {formatDateTime((selectedBusiness as any).updatedAt)}
                            </p>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </div>

                    <span>→</span>
                {/* Admin Notes Card (Full Width) */}
                {selectedBusiness.adminNotes && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className='text-base flex items-center gap-2'>
                        <IconFileText className='h-4 w-4' />
                        Admin Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-sm whitespace-pre-wrap'>
                        {selectedBusiness.adminNotes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Business Licenses - Full Width */}
                {(selectedBusiness as any).licenses &&
                  (selectedBusiness as any).licenses.length > 0 && (
                    <Card className='mt-4'>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <IconFileText className='h-4 w-4' />
                          Business Licenses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-4'>
                          {(selectedBusiness as any).licenses.map(
                            (license: any, index: number) => (
                              <div
                                key={index}
                                className='border rounded-lg p-4 bg-muted/20'
                              >
                                <div className="flex flex-wrap gap-4 items-start justify-between mb-4">
                                  <div>
                                     <Badge variant='outline' className='mb-2'>
                                      {license.licenseType?.replace(/_/g, ' ') || 'License'}
                                    </Badge>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-2">
                                        {license.licenseNumber && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">License Number</p>
                                                <p className="text-sm font-medium">{license.licenseNumber}</p>
                                            </div>
                                        )}
                                        {license.licenseExpirationDate && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Expiration Date</p>
                                                <p className="text-sm font-medium flex items-center gap-1">
                                                    <IconCalendar className="h-3 w-3" />
                                                    {formatDate(license.licenseExpirationDate)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                                
                                {license.documentImageUrls &&
                                  license.documentImageUrls.length > 0 && (
                                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3'>
                                      {license.documentImageUrls.map(
                                        (url: string, imgIndex: number) => (
                                          <a
                                            key={imgIndex}
                                            href={url}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors'
                                          >
                                            <img
                                              src={url}
                                              alt={`License document ${
                                                imgIndex + 1
                                              }`}
                                              className='w-full h-full object-cover'
                                            />
                                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
                                          </a>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Legacy Single License Fields (Fallback) */}
                  {((selectedBusiness as any).licenseNumber || (selectedBusiness as any).licenseType || (selectedBusiness as any).licenseExpirationDate) && 
                   (!(selectedBusiness as any).licenses || (selectedBusiness as any).licenses.length === 0) && (
                     <Card className='mt-4'>
                       <CardHeader>
                         <CardTitle className='text-base flex items-center gap-2'>
                           <IconFileText className='h-4 w-4' />
                           Legacy License Info
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                  <p className="text-xs text-muted-foreground">License Number</p>
                                  <p className="text-sm font-medium">{(selectedBusiness as any).licenseNumber || '-'}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-muted-foreground">Type</p>
                                  <p className="text-sm font-medium">{(selectedBusiness as any).licenseType || '-'}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-muted-foreground">Expiration</p>
                                  <p className="text-sm font-medium">{formatDate((selectedBusiness as any).licenseExpirationDate)}</p>
                              </div>
                           </div>
                       </CardContent>
                     </Card>
                  )}

              </div>
            </div>
          ) : (
            <div className='h-full flex items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <IconBriefcase className='h-16 w-16 mx-auto mb-4 opacity-20' />
                <p className='text-lg font-medium'>Select a business</p>
                <p className='text-sm mt-1'>
                  Choose a business from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!approvingBusiness}
        onOpenChange={() => setApprovingBusiness(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this Business Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the business &quot;
              {approvingBusiness?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={isPending}
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Confirm Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!rejectingBusiness}
        onOpenChange={() => setRejectingBusiness(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this Business Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting &quot;
              {rejectingBusiness?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder='Reason for rejection...'
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className='mt-4'
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isPending}
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* License Images Modal */}
      <Dialog
        open={!!selectedLicense}
        onOpenChange={(open) => !open && setSelectedLicense(null)}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <IconFileText className='h-5 w-5' />
              {toTitleCase(
                selectedLicense?.licenseType || 'Business License'
              )}
            </DialogTitle>
            <DialogDescription>
              View all images for this license
            </DialogDescription>
          </DialogHeader>
          {selectedLicense?.documentImageUrls &&
            selectedLicense.documentImageUrls.length > 0 && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                {selectedLicense.documentImageUrls.map(
                  (url: string, index: number) => (
                    <div
                      key={index}
                      className='relative w-full aspect-video bg-muted rounded-lg overflow-hidden border group cursor-pointer'
                      onClick={() => setPreviewImage(url)}
                    >
                      <img
                        src={url}
                        alt={`License document ${index + 1}`}
                        className='w-full h-full object-cover group-hover:opacity-90 transition-opacity'
                      />
                      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                        <span className='text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium'>
                          Click to view full size
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImageViewer
        src={previewImage || ''}
        alt='License document preview'
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      />
    </div>
  );
}