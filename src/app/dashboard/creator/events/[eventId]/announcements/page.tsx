"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEventTabs } from "@/contexts/EventTabContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  Plus,
  Edit,
  Loader2,
  Calendar,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCreatorAnnouncements } from "@/hooks/announcements/useCreatorAnnouncements";
import { format } from "date-fns";
import Image from "next/image";

export default function EventAnnouncementsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { openAnnouncementTab } = useEventTabs();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const {
    data: announcementsData,
    isLoading,
    isError,
  } = useCreatorAnnouncements({
    eventId,
    page: currentPage,
    limit,
    sortBy: "createdAt:DESC",
  });

  const formatDateTime = (iso: string) => {
    return format(new Date(iso), "MMM dd, yyyy 'at' h:mm a");
  };

  const formatDate = (iso: string) => {
    return format(new Date(iso), "MMM dd, yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        <p className="font-medium">Error loading announcements</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  const announcements = announcementsData?.data || [];
  const meta = announcementsData?.meta || { totalItems: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Announcements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage announcements for your event
          </p>
        </div>
        <Button
          onClick={(e) => {
            e.preventDefault();
            openAnnouncementTab('create');
            router.push(`/dashboard/creator/events/${eventId}/announcements/new`);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Announcements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            All Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No announcements yet</p>
              <p className="text-sm mt-1">
                Create your first announcement to share updates with attendees
              </p>
              <Button
                className="mt-4"
                onClick={(e) => {
                  e.preventDefault();
                  openAnnouncementTab('create');
                  router.push(`/dashboard/creator/events/${eventId}/announcements/new`);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{announcement.title}</span>
                          <span className="text-xs text-muted-foreground font-mono mt-1">
                            {announcement.id.substring(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {announcement.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {announcement.imageUrl ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                            <Image
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No image</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm">{formatDate(announcement.startDate)}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(announcement.startDate), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm">{formatDate(announcement.endDate)}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(announcement.endDate), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={announcement.isHidden ? "secondary" : "default"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {announcement.isHidden ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Visible
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{formatDate(announcement.createdAt)}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(announcement.createdAt), "h:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            openAnnouncementTab('edit', announcement.id, announcement.title);
                            router.push(`/dashboard/creator/events/${eventId}/announcements/${announcement.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to{" "}
                    {Math.min(currentPage * limit, meta.totalItems)} of{" "}
                    {meta.totalItems} announcement{meta.totalItems !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground px-2">
                      Page {currentPage} of {meta.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(meta.totalPages, p + 1))
                      }
                      disabled={currentPage === meta.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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
