'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocationMissions } from '@/hooks/missions/useLocationMissions';
import { LocationMission, SortState } from '@/types';
import { format } from 'date-fns';

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
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Target,
  Trophy,
  CalendarDays,
  Sparkles,
  QrCode,
  Copy,
  Download,
  Rocket,
} from 'lucide-react';
import Image from 'next/image';
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
import { Badge } from '@/components/ui/badge';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { useDeleteLocationMission } from '@/hooks/missions/useDeleteLocationMission';
import { useGenerateOneTimeQRCode } from '@/hooks/missions/useGenerateOneTimeQRCode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

function MissionActions({
  mission,
  onDeleteClick,
  onGenerateQRCode,
  isGeneratingQR,
}: {
  mission: LocationMission;
  onDeleteClick: () => void;
  onGenerateQRCode: () => void;
  isGeneratingQR: boolean;
}) {
  return (
    <div className='flex items-center justify-end gap-2'>
      <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
        <Link
          href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}/edit`}
          title='Edit'
        >
          <Edit className='h-4 w-4' />
        </Link>
      </Button>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={onGenerateQRCode}
        disabled={isGeneratingQR}
        title='Generate QR Code'
      >
        {isGeneratingQR ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <QrCode className='h-4 w-4' />
        )}
      </Button>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50'
        onClick={onDeleteClick}
        title='Delete'
      >
        <Trash2 className='h-4 w-4' />
      </Button>
    </div>
  );
}

export default function ManageMissionsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: 'createdAt',
    direction: 'DESC',
  });

  const [missionToDelete, setMissionToDelete] =
    useState<LocationMission | null>(null);
  const [generatedQRCode, setGeneratedQRCode] = useState<{
    qrCodeData: string;
    qrCodeUrl: string;
    expiresAt: string;
    id: string;
    isUsed: boolean;
  } | null>(null);

  const {
    data: response,
    isLoading,
    isError,
  } = useLocationMissions({
    locationId,
    page,
    sortBy: `${sort.column}:${sort.direction}`,
    search: debouncedSearchTerm,
  });

  const { mutate: deleteMission, isPending: isDeleting } =
    useDeleteLocationMission(locationId);
  const { mutate: generateQRCode, isPending: isGeneratingQR } =
    useGenerateOneTimeQRCode(locationId);

  const missions = response?.data || [];
  const meta = response?.meta;

  const getStatusBadge = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > now) {
      return (
        <Badge
          variant='outline'
          className='border-amber-200 bg-amber-50 text-amber-700'
        >
          Scheduled
        </Badge>
      );
    }

    if (end < now) {
      return (
        <Badge variant='secondary' className='bg-muted text-muted-foreground'>
          Completed
        </Badge>
      );
    }

    return <Badge className='bg-emerald-500/90 text-white'>Active</Badge>;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, 'MMM d, yyyy')} → ${format(end, 'MMM d, yyyy')}`;
    } catch {
      return `${startDate} → ${endDate}`;
    }
  };

  const missionMetricLabel = (metric: string | null | undefined) => {
    if (!metric) return 'Metric';
    return metric
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const missionStats = useMemo(() => {
    if (!missions.length) {
      return {
        total: 0,
        active: 0,
        scheduled: 0,
        completed: 0,
        totalReward: 0,
      };
    }

    const now = new Date();
    let active = 0;
    let scheduled = 0;
    let completed = 0;
    const totalReward = missions.reduce(
      (sum, mission) => sum + (mission.reward ?? 0),
      0
    );

    missions.forEach((mission) => {
      const start = new Date(mission.startDate);
      const end = new Date(mission.endDate);
      if (start > now) scheduled += 1;
      else if (end < now) completed += 1;
      else active += 1;
    });

    return {
      total: meta?.totalItems ?? missions.length,
      active,
      scheduled,
      completed,
      totalReward,
    };
  }, [missions, meta]);

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === 'DESC'
          ? 'ASC'
          : 'DESC',
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === 'ASC' ? (
      <ArrowUp className='ml-2 h-4 w-4' />
    ) : (
      <ArrowDown className='ml-2 h-4 w-4' />
    );
  };

  const onConfirmDelete = () => {
    if (!missionToDelete) return;
    deleteMission(missionToDelete.id, {
      onSuccess: () => {
        setMissionToDelete(null);
      },
    });
  };

  const handleGenerateQRCode = (missionId: string) => {
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
          });
          toast.success('QR code generated successfully!');
        },
      }
    );
  };

  const handleCopyQRCode = () => {
    if (generatedQRCode?.qrCodeData) {
      navigator.clipboard.writeText(generatedQRCode.qrCodeData);
      toast.success('QR code data copied to clipboard!');
    }
  };

  const handleDownloadQRCode = () => {
    if (!generatedQRCode) return;

    // Generate QR code image from data using a QR code API service
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

    // If qrCodeUrl is provided, use it; otherwise generate from qrCodeData
    if (generatedQRCode.qrCodeUrl) {
      return generatedQRCode.qrCodeUrl;
    }

    // Generate QR code image from data using a QR code API service
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      generatedQRCode.qrCodeData
    )}`;
  };

  return (
    <div className='space-y-8'>
      {/* --- Header --- */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex-1'></div>
        <Button asChild>
          <Link
            href={`/dashboard/business/locations/${locationId}/missions/create`}
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Create mission
          </Link>
        </Button>
      </div>

      {/* --- Missions Table --- */}
      <Card className='border-border/60 shadow-sm'>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle className='text-xl font-semibold'>
                Missions ({meta?.totalItems || 0})
              </CardTitle>
              <CardDescription>
                Showing page {meta?.currentPage} of {meta?.totalPages}.
              </CardDescription>
            </div>
            <div className='w-full md:w-72'>
              <Input
                placeholder='Search missions by title...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !response ? (
            <div className='flex justify-center items-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : isError ? (
            <div className='text-center text-red-500 py-12'>
              Failed to load missions.
            </div>
          ) : (
            <div className='overflow-hidden rounded-lg border border-border/60'>
              <Table>
                <TableHeader className='bg-muted/40'>
                  <TableRow>
                    <TableHead className='w-16'>#</TableHead>
                    <TableHead className='min-w-[220px]'>
                      <Button
                        variant='ghost'
                        className='px-0'
                        onClick={() => handleSort('title')}
                      >
                        Title <SortIcon column='title' />
                      </Button>
                    </TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        className='px-0'
                        onClick={() => handleSort('target')}
                      >
                        Target <SortIcon column='target' />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        className='px-0'
                        onClick={() => handleSort('reward')}
                      >
                        Reward <SortIcon column='reward' />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missions.length > 0 ? (
                    missions.map((mission, index) => {
                      const orderNumber =
                        (meta?.currentPage ? meta.currentPage - 1 : 0) *
                          (meta?.itemsPerPage || 10) +
                        index +
                        1;
                      return (
                        <TableRow
                          key={mission.id}
                          className='hover:bg-muted/20'
                        >
                          <TableCell className='text-muted-foreground font-medium'>
                            {orderNumber}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-start gap-3 min-w-[300px] max-w-[500px]'>
                              {mission.imageUrls &&
                              mission.imageUrls.length > 0 ? (
                                <div className='relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden border border-border'>
                                  <Image
                                    src={mission.imageUrls[0]}
                                    alt={mission.title}
                                    fill
                                    className='object-cover'
                                    sizes='48px'
                                  />
                                </div>
                              ) : (
                                <div className='h-12 w-12 flex-shrink-0 rounded-md bg-muted border border-border flex items-center justify-center'>
                                  <Rocket className='h-5 w-5 text-muted-foreground' />
                                </div>
                              )}
                              <div className='space-y-2 flex-1 min-w-0'>
                                <div className='flex items-start gap-2'>
                                  <Link
                                    href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}`}
                                    className='font-semibold text-sm leading-tight hover:text-primary transition-colors cursor-pointer'
                                  >
                                    {mission.title}
                                  </Link>
                                  <Badge
                                    variant='outline'
                                    className='text-[10px] shrink-0'
                                  >
                                    {mission.metric}
                                  </Badge>
                                </div>
                                {mission.description && (
                                  <p className='text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                                    {mission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='text-xs text-muted-foreground'>
                            <div className='flex items-center gap-2'>
                              <CalendarDays className='h-3 w-3 text-muted-foreground' />
                              <span>
                                {format(
                                  new Date(mission.startDate),
                                  'MMM d, yyyy'
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='text-xs text-muted-foreground'>
                            <div className='flex items-center gap-2'>
                              <CalendarDays className='h-3 w-3 text-muted-foreground' />
                              <span>
                                {format(
                                  new Date(mission.endDate),
                                  'MMM d, yyyy'
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='font-medium'>
                            {mission.target}
                          </TableCell>
                          <TableCell className='font-medium'>
                            {mission.reward} pts
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(mission.startDate, mission.endDate)}
                          </TableCell>
                          <TableCell className='text-right'>
                            <MissionActions
                              mission={mission}
                              onDeleteClick={() => setMissionToDelete(mission)}
                              onGenerateQRCode={() =>
                                handleGenerateQRCode(mission.id)
                              }
                              isGeneratingQR={isGeneratingQR}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className='h-32'>
                        <div className='flex flex-col items-center justify-center gap-2 py-6 text-center'>
                          <div className='text-base font-semibold'>
                            No missions yet
                          </div>
                          <p className='text-sm text-muted-foreground max-w-sm'>
                            Launch a mission to engage creators with challenges
                            and rewards for this location.
                          </p>
                          <Button asChild size='sm'>
                            <Link
                              href={`/dashboard/business/locations/${locationId}/missions/create`}
                            >
                              <PlusCircle className='mr-2 h-4 w-4' />
                              Create your first mission
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='flex items-center justify-end space-x-2 py-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setPage(page - 1)}
          disabled={!meta || meta.currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setPage(page + 1)}
          disabled={!meta || meta.currentPage >= meta.totalPages}
        >
          Next
        </Button>
      </div>

      <AlertDialog
        open={!!missionToDelete}
        onOpenChange={() => setMissionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this mission?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mission:
              <strong className='ml-1'>
                &quot;{missionToDelete?.title}&quot;
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Yes, Delete Mission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Display Dialog */}
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
            <div className='flex justify-center p-4 bg-muted/30 rounded-lg'>
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
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={handleDownloadQRCode}
              >
                <Download className='mr-2 h-4 w-4' />
                Download
              </Button>
              <Button
                variant='outline'
                className='flex-1'
                onClick={handleCopyQRCode}
              >
                <Copy className='mr-2 h-4 w-4' />
                Copy Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
