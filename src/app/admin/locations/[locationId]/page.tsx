'use client';

import { use, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocationByIdForAdmin } from '@/hooks/admin/useLocationByIdForAdmin';
import { ReportsPanel } from '@/components/admin/event/ReportsPanel';
import { usePenaltiesByTarget } from '@/hooks/admin/usePenaltiesByTarget';
import {
  ArrowLeft,
  Calendar,
  ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Building,
  Mail,
  Phone,
  Globe,
  Tag,
  Copy,
  ExternalLink,
  FileText,
  CheckCircle2,
  Flag,
  Gavel,
  Receipt,
  User,
  Users,
  Ruler,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleMapsPicker } from '@/components/shared/GoogleMapsPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisplayTags } from '@/components/shared/DisplayTags';
import Link from 'next/link';
import type React from 'react';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    <div className='flex gap-3'>
      {Icon && (
        <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1'>
        <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
        <div className='text-base text-foreground'>{value}</div>
      </div>
    </div>
  );
}

export default function AdminLocationDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  type LocationDetailsTab =
    | 'overview'
    | 'media'
    | 'reports'
    | 'booking-reports'
    | 'penalties';
  const coerceTab = (tab: string | null): LocationDetailsTab => {
    if (
      tab === 'overview' ||
      tab === 'media' ||
      tab === 'reports' ||
      tab === 'booking-reports' ||
      tab === 'penalties'
    ) {
      return tab;
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<LocationDetailsTab>(() =>
    coerceTab(searchParams.get('tab'))
  );

  useEffect(() => {
    setActiveTab(coerceTab(searchParams.get('tab')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (nextTab: string) => {
    const coerced = coerceTab(nextTab);
    setActiveTab(coerced);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', coerced);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  const {
    data: location,
    isLoading,
    isError,
  } = useLocationByIdForAdmin(locationId);
  console.log('🚀 ~ AdminLocationDetailsPage ~ location:', location);

  const { data: penaltiesData, isLoading: isLoadingPenalties } =
    usePenaltiesByTarget(locationId, 'location');

  if (isLoading) {
    return <LoadingCustom />;
  }

  if (isError || !location) {
    return <ErrorCustom />;
  }

  const position = {
    lat: Number(location.latitude),
    lng: Number(location.longitude),
  };

  const copyCoordinates = () => {
    const coords = `${location.latitude}, ${location.longitude}`;
    navigator.clipboard.writeText(coords);
    toast.success('Coordinates copied to clipboard');
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  // Calculate real statistics
  const imageCount = location.imageUrl?.length || 0;
  const tagCount = location.tags?.length || 0;
  const checkIns = parseInt(location.totalCheckIns || '0', 10);

  return (
    <div className='min-h-screen bg-gradient-to-b from-muted/30 to-background p-4 w-full space-y-6'>
      {/* Header with Cover Image */}
      <div className='relative'>
        {location.imageUrl && (
          <div className='relative h-64 rounded-xl overflow-hidden mb-6 shadow-lg'>
            <Image
              src={location.imageUrl[0]}
              alt='Location Cover'
              fill
              className='object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />
            <Button
              variant='secondary'
              size='icon'
              onClick={() => router.back()}
              className='absolute top-4 left-4 backdrop-blur-sm bg-white/90 hover:bg-white'
            >
              <ArrowLeft className='h-5 w-5' />
            </Button>
          </div>
        )}

        {!location.imageUrl && (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.back()}
            className='mb-4'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
        )}

        {/* Title Section */}
        <div className='flex flex-col sm:flex-row items-start gap-4 mb-6'>
          {location.imageUrl && (
            <div className='relative w-24 h-24 rounded-xl overflow-hidden border-4 border-background shadow-lg cursor-pointer flex-shrink-0'>
              <Image
                src={location.imageUrl[0]}
                alt='Event Avatar'
                fill
                className='object-cover'
              />
            </div>
          )}
          <div className='flex-1'>
            <div className='flex items-start gap-3 mb-2'>
              <h1 className='text-3xl font-bold tracking-tight flex-1'>
                {location.name}
              </h1>
            </div>
            <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <Calendar className='h-4 w-4' />
                {formatDate(location.createdAt!)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
          <CardContent>
            <div className='flex items-center gap-3'>
              <div className='p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 shadow-sm'>
                <Users className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                  Check-ins
                </p>
                <p className='text-lg font-bold text-foreground mt-1'>
                  {checkIns.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
          <CardContent>
            <div className='flex items-center gap-3'>
              <div className='p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 shadow-sm'>
                <ImageIcon className='h-5 w-5 text-purple-600 dark:text-purple-400' />
              </div>
              <div>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                  Images
                </p>
                <p className='text-lg font-bold text-foreground mt-1'>
                  {imageCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
          <CardContent>
            <div className='flex items-center gap-3'>
              <div className='p-3 rounded-lg bg-green-100 dark:bg-green-900/30 shadow-sm'>
                <Tag className='h-5 w-5 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                  Reviews
                </p>
                <p className='text-lg font-bold text-foreground mt-1'>
                  {tagCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
          <CardContent>
            <div className='flex items-center gap-3'>
              <div className='p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 shadow-sm'>
                <Ruler className='h-5 w-5 text-orange-600 dark:text-orange-400' />
              </div>
              <div>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                  Radius
                </p>
                <p className='text-lg font-bold text-foreground mt-1'>
                  {location.radiusMeters}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for layout similar to admin event/post details */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='flex flex-col gap-2 space-y-4'
      >
        <TabsList className='bg-transparent h-auto p-0 border-b border-border rounded-none flex gap-8'>
          <TabsTrigger
            value='overview'
            className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2 data-[state=active]:text-foreground after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            <FileText className='h-4 w-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value='media'
            className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2 data-[state=active]:text-foreground after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            <ImageIcon className='h-4 w-4' />
            Media
          </TabsTrigger>
          <TabsTrigger
            value='reports'
            className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2 data-[state=active]:text-foreground after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            <Flag className='h-4 w-4' />
            Location Reports
          </TabsTrigger>
          <TabsTrigger
            value='booking-reports'
            className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2 data-[state=active]:text-foreground after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            <Receipt className='h-4 w-4' />
            Booking Reports
          </TabsTrigger>
          <TabsTrigger
            value='penalties'
            className="relative bg-transparent border-none rounded-none px-0 py-3 h-auto data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors gap-2 data-[state=active]:text-foreground after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-transparent data-[state=active]:after:bg-primary"
          >
            <Gavel className='h-4 w-4' />
            Penalty History
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          {/* Content */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* LEFT COLUMN */}
            <div className='space-y-6'>
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Layers className='h-5 w-5' />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <InfoRow
                    label='Description'
                    value={location.description || 'No description provided'}
                    icon={FileText}
                  />
                  <Separator />
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <InfoRow
                      label='Total Check-ins'
                      value={checkIns.toLocaleString()}
                      icon={Users}
                    />
                    <InfoRow
                      label='Service Radius'
                      value={`${location.radiusMeters} meters`}
                    />
                    <InfoRow
                      label='Visibility'
                      value={
                        location.isVisibleOnMap ? (
                          <Badge variant='default' className='w-fit'>
                            <Eye className='h-3 w-3 mr-1' />
                            Visible on map
                          </Badge>
                        ) : (
                          <Badge variant='secondary' className='w-fit'>
                            <EyeOff className='h-3 w-3 mr-1' />
                            Hidden from map
                          </Badge>
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {location.tags && location.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Tag className='h-5 w-5' />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DisplayTags tags={location.tags} maxCount={4} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className='space-y-6'>
              {/* Business Info */}
              {location.business && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Building className='h-5 w-5' />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-start gap-4'>
                      {location.business.avatar && (
                        <Image
                          src={location.business.avatar}
                          alt={location.business.name}
                          width={64}
                          height={64}
                          className='w-16 h-16 rounded-lg object-cover'
                        />
                      )}
                      <div className='flex-1'>
                        <p className='font-semibold text-lg'>
                          {location.business.name}
                        </p>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {location.business.description}
                        </p>
                      </div>
                    </div>

                    <Separator />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                      <InfoRow
                        label='Email'
                        value={
                          <a
                            href={`mailto:${location.business.email}`}
                            className='text-primary hover:underline'
                          >
                            {location.business.email}
                          </a>
                        }
                        icon={Mail}
                      />
                      <InfoRow
                        label='Phone'
                        value={
                          <a
                            href={`tel:${location.business.phone}`}
                            className='text-primary hover:underline'
                          >
                            {location.business.phone}
                          </a>
                        }
                        icon={Phone}
                      />
                    </div>
                    {location.business.website && (
                      <>
                        <Separator />
                        <InfoRow
                          label='Website'
                          value={
                            <a
                              href={location.business.website}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary hover:underline flex items-center gap-1'
                            >
                              {location.business.website}
                              <ExternalLink className='h-3 w-3' />
                            </a>
                          }
                          icon={Globe}
                        />
                      </>
                    )}

                    {location.business.licenseNumber && (
                      <>
                        <Separator />
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                          <InfoRow
                            label='License Type'
                            value={location.business.licenseType}
                            icon={FileText}
                          />
                          <InfoRow
                            label='License Number'
                            value={location.business.licenseNumber}
                            icon={FileText}
                          />
                        </div>
                        {location.business.licenseExpirationDate && (
                          <>
                            <Separator />
                            <InfoRow
                              label='License Expiration'
                              value={formatDate(
                                location.business.licenseExpirationDate
                              )}
                              icon={Calendar}
                            />
                          </>
                        )}
                      </>
                    )}

                    <Separator />
                    <div className='pt-2'>
                      <InfoRow
                        label='Business Status'
                        value={
                          <Badge
                            variant={
                              location.business.status === 'APPROVED'
                                ? 'default'
                                : location.business.status === 'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className='w-fit'
                          >
                            {location.business.status === 'APPROVED' && (
                              <CheckCircle2 className='h-3 w-3 mr-1' />
                            )}
                            {location.business.status}
                          </Badge>
                        }
                      />
                      {location.business.accountId && (
                        <>
                          <Separator className='my-4' />
                          <Link
                            href={`/admin/business/${location.business.accountId}`}
                          >
                            <Button
                              variant='outline'
                              size='sm'
                              className='w-full sm:w-auto'
                            >
                              <Building className='h-4 w-4 mr-2' />
                              View Business Account
                              <ExternalLink className='h-3 w-3 ml-2' />
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='h-5 w-5' />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <InfoRow
                    label='Street Address'
                    value={location.addressLine}
                  />
                  <Separator />
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <InfoRow
                      label='District/Ward'
                      value={location.addressLevel1 || 'N/A'}
                    />
                    <InfoRow
                      label='Province/City'
                      value={location.addressLevel2 || 'N/A'}
                    />
                  </div>
                  <Separator />
                  <div className='pt-2'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-xs font-medium text-muted-foreground'>
                        Map Location
                      </p>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={copyCoordinates}
                          className='h-7 text-xs'
                        >
                          <Copy className='h-3 w-3 mr-1' />
                          Copy Coords
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={openInGoogleMaps}
                          className='h-7 text-xs'
                        >
                          <ExternalLink className='h-3 w-3 mr-1' />
                          Open Maps
                        </Button>
                      </div>
                    </div>
                    <div className='h-64 rounded-lg overflow-hidden border'>
                      <GoogleMapsPicker
                        position={position}
                        onPositionChange={() => {}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='media' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Map and coordinates re-used for quick access */}
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='h-5 w-5' />
                    Map & Coordinates
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='pt-2'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-xs font-medium text-muted-foreground'>
                        Map Location
                      </p>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={copyCoordinates}
                          className='h-7 text-xs'
                        >
                          <Copy className='h-3 w-3 mr-1' />
                          Copy Coords
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={openInGoogleMaps}
                          className='h-7 text-xs'
                        >
                          <ExternalLink className='h-3 w-3 mr-1' />
                          Open Maps
                        </Button>
                      </div>
                    </div>
                    <div className='h-72 rounded-lg overflow-hidden border'>
                      <GoogleMapsPicker
                        position={position}
                        onPositionChange={() => {}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Images */}
            <div className='space-y-6'>
              {location.imageUrl?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <ImageIcon className='h-5 w-5' />
                      Location Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                      {location.imageUrl.map((url: string, index: number) => (
                        <div
                          key={index}
                          className='relative aspect-video rounded-lg overflow-hidden border cursor-pointer group hover:border-primary transition-all'
                          onClick={() =>
                            handleImageClick(url, `Location Image ${index + 1}`)
                          }
                        >
                          <Image
                            src={url || '/placeholder.svg'}
                            alt={`Location image ${index + 1}`}
                            fill
                            className='object-cover group-hover:scale-105 transition-transform duration-200'
                            sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
                          />
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                            <ImageIcon className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                          </div>
                          <div className='absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'>
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value='reports'>
          <ReportsPanel targetId={locationId} targetType='location' />
        </TabsContent>

        <TabsContent value='booking-reports'>
          <ReportsPanel
            targetId={locationId}
            targetType='location'
            reportQueryTargetType='booking'
            reportQueryTargetId={null}
            denormSecondaryTargetId={locationId}
          />
        </TabsContent>

        <TabsContent value='penalties'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Gavel className='h-5 w-5' />
                Penalty History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPenalties ? (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Loading penalties...
                </div>
              ) : !penaltiesData || penaltiesData.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No penalties found for this location.
                </p>
              ) : (
                <div className='overflow-hidden rounded-lg border'>
                  <Table>
                    <TableHeader className='bg-muted/40'>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Issued By</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {penaltiesData.map((penalty) => (
                        <TableRow key={penalty.id} className='hover:bg-muted/20'>
                          <TableCell>
                            <Badge variant='outline' className='w-fit text-xs'>
                              {penalty.penaltyAction.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-sm'>
                            {penalty.reason || (
                              <span className='text-muted-foreground italic'>
                                No reason provided
                              </span>
                            )}
                          </TableCell>
                          <TableCell className='text-sm'>
                            {penalty.createdBy ? (
                              <div className='flex items-center gap-2'>
                                {penalty.createdBy.avatarUrl ? (
                                  <Avatar className='h-8 w-8'>
                                    <AvatarImage
                                      src={penalty.createdBy.avatarUrl}
                                      alt={`${penalty.createdBy.firstName} ${penalty.createdBy.lastName}`}
                                    />
                                    <AvatarFallback>
                                      {penalty.createdBy.firstName[0]}
                                      {penalty.createdBy.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20'>
                                    <User className='h-4 w-4 text-primary' />
                                  </div>
                                )}
                                <div className='min-w-0'>
                                  <div className='font-medium truncate'>
                                    {penalty.createdBy.firstName}{' '}
                                    {penalty.createdBy.lastName}
                                  </div>
                                  <div className='text-xs text-muted-foreground truncate'>
                                    {penalty.createdBy.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className='text-muted-foreground italic'>
                                Unknown
                              </span>
                            )}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {format(new Date(penalty.createdAt), 'PPpp')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Viewer */}
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}
