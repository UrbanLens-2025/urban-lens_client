"use client";

import type React from "react";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocationMissionById } from "@/hooks/missions/useLocationMissionById";
import { getMissionParticipants } from "@/api/missions";
import { useLocationTabs } from "@/contexts/LocationTabContext";

// --- Import UI Components ---
import {
  Loader2,
  CalendarDays as CalendarDaysIcon,
  Layers,
  Zap,
  Star,
  ImageIcon,
  Users,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { DetailViewLayout } from "@/components/shared/DetailViewLayout";
import { format } from "date-fns";

// --- Component con: InfoRow ---
function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <div className='flex gap-3 mb-4'>
      {Icon && (
        <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1'>
        <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
        <div className='text-base text-foreground break-words'>{value}</div>
      </div>
    </div>
  );
}

// --- Component Trang Chính ---
export default function MissionDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string; missionId: string }>;
}) {
  const { locationId, missionId } = use(params);
  const router = useRouter();
  const { openMissionDetailTab } = useLocationTabs();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [currentImageAlt, setCurrentImageAlt] = useState("");

  const {
    data: mission,
    isLoading,
    isError,
  } = useLocationMissionById(missionId);

  // --- Mission participants state & data ---
  const [participantsPage, setParticipantsPage] = useState(1);
  const [participantsSearch, setParticipantsSearch] = useState("");
  const participantsLimit = 20;

  const {
    data: participantsResponse,
    isLoading: isLoadingParticipants,
  } = useQuery({
    queryKey: [
      "missionParticipants",
      mission?.id,
      participantsPage,
      participantsSearch,
    ],
    queryFn: () =>
      getMissionParticipants({
        missionId,
        page: participantsPage,
        limit: participantsLimit,
        sortBy: ["progress:DESC"],
        search: participantsSearch || undefined,
      }),
    enabled: !!mission,
  });

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  // Update tab name when mission data loads
  useEffect(() => {
    if (mission && mission.title) {
      openMissionDetailTab(missionId, 'View Mission');
    }
  }, [mission, missionId, openMissionDetailTab]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !mission) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
        <p>We couldn&apos;t load this mission. It may have been removed.</p>
      </div>
    );
  }

  const now = new Date();
  const isExpired = new Date(mission.endDate) < now;
  const isScheduled = new Date(mission.startDate) > now;
  const isActive = !isExpired && !isScheduled;

  const badges = (
    <>
      {isActive && <Badge className='bg-green-600'>Active</Badge>}
      {isScheduled && <Badge variant='outline'>Scheduled</Badge>}
      {isExpired && <Badge variant='secondary'>Completed</Badge>}
    </>
  );

  const participants = participantsResponse?.data ?? [];
  const participantsMeta = participantsResponse?.meta;

  const mainContent = (
    <>
      {/* Mission Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Layers /> Mission Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* Col 1: Mission Details */}
            <section className='space-y-4 md:col-span-1'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <Layers className='h-5 w-5' />
                <span>Mission Details</span>
              </h3>
              <InfoRow label='Description' value={mission.description} />
              <InfoRow label='Target' value={mission.target} icon={Zap} />
              <InfoRow
                label='Reward'
                value={`${mission.reward} points`}
                icon={Star}
              />
            </section>

            {/* Col 2: Duration */}
            <section className='space-y-4 md:col-span-1'>
              <h3 className='flex items-center gap-2 text-lg font-semibold'>
                <CalendarDaysIcon className='h-5 w-5' />
                <span>Duration</span>
              </h3>
              <div className='space-y-4'>
                <InfoRow
                  label='Start Date'
                  value={format(new Date(mission.startDate), 'PPP p')}
                />
                <InfoRow
                  label='End Date'
                  value={format(new Date(mission.endDate), 'PPP p')}
                />
              </div>
            </section>

            {/* Col 3: Mission Images */}
            {mission.imageUrls && mission.imageUrls.length > 0 && (
              <section className='space-y-4 md:col-span-1'>
                <h3 className='flex items-center gap-2 text-lg font-semibold'>
                  <ImageIcon className='h-5 w-5' />
                  <span>Mission Images</span>
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {mission.imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Mission image ${index + 1}`}
                      className='w-40 h-40 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity'
                      onClick={() =>
                        handleImageClick(url, `Mission image ${index + 1}`)
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants List Card (UI only for now) */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              <span>Mission Participants</span>
            </CardTitle>

            <div className='w-full md:w-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by name, email, or phone'
                  className='pl-9 w-full md:w-[280px]'
                  value={participantsSearch}
                  onChange={(e) => {
                    setParticipantsSearch(e.target.value);
                    setParticipantsPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-lg border border-border/60'>
            {isLoadingParticipants ? (
              <div className='flex items-center justify-center py-10 text-muted-foreground gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='text-sm'>Loading participants...</span>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className='bg-muted/40'>
                    <TableRow>
                      <TableHead>Participant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Started At</TableHead>
                      <TableHead>Completed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='py-10 text-center text-sm text-muted-foreground'
                        >
                          No participants yet. Once users start this mission,
                          they will appear here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      participants.map((p: any) => (
                        <TableRow key={p.id} className='hover:bg-muted/20'>
                          <TableCell>
                            <div className='space-y-1'>
                              <div className='font-medium'>
                                {p.user?.fullName ||
                                  `${p.user?.firstName || ''} ${
                                    p.user?.lastName || ''
                                  }`.trim() ||
                                  'Unknown User'}
                              </div>
                              {p.user?.email && (
                                <div className='text-xs text-muted-foreground'>
                                  {p.user.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              {p.user?.phoneNumber || (
                                <span className='text-muted-foreground'>—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              {typeof p.progress === 'number'
                                ? `${p.progress}%`
                                : '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={p.completed ? 'default' : 'outline'}
                              className='text-xs'
                            >
                              {p.completed ? 'Completed' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {p.startedAt
                              ? format(new Date(p.startedAt), 'PPP p')
                              : '—'}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {p.completedAt
                              ? format(new Date(p.completedAt), 'PPP p')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {participantsMeta && participantsMeta.totalPages > 1 && (
                  <div className='flex items-center justify-between mt-6 px-4 py-4 border-t bg-background/40'>
                    <div className='text-sm text-muted-foreground'>
                      Showing{' '}
                      {(participantsMeta.currentPage - 1) * participantsLimit +
                        1}{' '}
                      to{' '}
                      {Math.min(
                        participantsMeta.currentPage * participantsLimit,
                        participantsMeta.totalItems
                      )}{' '}
                      of {participantsMeta.totalItems} participants
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setParticipantsPage((p) => Math.max(1, p - 1))
                        }
                        disabled={participantsMeta.currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className='text-sm text-muted-foreground px-2'>
                        Page {participantsMeta.currentPage} of{' '}
                        {participantsMeta.totalPages}
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setParticipantsPage((p) =>
                            Math.min(participantsMeta.totalPages, p + 1)
                          )
                        }
                        disabled={
                          participantsMeta.currentPage ===
                          participantsMeta.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <>
      <DetailViewLayout
        title={mission.title}
        badges={badges}
        onClose={() => {
          router.push(`/dashboard/business/locations/${locationId}/missions`);
        }}
        onEdit={() => {
          router.push(
            `/dashboard/business/locations/${locationId}/missions/${missionId}/edit`
          );
        }}
        editLabel='Edit Mission'
        mainContent={mainContent}
        location={mission.location}
        onImageClick={(src) => handleImageClick(src, 'Mission image')}
      />
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </>
  );
}
