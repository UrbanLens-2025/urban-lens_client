"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import {
  PlusCircle,
  Megaphone,
  Trash2,
  Filter,
  Loader2,
  ArrowLeft,
  CalendarDays,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCreatorAnnouncements } from "@/hooks/announcements/useCreatorAnnouncements";
import { useDeleteCreatorAnnouncement } from "@/hooks/announcements/useDeleteCreatorAnnouncement";
import type { CreatorAnnouncement } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function EventAnnouncementsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("startDate:DESC");
  const [announcementToDelete, setAnnouncementToDelete] = useState<CreatorAnnouncement | null>(null);

  const [debouncedSearch] = useDebounce(searchTerm, 400);

  const { data, isLoading, isError, isFetching } = useCreatorAnnouncements(
    {
      page,
      limit,
      sortBy,
      search: debouncedSearch,
      eventId,
    },
    { enabled: Boolean(eventId) }
  );

  const { mutate: deleteAnnouncement, isPending: isDeleting } = useDeleteCreatorAnnouncement();

  const announcements = data?.data ?? [];
  const meta = data?.meta;

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (debouncedSearch) filters.push(`Search: "${debouncedSearch}"`);
    return filters;
  }, [debouncedSearch]);

  const renderSchedule = (announcement: CreatorAnnouncement) => (
    <div className="text-xs text-muted-foreground space-y-0.5">
      <p>
        <span className="font-medium">Starts:</span> {formatDateTime(announcement.startDate)}
      </p>
      <p>
        <span className="font-medium">Ends:</span> {formatDateTime(announcement.endDate)}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Button variant="outline" size="icon" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span>
            <Link href="/dashboard/creator/events" className="text-muted-foreground hover:underline">
              Events
            </Link>
            <span className="px-1">/</span>
            <span className="text-foreground">Announcements</span>
          </span>
        </div>
        <Button asChild>
          <Link href={`/dashboard/creator/events/${eventId}/announcements/new`}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create announcement
          </Link>
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Announcements</CardTitle>
              <CardDescription>
                Manage announcements for this event.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                className="md:w-64"
              />
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="startDate:DESC">Start date (newest)</SelectItem>
                  <SelectItem value="startDate:ASC">Start date (oldest)</SelectItem>
                  <SelectItem value="createdAt:DESC">Created (newest)</SelectItem>
                  <SelectItem value="createdAt:ASC">Created (oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Filter className="h-3 w-3" /> Filters:
              </span>
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="outline" className="border-border bg-muted/40 text-muted-foreground">
                  {filter}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-destructive">
              Failed to load announcements. Please try again shortly.
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground/70" />
              <div>
                <p className="text-base font-semibold">No announcements yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first announcement to keep attendees informed.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Announcement</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-semibold text-sm leading-tight">
                            {announcement.title}
                          </span>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {announcement.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{renderSchedule(announcement)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border bg-muted/40 text-muted-foreground">
                          {announcement.isHidden ? "Hidden" : "Visible"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <p>Created {formatDateTime(announcement.createdAt)}</p>
                          <p>Updated {formatDateTime(announcement.updatedAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" asChild>
                            <Link
                              href={`/dashboard/creator/events/${eventId}/announcements/${announcement.id}/edit`}
                            >
                              Manage
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setAnnouncementToDelete(announcement)}
                            disabled={isDeleting && announcementToDelete?.id === announcement.id}
                          >
                            {isDeleting && announcementToDelete?.id === announcement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                              </>
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

        <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 text-sm text-muted-foreground">
          <div>
            {meta ? (
              <span>
                Showing page {meta.currentPage} of {meta.totalPages} ({meta.totalItems} total)
              </span>
            ) : (
              <span>No data</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!meta || meta.currentPage <= 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => (meta ? Math.min(meta.totalPages, prev + 1) : prev + 1))}
              disabled={!meta || meta.currentPage >= meta.totalPages || isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The announcement
              {announcementToDelete && ` "${announcementToDelete.title}"`} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!announcementToDelete) return;
                deleteAnnouncement(announcementToDelete.id);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
