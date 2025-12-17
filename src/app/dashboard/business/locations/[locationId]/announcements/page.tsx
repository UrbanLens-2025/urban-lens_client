'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import {
  PlusCircle,
  Megaphone,
  Trash2,
  Filter,
  Loader2,
  Building2,
  CalendarDays,
  Edit,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { useDeleteAnnouncement } from '@/hooks/announcements/useDeleteAnnouncement';
import { useLocationById } from '@/hooks/locations/useLocationById';
import { useLocationTabs } from '@/contexts/LocationTabContext';
import { useRouter } from 'next/navigation';
import type { Announcement } from '@/types';
import { formatDateTime, formatShortDate } from '@/lib/utils';

export default function LocationAnnouncementsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const { openAnnouncementDetailTab } = useLocationTabs();
  const {
    data: location,
    isLoading: isLoadingLocation,
    isError: isLocationError,
  } = useLocationById(locationId);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('startDate:DESC');
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);

  const [debouncedSearch] = useDebounce(searchTerm, 400);

  const { data, isLoading, isError, isFetching } = useAnnouncements(
    {
      page,
      limit,
      sortBy,
      search: debouncedSearch,
      locationId,
    },
    { enabled: Boolean(locationId) }
  );

  const { mutate: deleteAnnouncement, isPending: isDeleting } =
    useDeleteAnnouncement();

  const announcements = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = () => {
    if (!announcementToDelete) return;
    deleteAnnouncement(announcementToDelete.id, {
      onSuccess: () => setAnnouncementToDelete(null),
    });
  };

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (debouncedSearch) filters.push(`Search: "${debouncedSearch}"`);
    return filters;
  }, [debouncedSearch]);

  if (isLocationError) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-muted-foreground'>
        <p>
          We couldn&apos;t load this location. Please return to your locations
          list.
        </p>
        <Button asChild>
          <Link href='/dashboard/business/locations'>Back to locations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-end'>
        <Button asChild disabled={isLoadingLocation}>
          <Link
            href={`/dashboard/business/locations/${locationId}/announcements/new`}
          >
            <PlusCircle className='mr-2 h-4 w-4' /> Create announcement
          </Link>
        </Button>
      </div>

      <Card className='border-border/60 shadow-sm'>
        <CardHeader className='space-y-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle className='text-xl font-semibold'>
                Announcements
              </CardTitle>
              <CardDescription>
                Manage announcements for {location?.name ?? 'this location'}.
              </CardDescription>
            </div>
            <div className='flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center'>
              <Input
                placeholder='Search announcements...'
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className='md:w-64'
              />
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='md:w-48'>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='startDate:DESC'>
                    Start date (newest)
                  </SelectItem>
                  <SelectItem value='startDate:ASC'>
                    Start date (oldest)
                  </SelectItem>
                  <SelectItem value='createdAt:DESC'>
                    Created (newest)
                  </SelectItem>
                  <SelectItem value='createdAt:ASC'>
                    Created (oldest)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className='flex flex-wrap items-center gap-2 text-xs'>
              <span className='flex items-center gap-1 text-muted-foreground'>
                <Filter className='h-3 w-3' /> Filters:
              </span>
              {activeFilters.map((filter) => (
                <Badge
                  key={filter}
                  variant='outline'
                  className='border-border bg-muted/40 text-muted-foreground'
                >
                  {filter}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingLocation ? (
            <div className='flex items-center justify-center py-16 text-muted-foreground'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : isLoading ? (
            <div className='flex items-center justify-center py-16 text-muted-foreground'>
              <Loader2 className='h-6 w-6 animate-spin' />
            </div>
          ) : isError ? (
            <div className='py-12 text-center text-sm text-destructive'>
              Failed to load announcements. Please try again shortly.
            </div>
          ) : announcements.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
              <Megaphone className='h-10 w-10 text-muted-foreground/70' />
              <div>
                <p className='text-base font-semibold'>No announcements yet</p>
                <p className='text-sm text-muted-foreground mt-1'>
                  Create your first announcement to keep visitors informed.
                </p>
              </div>
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-border/60'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead>Announcement</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow
                      key={announcement.id}
                      className='hover:bg-muted/20'
                    >
                      <TableCell>
                        <div
                          className='flex items-start gap-3 max-w-96 hover:opacity-80 transition-opacity group cursor-pointer'
                          onClick={() => {
                            openAnnouncementDetailTab(
                              announcement.id,
                              announcement.title
                            );
                            router.push(
                              `/dashboard/business/locations/${locationId}/announcements/${announcement.id}`
                            );
                          }}
                        >
                          {announcement.imageUrl ? (
                            <img
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              className='h-14 w-20 rounded-md border object-cover group-hover:ring-2 group-hover:ring-primary/20 transition-all'
                            />
                          ) : (
                            <div className='flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground group-hover:border-primary/40 transition-colors'>
                              No image
                            </div>
                          )}
                          <div className='flex-1 min-w-0 max-w-full'>
                            <div className='flex items-center gap-2 flex-1'>
                              <span className='font-semibold text-sm leading-tight group-hover:text-primary transition-colors'>
                                {announcement.title}
                              </span>
                            </div>
                            <p className='text-xs text-muted-foreground line-clamp-2 mt-1'>
                              {announcement.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground'>
                        <div className='flex items-center gap-2'>
                          <CalendarDays className='h-3 w-3 text-muted-foreground' />
                          <span>
                            {announcement.startDate
                              ? formatShortDate(announcement.startDate)
                              : '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground'>
                        <div className='flex items-center gap-2'>
                          <CalendarDays className='h-3 w-3 text-muted-foreground' />
                          <span>
                            {announcement.endDate
                              ? formatShortDate(announcement.endDate)
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
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            asChild
                          >
                            <Link
                              href={`/dashboard/business/locations/${locationId}/announcements/${announcement.id}/edit`}
                              title='Edit'
                            >
                              <Edit className='h-4 w-4' />
                            </Link>
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                            onClick={() =>
                              setAnnouncementToDelete(announcement)
                            }
                            disabled={
                              isDeleting &&
                              announcementToDelete?.id === announcement.id
                            }
                            title='Delete'
                          >
                            {isDeleting &&
                            announcementToDelete?.id === announcement.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <Trash2 className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        <div className='flex items-center justify-between border-t border-border/60 px-6 py-4 text-sm text-muted-foreground'>
          <div>
            {meta ? (
              <span>
                Showing page {meta.currentPage} of {meta.totalPages} (
                {meta.totalItems} total)
              </span>
            ) : (
              <span>No data</span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!meta || meta.currentPage <= 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setPage((prev) =>
                  meta ? Math.min(meta.totalPages, prev + 1) : prev + 1
                )
              }
              disabled={
                !meta || meta.currentPage >= meta.totalPages || isFetching
              }
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog
        open={!!announcementToDelete}
        onOpenChange={(open) => !open && setAnnouncementToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement
              {announcementToDelete && ` "${announcementToDelete.title}"`} will
              be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='mr-2 h-4 w-4' />
              )}
              Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
