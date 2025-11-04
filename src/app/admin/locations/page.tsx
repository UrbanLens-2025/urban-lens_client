'use client';

import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, ArrowUp, Edit, Loader2, PlusCircle } from 'lucide-react';
import { Location, LocationRequest, SortState } from '@/types';
import { useProcessLocationRequest } from '@/hooks/admin/useProcessLocationRequest';
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
import { Textarea } from '@/components/ui/textarea';
import { useLocationAdminRequests } from '@/hooks/admin/useLocationAdminRequests';
import Link from 'next/link';
import { useAllLocations } from '@/hooks/admin/useAllLocations';
import StatsCard from '@/components/admin/stats-card';
import { locationStats } from '@/constants/admin/location-stats';
import {
  IconCheck,
  IconEdit,
  IconEye,
  IconFilter,
  IconFlag,
  IconPlus,
  IconSearch,
  IconX,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatDateTime } from '@/lib/utils';

export default function LocationDashboardPage() {
  // Unified search and sort state
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const sortByString = `${sort.column}:${sort.direction}`;

  // Data fetching
  const { data: requestsResponse } = useLocationAdminRequests(
    page,
    debouncedSearchTerm,
    sortByString
  );
  const requests = requestsResponse?.data || [];
  console.log('🚀 ~ LocationDashboardPage ~ requests:', requests);
  const requestsMeta = requestsResponse?.meta;

  const { data: locationsResponse } = useAllLocations(
    page,
    debouncedSearchTerm,
    sortByString
  );
  const locations = locationsResponse?.data || [];
  console.log('🚀 ~ LocationDashboardPage ~ locations:', locations);
  const locationsMeta = locationsResponse?.meta;

  // Request processing
  const { mutate: processRequest, isPending } = useProcessLocationRequest();
  const [approvingRequest, setApprovingRequest] =
    useState<LocationRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] =
    useState<LocationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Sort
  const handleSort = (columnName: string) => {
    setSort((prev) => ({
      column: columnName,
      direction:
        prev.column === columnName && prev.direction === 'DESC'
          ? 'ASC'
          : 'DESC',
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    const IconComponent = sort.direction === 'ASC' ? ArrowUp : ArrowDown;
    return <IconComponent className='ml-2 h-4 w-4' />;
  };

  const handleConfirmApprove = () => {
    if (!approvingRequest) return;
    processRequest(
      { id: approvingRequest.id, payload: { status: 'APPROVED' } },
      {
        onSuccess: () => {
          setApprovingRequest(null);
        },
      }
    );
  };
  const handleConfirmReject = () => {
    if (rejectingRequest) {
      processRequest(
        {
          id: rejectingRequest.id,
          payload: { status: 'REJECTED', adminNotes: rejectReason },
        },
        {
          onSuccess: () => {
            setRejectingRequest(null);
            setRejectReason('');
          },
        }
      );
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Location Management</h1>
        <Link href='/admin/locations/create'>
          <Button className='flex items-center gap-2'>
            <IconPlus size={24} />
            <p>Public New Location</p>
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        {locationStats.map((stat: any) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue='all-locations'
        className='space-y-6'
        onValueChange={() => {
          setPage(1);
          setSearchTerm('');
          setSort({ column: 'createdAt', direction: 'DESC' });
        }}
      >
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='all-locations'>All Locations</TabsTrigger>
          <TabsTrigger value='pending-requests'>Pending Requests</TabsTrigger>
        </TabsList>
        {/* All Locations Tab */}
        <TabsContent value='all-locations' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>
                  All Approved Locations ({locationsMeta?.totalItems || 0})
                </span>
                <div className='flex items-center gap-2'>
                  <Input
                    placeholder='Search by Name'
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                  <Button variant='outline' size='icon'>
                    <IconSearch className='h-4 w-4' />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Showing page {locationsMeta?.currentPage} of{' '}
                {locationsMeta?.totalPages}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant='ghost'
                        onClick={() => handleSort('name')}
                      >
                        Location <SortIcon column='name' />
                      </Button>
                    </TableHead>
                    <TableHead>Business Owner</TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        onClick={() => handleSort('createdAt')}
                      >
                        Created At <SortIcon column='createdAt' />
                      </Button>
                    </TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((loc: Location) => (
                    <TableRow key={loc.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-4'>
                          <Image
                            src={
                              loc.imageUrl[0] || 'https://placehold.co/80x80'
                            }
                            alt={loc.name}
                            width={80}
                            height={80}
                            className=' rounded-md'
                          />
                          <Link
                            href={`/admin/locations/${loc.id}`}
                            className='hover:underline'
                          >
                            {loc.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>{loc.business?.name || 'N/A'}</TableCell>
                      <TableCell>{formatDateTime(loc.createdAt)}</TableCell>
                      <TableCell className='text-right'>
                        <Button asChild variant='outline' size='sm'>
                          <Link
                            href={`/admin/locations/${loc.id}`}
                            className='flex items-center gap-2'
                          >
                            <IconEye className='h-4 w-4' /> View
                          </Link>
                        </Button>
                        <Button asChild variant='ghost'>
                          <Link href={`/admin/locations/${loc.id}/edit`}>
                            <IconEdit className='h-4 w-4' /> Edit
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {locations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center h-24'>
                        No locations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className='flex items-center justify-end space-x-2 py-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page - 1)}
                  disabled={!locationsMeta || locationsMeta.currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page + 1)}
                  disabled={
                    !locationsMeta ||
                    locationsMeta.currentPage >= locationsMeta.totalPages
                  }
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Pending Requests Tab */}
        <TabsContent value='pending-requests' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>
                  All Pending Requests ({requestsMeta?.totalItems || 0})
                </span>
                <div className='flex items-center gap-2'>
                  <Input
                    placeholder='Search requests...'
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                  <Button variant='outline' size='icon'>
                    <IconSearch className='h-4 w-4' />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Showing page {requestsMeta?.currentPage} of{' '}
                {requestsMeta?.totalPages}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant='ghost'
                        onClick={() => handleSort('name')}
                      >
                        Location Name <SortIcon column='name' />
                      </Button>
                    </TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        onClick={() => handleSort('createdAt')}
                      >
                        Date <SortIcon column='createdAt' />
                      </Button>
                    </TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: LocationRequest) => (
                    <TableRow key={req.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-4'>
                          <Image
                            src={
                              // req.locationImageUrls[0] ||
                              'https://placehold.co/80x80'
                            }
                            alt={req.name}
                            width={80}
                            height={80}
                            className=' rounded-md'
                          />
                          <Link
                            href={`/admin/locations/request/${req.id}`}
                            className='hover:underline'
                          >
                            {req.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        {`${req.createdBy?.firstName} ${req.createdBy?.lastName}` ||
                          'N/A'}
                      </TableCell>
                      <TableCell>
                        {req.createdBy?.businessProfile?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right space-x-2'>
                        <Button asChild variant='outline' size='sm'>
                          <Link href={`/admin/locations/request/${req.id}`}>
                            View
                          </Link>
                        </Button>
                        <Button
                          size='sm'
                          onClick={() => setApprovingRequest(req)}
                          disabled={isPending}
                          className='bg-green-600 hover:bg-green-700'
                        >
                          Approve
                        </Button>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => setRejectingRequest(req)}
                          disabled={isPending}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center h-24'>
                        No pending requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className='flex items-center justify-end space-x-2 py-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page - 1)}
                  disabled={!requestsMeta || requestsMeta.currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page + 1)}
                  disabled={
                    !requestsMeta ||
                    requestsMeta.currentPage >= requestsMeta.totalPages
                  }
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <AlertDialog
        open={!!approvingRequest}
        onOpenChange={() => setApprovingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this Location Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the location &quot;
              {approvingRequest?.name}&quot;? This action will make it public.
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
      {/* Reject Dialog */}
      <AlertDialog
        open={!!rejectingRequest}
        onOpenChange={() => {
          setRejectingRequest(null);
          setRejectReason('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to reject this request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection. This note will be visible
              to the business owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder='Reason for rejection...'
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
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
    </div>
  );
}
