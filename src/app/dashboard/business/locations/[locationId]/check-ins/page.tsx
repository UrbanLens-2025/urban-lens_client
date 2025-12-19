'use client';

import { use, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
  Loader2,
  MapPin,
  Users,
  Clock,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocationCheckIns } from '@/hooks/locations/useLocationCheckIns';
import { useLocationById } from '@/hooks/locations/useLocationById';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LocationCheckInsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt:DESC');

  const [debouncedSearch] = useDebounce(searchTerm, 400);

  const {
    data: location,
    isLoading: isLoadingLocation,
    isError: isLocationError,
  } = useLocationById(locationId);

  const { data, isLoading, isError, isFetching } = useLocationCheckIns({
    locationId,
    page,
    limit,
    sortBy,
  });

  const checkIns = data?.data ?? [];
  const meta = data?.meta;

  // Filter check-ins by search term (user name or email)
  const filteredCheckIns = useMemo(() => {
    if (!debouncedSearch) return checkIns;
    const searchLower = debouncedSearch.toLowerCase();
    return checkIns.filter((checkIn: any) => {
      const account = checkIn.userProfile?.account;
      if (!account) return false;
      const fullName = `${account.firstName || ''} ${account.lastName || ''}`.trim().toLowerCase();
      const email = account.email?.toLowerCase() || '';
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }, [checkIns, debouncedSearch]);

  if (isLoadingLocation) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isLocationError || !location) {
    return (
      <div className='text-center py-20 text-red-500'>
        <p className='font-medium'>Error loading location</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card className='pb-6 pt-3'>
        <CardHeader className='pb-3 pt-4'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <MapPin className='h-5 w-5 text-primary' />
            Check-ins
          </CardTitle>
          <CardDescription>
            Recent check-ins at {location.name}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Search and Filters */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by name or email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9'
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='w-full sm:w-[200px]'>
                <SelectValue placeholder='Sort by' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='createdAt:DESC'>Newest First</SelectItem>
                <SelectItem value='createdAt:ASC'>Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading || isFetching ? (
            <div className='flex items-center justify-center py-20'>
              <Loader2 className='h-10 w-10 animate-spin text-muted-foreground' />
            </div>
          ) : isError ? (
            <div className='text-center py-20 text-red-500'>
              <p className='font-medium'>Error loading check-ins</p>
            </div>
          ) : filteredCheckIns.length === 0 ? (
            <div className='text-center py-20 text-muted-foreground'>
              <MapPin className='h-12 w-12 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>
                {debouncedSearch ? 'No check-ins found' : 'No check-ins yet'}
              </p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCheckIns.map((checkIn: any) => {
                      const account = checkIn.userProfile?.account;
                      const userName = account
                        ? `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.email
                        : 'Unknown User';
                      const userEmail = account?.email || '';
                      const avatarUrl = account?.avatarUrl;
                      const initials = account
                        ? `${account.firstName?.[0] || ''}${account.lastName?.[0] || ''}`.trim().toUpperCase() || userEmail[0]?.toUpperCase() || '?'
                        : '?';
                      
                      const checkInDate = new Date(checkIn.createdAt);
                      const formattedDate = format(checkInDate, 'MMM dd, yyyy');
                      const formattedTime = format(checkInDate, 'HH:mm');
                      const timeAgo = formatDistanceToNow(checkInDate, { addSuffix: true });

                      return (
                        <TableRow key={checkIn.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-10 w-10'>
                                <AvatarImage src={avatarUrl} alt={userName} />
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <div className='flex flex-col'>
                                <span className='font-medium text-sm'>{userName}</span>
                                {userEmail && (
                                  <span className='text-xs text-muted-foreground'>{userEmail}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col gap-1'>
                              <div className='flex items-center gap-2 text-sm'>
                                <Clock className='h-3 w-3 text-muted-foreground' />
                                <span className='font-medium'>{formattedDate}</span>
                              </div>
                              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                <span>{formattedTime}</span>
                                <span>•</span>
                                <span>{timeAgo}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                              <MapPin className='h-3 w-3' />
                              <span>
                                {checkIn.latitudeAtCheckIn?.toFixed(6)}, {checkIn.longitudeAtCheckIn?.toFixed(6)}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-muted-foreground'>
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, meta.totalItems)} of {meta.totalItems} check-ins
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

