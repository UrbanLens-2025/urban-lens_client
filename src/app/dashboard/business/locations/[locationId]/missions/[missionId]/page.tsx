'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocationMissionById } from '@/hooks/missions/useLocationMissionById';
import { getMissionParticipants } from '@/api/missions';
import { useLocationTabs } from '@/contexts/LocationTabContext';
import { useGenerateOneTimeQRCode } from '@/hooks/missions/useGenerateOneTimeQRCode';

// --- Import UI Components ---
import {
  Loader2,
  CalendarDays as CalendarDaysIcon,
  Zap,
  Star,
  Users,
  Search,
  QrCode,
  Copy,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { DetailViewLayout } from '@/components/shared/DetailViewLayout';
import { format } from 'date-fns';
import ErrorCustom from '@/components/shared/ErrorCustom';
import LoadingCustom from '@/components/shared/LoadingCustom';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { IconTarget } from '@tabler/icons-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function MissionDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string; missionId: string }>;
}) {
  const { locationId, missionId } = use(params);
  const router = useRouter();
  const { openMissionDetailTab } = useLocationTabs();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  // --- QR Code State ---
  const [generatedQRCode, setGeneratedQRCode] = useState<{
    qrCodeData: string;
    qrCodeUrl: string;
    expiresAt: string;
    id: string;
    isUsed: boolean;
    missionId: string;
  } | null>(null);

  const {
    data: mission,
    isLoading,
    isError,
  } = useLocationMissionById(missionId);

  // --- QR Code Hook ---
  const { mutate: generateQRCode, isPending: isGeneratingQR } =
    useGenerateOneTimeQRCode(locationId);

  // --- Mission participants state & data ---
  const [participantsPage, setParticipantsPage] = useState(1);
  const [participantsSearch, setParticipantsSearch] = useState('');
  const participantsLimit = 20;

  const { data: participantsResponse } = useQuery({
    queryKey: [
      'missionParticipants',
      mission?.id,
      participantsPage,
      participantsSearch,
    ],
    queryFn: () =>
      getMissionParticipants({
        missionId,
        page: participantsPage,
        limit: participantsLimit,
        sortBy: ['progress:DESC'],
        search: participantsSearch || undefined,
      }),
    enabled: !!mission,
  });

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  // --- QR Code Handlers ---
  const handleGenerateQRCode = () => {
    generateQRCode(
      { missionId },
      {
        onSuccess: (data) => {
          setGeneratedQRCode({
            qrCodeData: data.qrCodeData,
            qrCodeUrl: data.qrCodeUrl,
            expiresAt: data.expiresAt,
            id: data.id,
            isUsed: data.isUsed,
            missionId: missionId,
          });
          toast.success('QR code generated successfully!');
        },
      }
    );
  };

  const handleRegenerate = () => {
    handleGenerateQRCode();
  };

  const handleCopyQRCode = () => {
    if (generatedQRCode?.qrCodeData) {
      navigator.clipboard.writeText(generatedQRCode.qrCodeData);
      toast.success('QR code data copied to clipboard!');
    }
  };

  const handleDownloadQRCode = () => {
    if (!generatedQRCode) return;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      generatedQRCode.qrCodeData
    )}`;
    const link = document.createElement('a');
    link.href = qrCodeImageUrl;
    link.download = `qr-code-${locationId}-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  const getQRCodeImageUrl = () => {
    if (!generatedQRCode) return null;
    if (generatedQRCode.qrCodeUrl) return generatedQRCode.qrCodeUrl;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      generatedQRCode.qrCodeData
    )}`;
  };

  // Update tab name
  useEffect(() => {
    if (mission && mission.title) {
      openMissionDetailTab(missionId, 'View Mission');
    }
  }, [mission, missionId, openMissionDetailTab]);

  if (isLoading) return <LoadingCustom />;
  if (isError || !mission) return <ErrorCustom />;

  const now = new Date();
  const isExpired = new Date(mission.endDate) < now;
  const isScheduled = new Date(mission.startDate) > now;
  const isActive = !isExpired && !isScheduled;

  const participants = participantsResponse?.data ?? [];
  const participantsMeta = participantsResponse?.meta;

  const mainContent = (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        {/* Mission Info Card - Compact Sidebar */}
        <Card className='lg:col-span-1'>
          <CardContent className='space-y-4 pt-6'>
            <div className='flex items-center gap-2 mb-2'>
              <IconTarget className='h-5 w-5 text-primary' />
              <p className='text-base font-semibold'>Mission Information</p>
            </div>

            {/* Images */}
            {mission.imageUrls.slice(0, 3).map((url, index) => (
              <Image
                key={index}
                src={url}
                alt={`Mission image ${index + 1}`}
                width={100}
                height={100}
                className='w-36 h-36 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity'
                onClick={() =>
                  handleImageClick(url, `Mission image ${index + 1}`)
                }
              />
            ))}
            {/* Description */}
            {mission.title && (
              <p className='text-base text-foreground font-semibold'>
                {mission.title}
              </p>
            )}
            <>
              {isActive && <Badge className='bg-green-600'>Active</Badge>}
              {isScheduled && <Badge variant='outline'>Scheduled</Badge>}
              {isExpired && <Badge variant='secondary'>Completed</Badge>}
            </>
            {/* Description */}
            {mission.description && (
              <p className='text-sm line-clamp-3 text-muted-foreground'>
                {mission.description}
              </p>
            )}

            {/* Key Stats */}
            <div className='space-y-3 pt-4 border-t border-border'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Zap className='h-4 w-4 text-primary' />
                  <span className='text-xs font-medium text-muted-foreground'>
                    Target
                  </span>
                </div>
                <span className='text-sm font-semibold text-foreground'>
                  {mission.target}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Star className='h-4 w-4 text-primary' />
                  <span className='text-xs font-medium text-muted-foreground'>
                    Reward
                  </span>
                </div>
                <span className='text-sm font-semibold text-foreground'>
                  {mission.reward} pts
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CalendarDaysIcon className='h-4 w-4 text-primary' />
                  <span className='text-xs font-medium text-muted-foreground'>
                    Start Date
                  </span>
                </div>
                <span className='text-xs text-foreground'>
                  {formatDate(mission.startDate)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CalendarDaysIcon className='h-4 w-4 text-primary' />
                  <span className='text-xs font-medium text-muted-foreground'>
                    End Date
                  </span>
                </div>
                <span className='text-xs text-foreground'>
                  {formatDate(mission.endDate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants List Card - Main Content */}
        <Card className='lg:col-span-3'>
          <CardHeader>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                <span className='text-lg font-semibold'>Scan QR History</span>
              </CardTitle>

              {/* === NÚT GENERATE QR ĐƯỢC ĐẶT Ở ĐÂY === */}
              <div className='flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end sm:items-center'>
                <Button
                  variant='default'
                  size='sm'
                  onClick={handleGenerateQRCode}
                  disabled={isGeneratingQR}
                  className='h-12 flex items-center gap-2 border-primary/20 hover:border-primary/50'
                >
                  {isGeneratingQR ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <QrCode className='h-4 w-4' />
                  )}
                  Generate QR
                </Button>

                <div className='relative w-full sm:w-auto'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search by name or email'
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
            <div className='rounded-md border'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='py-10 text-center text-sm text-muted-foreground'
                      >
                        No participants yet. Once users start this mission, they
                        will appear here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    participants.map((p: any) => {
                      const user = p.userProfile?.account;
                      return (
                        <TableRow key={p.id} className='hover:bg-muted/20'>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              {user?.avatarUrl ? (
                                <Image
                                  src={user.avatarUrl}
                                  alt={user.firstName || 'User'}
                                  width={32}
                                  height={32}
                                  className='w-8 h-8 rounded-full object-cover border'
                                />
                              ) : (
                                <div className='w-8 h-8 rounded-full bg-muted flex items-center justify-center border'>
                                  <Users className='h-4 w-4 text-muted-foreground' />
                                </div>
                              )}
                              <div className='flex flex-col'>
                                <div className='font-medium text-sm'>
                                  {user?.firstName || ''} {user?.lastName || ''}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  {user?.email || ''}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              {p.progress || 0}/{mission.target || 0}
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
                            {p.createdAt
                              ? format(new Date(p.createdAt), 'PPP p')
                              : '—'}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {p.completedAt
                              ? format(new Date(p.completedAt), 'PPP p')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {participantsMeta && participantsMeta.totalPages > 1 && (
              <div className='flex items-center justify-between mt-4'>
                <div className='text-sm text-muted-foreground'>
                  Showing{' '}
                  {(participantsMeta.currentPage - 1) * participantsLimit + 1}{' '}
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
          </CardContent>
        </Card>
      </div>
    </>
  );

  return (
    <>
      <DetailViewLayout
        title={'Mission Details'}
        badges={''}
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

      {/* QR Code Dialog */}
      <Dialog
        open={!!generatedQRCode}
        onOpenChange={(open) => !open && setGeneratedQRCode(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <QrCode className='h-5 w-5' />
              One-Time QR Code
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='relative flex justify-center p-4 bg-muted/30 rounded-lg'>
              {/* Overlay loading when regenerating */}
              {isGeneratingQR && (
                <div className='absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              )}
              {generatedQRCode && getQRCodeImageUrl() && (
                <img
                  src={getQRCodeImageUrl() || ''}
                  alt='QR Code'
                  className='w-64 h-64 object-contain'
                />
              )}
            </div>
            {generatedQRCode && (
              <>
                <div className='space-y-2'>
                  <label className='text-xs font-medium text-muted-foreground'>
                    Mission Code
                  </label>
                  <div className='flex items-center gap-2 p-2 bg-muted/30 rounded-md'>
                    <code className='flex-1 text-xs break-all'>
                      {generatedQRCode.qrCodeData}
                    </code>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={handleCopyQRCode}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <div className='space-y-2 text-xs'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Expires at:</span>
                    <span className='font-medium'>
                      {new Date(generatedQRCode.expiresAt).toLocaleString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Status:</span>
                    <Badge
                      variant={
                        generatedQRCode.isUsed ? 'destructive' : 'default'
                      }
                    >
                      {generatedQRCode.isUsed ? 'Used' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </>
            )}
            <div className='grid grid-cols-2 gap-2'>
              <Button
                variant='default'
                className='col-span-2'
                onClick={handleRegenerate}
                disabled={isGeneratingQR}
              >
                {isGeneratingQR ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='mr-2 h-4 w-4' />
                )}
                Re-generate QR
              </Button>
              <Button
                variant='outline'
                onClick={handleDownloadQRCode}
                disabled={isGeneratingQR}
              >
                <Download className='mr-2 h-4 w-4' />
                Download
              </Button>
              <Button
                variant='outline'
                onClick={handleCopyQRCode}
                disabled={isGeneratingQR}
              >
                <Copy className='mr-2 h-4 w-4' />
                Copy Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
