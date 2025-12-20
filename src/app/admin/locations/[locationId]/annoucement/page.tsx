'use client';

import { Loader2, CalendarDays, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAnnouncementsByLocationId } from '@/hooks/admin/useDashboardAdmin';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import type { Announcement } from '@/types';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';

interface AnnouncementsTabPageProps {
  locationId: string;
}

export default function AnnouncementsTabPage({
  locationId,
}: AnnouncementsTabPageProps) {
  const {
    data: announcements,
    isLoading,
    isError,
  } = useAnnouncementsByLocationId(locationId);
  if (isLoading) {
    return <LoadingCustom />;
  }

  if (isError) {
    return <ErrorCustom />;
  }

  const announcementsList = announcements?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Megaphone className='h-5 w-5' />
          Announcements ({announcements?.meta?.totalItems || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcementsList.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Megaphone className='h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-base font-semibold'>No announcements yet</p>
            <p className='text-sm text-muted-foreground mt-1'>
              This location has no announcements yet.
            </p>
          </div>
        ) : (
          <div className='overflow-hidden rounded-lg border border-border/60'>
            <Table>
              <TableHeader className='bg-muted/40'>
                <TableRow>
                  <TableHead>Announcement</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcementsList.map((announcement: Announcement) => (
                  <TableRow key={announcement.id} className='hover:bg-muted/20'>
                    <TableCell>
                      <div className='flex items-start gap-3 max-w-96'>
                        {announcement.imageUrl ? (
                          <div className='relative h-14 w-20 rounded-md overflow-hidden border flex-shrink-0'>
                            <Image
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              fill
                              className='object-cover'
                            />
                          </div>
                        ) : (
                          <div className='flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground'>
                            No image
                          </div>
                        )}
                        <div className='flex-1 min-w-0 max-w-full'>
                          <div className='flex items-center gap-2 flex-1'>
                            <span className='font-semibold text-sm leading-tight'>
                              {announcement.title}
                            </span>
                          </div>
                          <p className='text-xs text-muted-foreground line-clamp-2 mt-1'>
                            {announcement.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <CalendarDays className='h-3 w-3 text-muted-foreground' />
                        <span>
                          {announcement.startDate
                            ? formatDate(announcement.startDate)
                            : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      <div className='flex items-center gap-2'>
                        <CalendarDays className='h-3 w-3 text-muted-foreground' />
                        <span>
                          {announcement.endDate
                            ? formatDate(announcement.endDate)
                            : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className='border-border bg-muted/40 text-muted-foreground'
                      >
                        {announcement.isHidden ? 'Hidden' : 'Visible'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {announcement.createdAt
                        ? formatDate(announcement.createdAt)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
