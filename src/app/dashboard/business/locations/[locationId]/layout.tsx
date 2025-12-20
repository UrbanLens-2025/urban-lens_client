'use client';

import type React from 'react';
import { use, useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import { useLocationById } from '@/hooks/locations/useLocationById';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageViewer } from '@/components/shared/ImageViewer';
import {
  LocationTabProvider,
  useLocationTabs,
} from '@/contexts/LocationTabContext';
import {
  Loader2,
  ArrowLeft,
  ImageIcon,
  Layers,
  Edit,
  Ticket,
  Rocket,
  CalendarDays,
  MapPin,
  Eye,
  EyeOff,
  FilePenLine,
  Megaphone,
  TicketPercent,
  X,
  Users,
  Ruler,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  MapPin as MapPinIcon,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useUpdateLocation } from '@/hooks/locations/useUpdateLocation';
import Image from 'next/image';

function LocationDetailLayoutContent({
  locationId,
  children,
}: {
  locationId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const {
    voucherCreateTab,
    openVoucherCreateTab,
    closeVoucherCreateTab,
    voucherEditTab,
    openVoucherEditTab,
    closeVoucherEditTab,
    voucherDetailTab,
    openVoucherDetailTab,
    closeVoucherDetailTab,
    missionCreateTab,
    openMissionCreateTab,
    closeMissionCreateTab,
    missionEditTab,
    openMissionEditTab,
    closeMissionEditTab,
    missionDetailTab,
    openMissionDetailTab,
    closeMissionDetailTab,
    announcementCreateTab,
    openAnnouncementCreateTab,
    closeAnnouncementCreateTab,
    announcementEditTab,
    openAnnouncementEditTab,
    closeAnnouncementEditTab,
    announcementDetailTab,
    openAnnouncementDetailTab,
    closeAnnouncementDetailTab,
  } = useLocationTabs();

  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<boolean | null>(null);

  const { mutate: updateLocationApi, isPending: isUpdating } = useUpdateLocation();

  // Hàm xử lý khi nhấn vào item trong dropdown (Mở modal)
  const handleVisibilityClick = (targetState: boolean) => {
    setPendingVisibility(targetState);
    setVisibilityDialogOpen(true);
  };

  // Hàm xử lý khi nhấn nút Confirm trong Modal (Gọi API)
  const confirmVisibilityChange = () => {
    if (pendingVisibility !== null) {
      updateLocationApi(
        {
          locationId,
          payload: { isVisibleOnMap: pendingVisibility } as any, // Cast as any hoặc Partial<UpdateLocationPayload> nếu type chưa khớp
        },
        {
          onSuccess: () => {
            // Hook đã xử lý toast và invalidate query rồi
            // Chúng ta chỉ cần đóng modal tại đây
            setVisibilityDialogOpen(false);
            setPendingVisibility(null);
          },
          onError: () => {
            // Nếu lỗi thì cũng nên đóng modal hoặc để user thử lại
            setVisibilityDialogOpen(false);
          }
        }
      );
    }
  };

  const [preventAutoOpenVoucherId, setPreventAutoOpenVoucherId] = useState<
    string | null
  >(null);
  const [preventAutoOpenMissionId, setPreventAutoOpenMissionId] = useState<
    string | null
  >(null);
  const [preventAutoOpenAnnouncementId, setPreventAutoOpenAnnouncementId] =
    useState<string | null>(null);

  // Use refs to track if we've already opened edit tabs to prevent infinite loops
  const voucherEditTabOpenedRef = useRef(false);
  const missionEditTabOpenedRef = useRef(false);
  const announcementEditTabOpenedRef = useRef(false);

  // Use refs to track if we've already opened detail tabs to prevent infinite loops
  const voucherDetailTabOpenedRef = useRef(false);
  const missionDetailTabOpenedRef = useRef(false);
  const announcementDetailTabOpenedRef = useRef(false);

  // Use refs to track if we've already opened create tabs to prevent infinite loops
  const voucherCreateTabOpenedRef = useRef(false);
  const missionCreateTabOpenedRef = useRef(false);
  const announcementCreateTabOpenedRef = useRef(false);

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: location, isLoading, isError } = useLocationById(locationId);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatCompactDateTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  const isActiveTab = (path: string) => {
    // Check if voucher detail tab is open and active (but not on edit route)
    if (path === 'voucher-detail' && voucherDetailTab.isOpen) {
      return (
        pathname.includes('/vouchers/') &&
        !pathname.includes('/edit') &&
        pathname !== `/dashboard/business/locations/${locationId}/vouchers`
      );
    }

    // Check if voucher create tab is open and active
    if (path === 'voucher-create' && voucherCreateTab.isOpen) {
      return pathname.includes('/vouchers/create');
    }

    // Check if voucher edit tab is open and active
    if (path === 'voucher-edit' && voucherEditTab.isOpen) {
      return pathname.includes('/vouchers/') && pathname.includes('/edit');
    }

    // Check if mission detail tab is open and active (but not on edit route)
    if (path === 'mission-detail' && missionDetailTab.isOpen) {
      return (
        pathname.includes('/missions/') &&
        !pathname.includes('/edit') &&
        pathname !== `/dashboard/business/locations/${locationId}/missions`
      );
    }

    // Check if mission create tab is open and active
    if (path === 'mission-create' && missionCreateTab.isOpen) {
      return pathname.includes('/missions/create');
    }

    // Check if mission edit tab is open and active
    if (path === 'mission-edit' && missionEditTab.isOpen) {
      return pathname.includes('/missions/') && pathname.includes('/edit');
    }

    // Check if announcement detail tab is open and active (but not on edit route)
    if (path === 'announcement-detail' && announcementDetailTab.isOpen) {
      return (
        pathname.includes('/announcements/') &&
        !pathname.includes('/edit') &&
        pathname !== `/dashboard/business/locations/${locationId}/announcements`
      );
    }

    // Check if announcement create tab is open and active
    if (path === 'announcement-create' && announcementCreateTab.isOpen) {
      return pathname.includes('/announcements/new');
    }

    // Check if announcement edit tab is open and active
    if (path === 'announcement-edit' && announcementEditTab.isOpen) {
      return pathname.includes('/announcements/') && pathname.includes('/edit');
    }

    if (path === `/dashboard/business/locations/${locationId}`) {
      return pathname === path;
    }

    return (
      pathname.startsWith(path) &&
      !(
        pathname.includes('/vouchers/') &&
        pathname !== `/dashboard/business/locations/${locationId}/vouchers`
      ) &&
      !(
        pathname.includes('/missions/') &&
        pathname !== `/dashboard/business/locations/${locationId}/missions`
      ) &&
      !(
        pathname.includes('/announcements/') &&
        pathname !== `/dashboard/business/locations/${locationId}/announcements`
      )
    );
  };

  const isVoucherDetailsRoute =
    pathname.includes('/vouchers/') &&
    pathname !== `/dashboard/business/locations/${locationId}/vouchers` &&
    !pathname.includes('/vouchers/create') &&
    !pathname.includes('/edit');
  const isVoucherCreateRoute = pathname.includes('/vouchers/create');
  const isVoucherEditRoute =
    pathname.includes('/vouchers/') && pathname.includes('/edit');
  const isMissionDetailsRoute =
    pathname.includes('/missions/') &&
    pathname !== `/dashboard/business/locations/${locationId}/missions` &&
    !pathname.includes('/missions/create') &&
    !pathname.includes('/edit');
  const isMissionCreateRoute = pathname.includes('/missions/create');
  const isMissionEditRoute =
    pathname.includes('/missions/') && pathname.includes('/edit');
  const isAnnouncementRoute =
    pathname.includes('/announcements/') &&
    pathname !== `/dashboard/business/locations/${locationId}/announcements`;
  const isAnnouncementDetailsRoute =
    pathname.includes('/announcements/') &&
    pathname !== `/dashboard/business/locations/${locationId}/announcements` &&
    !pathname.includes('/announcements/new') &&
    !pathname.includes('/edit');
  const isAnnouncementCreateRoute = pathname.includes('/announcements/new');
  const isAnnouncementEditRoute =
    pathname.includes('/announcements/') && pathname.includes('/edit');
  const isEditLocationRoute =
    pathname === `/dashboard/business/locations/${locationId}/edit`;

  // Get all images for carousel
  const images = useMemo(
    () => location?.imageUrl ?? [],
    [location?.imageUrl]
  );

  // Memoize heroImage before conditional returns (Rules of Hooks)
  const heroImage = useMemo(
    () => images[currentImageIndex] ?? "",
    [images, currentImageIndex]
  );

  // Auto-advance carousel every 10 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  // Reset to first image when images change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Auto-open tabs based on routes
  useEffect(() => {
    if (pathname.includes("/vouchers")) setActiveTab("vouchers");
    else if (pathname.includes("/missions")) setActiveTab("missions");
    else if (pathname.includes("/availability") || pathname.includes("/booking-config")) setActiveTab("booking");
    else if (pathname.includes("/announcements")) setActiveTab("announcements");
    else if (pathname.includes("/posts")) setActiveTab("posts");
    else if (pathname.includes("/check-ins")) setActiveTab("check-ins");
    else if (pathname.includes("/edit")) setActiveTab("edit");
    else setActiveTab("overview");
  }, [pathname]);

  // Auto-open voucher create tab when on voucher create route
  useEffect(() => {
    if (isVoucherCreateRoute && !voucherCreateTabOpenedRef.current) {
      voucherCreateTabOpenedRef.current = true;
      openVoucherCreateTab();
    } else if (!isVoucherCreateRoute) {
      voucherCreateTabOpenedRef.current = false;
    }
  }, [isVoucherCreateRoute, openVoucherCreateTab]);

  // Auto-open mission create tab when on mission create route
  useEffect(() => {
    if (isMissionCreateRoute && !missionCreateTabOpenedRef.current) {
      missionCreateTabOpenedRef.current = true;
      openMissionCreateTab();
    } else if (!isMissionCreateRoute) {
      missionCreateTabOpenedRef.current = false;
    }
  }, [isMissionCreateRoute, openMissionCreateTab]);

  // Auto-open announcement create tab when on announcement create route
  useEffect(() => {
    if (isAnnouncementCreateRoute && !announcementCreateTabOpenedRef.current) {
      announcementCreateTabOpenedRef.current = true;
      openAnnouncementCreateTab();
    } else if (!isAnnouncementCreateRoute) {
      announcementCreateTabOpenedRef.current = false;
    }
  }, [isAnnouncementCreateRoute, openAnnouncementCreateTab]);

  // Auto-open announcement detail tab when on announcement detail route
  useEffect(() => {
    if (isAnnouncementDetailsRoute) {
      const match = pathname.match(/\/announcements\/([^\/]+)$/);
      if (match && match[1]) {
        const announcementId = match[1];
        // Always update tab if ID changed or tab not open yet
        if (
          !announcementDetailTabOpenedRef.current ||
          announcementDetailTab.announcementId !== announcementId
        ) {
          announcementDetailTabOpenedRef.current = true;
          // Open with generic name - detail view will update it when data loads
          openAnnouncementDetailTab(announcementId, 'View Announcement');
        }
      }
    } else if (!isAnnouncementDetailsRoute) {
      announcementDetailTabOpenedRef.current = false;
    }
  }, [
    isAnnouncementDetailsRoute,
    pathname,
    openAnnouncementDetailTab,
    announcementDetailTab.announcementId,
  ]);

  // Auto-open announcement edit tab when on announcement edit route
  useEffect(() => {
    if (isAnnouncementEditRoute && !announcementEditTabOpenedRef.current) {
      const announcementIdMatch = pathname.match(
        /\/announcements\/([^\/]+)\/edit/
      );
      if (announcementIdMatch && announcementIdMatch[1]) {
        announcementEditTabOpenedRef.current = true;
        openAnnouncementEditTab(announcementIdMatch[1], 'Edit Announcement');
      }
    } else if (!isAnnouncementEditRoute) {
      announcementEditTabOpenedRef.current = false;
    }
  }, [isAnnouncementEditRoute, pathname, openAnnouncementEditTab]);

  // Auto-open voucher detail tab when on voucher detail route
  useEffect(() => {
    if (isVoucherDetailsRoute) {
      const match = pathname.match(/\/vouchers\/([^\/]+)$/);
      if (match && match[1]) {
        const voucherId = match[1];
        // Always update tab if ID changed or tab not open yet
        if (
          !voucherDetailTabOpenedRef.current ||
          voucherDetailTab.voucherId !== voucherId
        ) {
          voucherDetailTabOpenedRef.current = true;
          // Open with generic name - detail view will update it when data loads
          openVoucherDetailTab(voucherId, 'View Voucher');
        }
      }
    } else if (!isVoucherDetailsRoute) {
      voucherDetailTabOpenedRef.current = false;
    }
  }, [
    isVoucherDetailsRoute,
    pathname,
    openVoucherDetailTab,
    voucherDetailTab.voucherId,
  ]);

  // Auto-open mission detail tab when on mission detail route
  useEffect(() => {
    if (isMissionDetailsRoute) {
      const match = pathname.match(/\/missions\/([^\/]+)$/);
      if (match && match[1]) {
        const missionId = match[1];
        // Always update tab if ID changed or tab not open yet
        if (
          !missionDetailTabOpenedRef.current ||
          missionDetailTab.missionId !== missionId
        ) {
          missionDetailTabOpenedRef.current = true;
          // Open with generic name - detail view will update it when data loads
          openMissionDetailTab(missionId, 'View Mission');
        }
      }
    } else if (!isMissionDetailsRoute) {
      missionDetailTabOpenedRef.current = false;
    }
  }, [
    isMissionDetailsRoute,
    pathname,
    openMissionDetailTab,
    missionDetailTab.missionId,
  ]);

  // Auto-open voucher edit tab when on voucher edit route
  useEffect(() => {
    if (isVoucherEditRoute && !voucherEditTabOpenedRef.current) {
      const voucherIdMatch = pathname.match(/\/vouchers\/([^\/]+)\/edit/);
      if (voucherIdMatch && voucherIdMatch[1]) {
        voucherEditTabOpenedRef.current = true;
        openVoucherEditTab(voucherIdMatch[1], 'Edit Voucher');
      }
    } else if (!isVoucherEditRoute) {
      voucherEditTabOpenedRef.current = false;
    }
  }, [isVoucherEditRoute, pathname, openVoucherEditTab]);

  // Auto-open mission edit tab when on mission edit route
  useEffect(() => {
    if (isMissionEditRoute && !missionEditTabOpenedRef.current) {
      const missionIdMatch = pathname.match(/\/missions\/([^\/]+)\/edit/);
      if (missionIdMatch && missionIdMatch[1]) {
        missionEditTabOpenedRef.current = true;
        openMissionEditTab(missionIdMatch[1], 'Edit Mission');
      }
    } else if (!isMissionEditRoute) {
      missionEditTabOpenedRef.current = false;
    }
  }, [isMissionEditRoute, pathname, openMissionEditTab]);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (isError || !location) {
    return <ErrorCustom />;
  }

  const truncatedDescription = location.description
    ? location.description.length > 150
      ? location.description.substring(0, 150) + '...'
      : location.description
    : null;

  return (
    <div className='space-y-0'>
      {/* Cover Banner */}
      <div className='relative w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden rounded-b-3xl'>
        {heroImage ? (
          <img
            src={heroImage}
            alt={location.name}
            className='w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity'
            onClick={() => handleImageClick(heroImage)}
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50'>
            <div className='text-center space-y-2'>
              <ImageIcon className='h-16 w-16 mx-auto text-muted-foreground/50' />
              <p className='text-sm text-muted-foreground'>No cover image</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />

        {/* Carousel Navigation - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background border shadow-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background border shadow-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === currentImageIndex
                    ? "w-8 bg-background"
                    : "w-2 bg-background/50 hover:bg-background/75"
                    }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Back Button - Overlay */}
        <div className='absolute top-4 left-4 z-10'>
          <Button
            variant='default'
            size='icon'
            onClick={() => router.push('/dashboard/business/locations')}
            className='bg-background/98 border-2 border-foreground/30 shadow-2xl backdrop-blur-lg hover:bg-background min-w-[44px] min-h-[44px]'
          >
            <ArrowLeft className='h-5 w-5 text-foreground stroke-2' />
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="space-y-8 p-6 -mt-24 relative z-10">
        {/* Header Section with Avatar and Key Info */}
        <div className='flex flex-col md:flex-row gap-6'>
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="size-48 rounded-2xl border-4 border-background shadow-lg bg-muted flex items-center justify-center">
                <Image className='w-full h-full object-cover' src={location.imageUrl[0]} alt={location.name} width={100} height={100} />
              </div>
            </div>
          </div>

          {/* Key Information */}
          <div className="flex-1 space-y-4 mt-20">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold">{location.name}</h1>
                </div>

                {truncatedDescription && (
                  <p className='text-base text-muted-foreground leading-relaxed max-w-3xl line-clamp-2 pt-3'>
                    {truncatedDescription}
                  </p>
                )}

                {/* Address Information */}
                <div className='space-y-2 pt-2 flex justify-between'>
                  <div className='flex flex-wrap items-center gap-3'>
                    {/* Address */}
                    <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">
                      <MapPin className="h-4 w-4 text-primary-foreground flex-shrink-0" />
                      <span className="font-medium whitespace-nowrap">
                        {location.addressLine}, {location.addressLevel1}, {location.addressLevel2}
                      </span>
                    </div>
                  </div>

                  {/* Visibility Badge */}
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={
                        location.isVisibleOnMap ? 'default' : 'secondary'
                      }
                      className={`text-sm px-3 py-1.5 font-semibold ${location.isVisibleOnMap
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600'
                        : 'bg-muted text-muted-foreground border-muted-foreground/20'
                        }`}
                    >
                      {location.isVisibleOnMap ? (
                        <span className='flex items-center gap-1.5'>
                          <Eye className='h-3.5 w-3.5' />
                          Visible
                        </span>
                      ) : (
                        <span className='flex items-center gap-1.5'>
                          <EyeOff className='h-3.5 w-3.5' />
                          Hidden
                        </span>
                      )}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleVisibilityClick(!location.isVisibleOnMap)}
                        >
                          {/* Logic hiển thị text ngược lại với trạng thái hiện tại */}
                          {location.isVisibleOnMap ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Make Hidden
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Make Visible
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className='border-b'>
          <nav className='flex gap-1 overflow-x-auto'>
            <Link href={`/dashboard/business/locations/${locationId}`}>
              <Button
                variant='ghost'
                className={cn(
                  'gap-2 rounded-b-none border-b-2 transition-colors',
                  isActiveTab(`/dashboard/business/locations/${locationId}`)
                    ? 'border-primary bg-muted'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <Layers className='h-4 w-4' />
                Overview
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/check-ins`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/business/locations/${locationId}/check-ins`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <MapPinIcon className="h-4 w-4" />
                Check Ins
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/vouchers`}>
              <Button
                variant='ghost'
                className={cn(
                  'gap-2 rounded-b-none border-b-2 transition-colors',
                  isActiveTab(
                    `/dashboard/business/locations/${locationId}/vouchers`
                  )
                    ? 'border-primary bg-muted'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <Ticket className='h-4 w-4' />
                Vouchers
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/missions`}>
              <Button
                variant='ghost'
                className={cn(
                  'gap-2 rounded-b-none border-b-2 transition-colors',
                  isActiveTab(
                    `/dashboard/business/locations/${locationId}/missions`
                  )
                    ? 'border-primary bg-muted'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <Rocket className='h-4 w-4' />
                Missions
              </Button>
            </Link>
            <Link
              href={`/dashboard/business/locations/${locationId}/availability?tab=calendar`}
            >
              <Button
                variant='ghost'
                className={cn(
                  'gap-2 rounded-b-none border-b-2 transition-colors',
                  isActiveTab(
                    `/dashboard/business/locations/${locationId}/booking-config`
                  ) ||
                    isActiveTab(
                      `/dashboard/business/locations/${locationId}/availability`
                    )
                    ? 'border-primary bg-muted'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <CalendarDays className='h-4 w-4' />
                Booking & Availability
              </Button>
            </Link>
            <Link
              href={`/dashboard/business/locations/${locationId}/announcements`}
            >
              <Button
                variant='ghost'
                className={cn(
                  'gap-2 rounded-b-none border-b-2 transition-colors',
                  isActiveTab(
                    `/dashboard/business/locations/${locationId}/announcements`
                  )
                    ? 'border-primary bg-muted'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <Megaphone className='h-4 w-4' />
                Announcements
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/posts`}>
              <Button
                variant='ghost'
                className={cn(
                  'gap-2 rounded-b-none border-b-2 transition-colors',
                  isActiveTab(
                    `/dashboard/business/locations/${locationId}/posts`
                  )
                    ? 'border-primary bg-muted'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <MessageSquare className='h-4 w-4' />
                Posts & Reviews
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/edit`}>
              <Button
                variant='ghost'
                className={cn(
                  'gap-2 rounded-b-none border-b-2 transition-colors',
                  isEditLocationRoute
                    ? 'border-primary bg-muted'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
              >
                <FilePenLine className='h-4 w-4' />
                Edit Location
              </Button>
            </Link>

            {/* Dynamic Voucher Create Tab */}
            {voucherCreateTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('voucher-create')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    router.push(
                      `/dashboard/business/locations/${locationId}/vouchers/create`
                    );
                  }}
                >
                  Create Voucher
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnCreatePage = isVoucherCreateRoute;
                    closeVoucherCreateTab();
                    if (wasOnCreatePage) {
                      requestAnimationFrame(() => {
                        router.push(
                          `/dashboard/business/locations/${locationId}/vouchers`
                        );
                      });
                    }
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Voucher Edit Tab */}
            {voucherEditTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('voucher-edit')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    if (voucherEditTab.voucherId) {
                      router.push(
                        `/dashboard/business/locations/${locationId}/vouchers/${voucherEditTab.voucherId}/edit`
                      );
                    }
                  }}
                >
                  Edit Voucher
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnEditPage = isVoucherEditRoute;
                    closeVoucherEditTab();
                    if (wasOnEditPage) {
                      requestAnimationFrame(() => {
                        router.push(
                          `/dashboard/business/locations/${locationId}/vouchers`
                        );
                      });
                    }
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Voucher Detail Tab */}
            {voucherDetailTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('voucher-detail')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    if (voucherDetailTab.voucherId) {
                      router.push(
                        `/dashboard/business/locations/${locationId}/vouchers/${voucherDetailTab.voucherId}`
                      );
                    }
                  }}
                >
                  {voucherDetailTab.voucherName || 'View Voucher'}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Reset ref first to prevent auto-reopening
                    voucherDetailTabOpenedRef.current = false;
                    // Close tab immediately
                    closeVoucherDetailTab();
                    // Navigate immediately after
                    router.push(
                      `/dashboard/business/locations/${locationId}/vouchers`
                    );
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Mission Create Tab */}
            {missionCreateTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('mission-create')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    router.push(
                      `/dashboard/business/locations/${locationId}/missions/create`
                    );
                  }}
                >
                  Create Mission
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnCreatePage = isMissionCreateRoute;
                    closeMissionCreateTab();
                    if (wasOnCreatePage) {
                      requestAnimationFrame(() => {
                        router.push(
                          `/dashboard/business/locations/${locationId}/missions`
                        );
                      });
                    }
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Mission Edit Tab */}
            {missionEditTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('mission-edit')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    if (missionEditTab.missionId) {
                      router.push(
                        `/dashboard/business/locations/${locationId}/missions/${missionEditTab.missionId}/edit`
                      );
                    }
                  }}
                >
                  Edit Mission
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnEditPage = isMissionEditRoute;
                    closeMissionEditTab();
                    if (wasOnEditPage) {
                      requestAnimationFrame(() => {
                        router.push(
                          `/dashboard/business/locations/${locationId}/missions`
                        );
                      });
                    }
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Mission Detail Tab */}
            {missionDetailTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('mission-detail')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    if (missionDetailTab.missionId) {
                      router.push(
                        `/dashboard/business/locations/${locationId}/missions/${missionDetailTab.missionId}`
                      );
                    }
                  }}
                >
                  {missionDetailTab.missionName || 'View Mission'}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Reset ref first to prevent auto-reopening
                    missionDetailTabOpenedRef.current = false;
                    // Close tab immediately
                    closeMissionDetailTab();
                    // Navigate immediately after
                    router.push(
                      `/dashboard/business/locations/${locationId}/missions`
                    );
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Announcement Create Tab */}
            {announcementCreateTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('announcement-create')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    router.push(
                      `/dashboard/business/locations/${locationId}/announcements/new`
                    );
                  }}
                >
                  Create Announcement
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnCreatePage = isAnnouncementCreateRoute;
                    closeAnnouncementCreateTab();
                    if (wasOnCreatePage) {
                      requestAnimationFrame(() => {
                        router.push(
                          `/dashboard/business/locations/${locationId}/announcements`
                        );
                      });
                    }
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Announcement Detail Tab */}
            {announcementDetailTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('announcement-detail')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    if (announcementDetailTab.announcementId) {
                      router.push(
                        `/dashboard/business/locations/${locationId}/announcements/${announcementDetailTab.announcementId}`
                      );
                    }
                  }}
                >
                  {announcementDetailTab.announcementName ||
                    'View Announcement'}
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Reset ref first to prevent auto-reopening
                    announcementDetailTabOpenedRef.current = false;
                    // Close tab immediately
                    closeAnnouncementDetailTab();
                    // Navigate immediately after
                    router.push(
                      `/dashboard/business/locations/${locationId}/announcements`
                    );
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}

            {/* Dynamic Announcement Edit Tab */}
            {announcementEditTab.isOpen && (
              <div className='relative flex items-center'>
                <Button
                  variant='ghost'
                  className={cn(
                    'rounded-b-none border-b-2 transition-colors pr-7',
                    isActiveTab('announcement-edit')
                      ? 'border-primary bg-muted'
                      : 'border-transparent hover:border-muted-foreground/50'
                  )}
                  onClick={() => {
                    if (announcementEditTab.announcementId) {
                      router.push(
                        `/dashboard/business/locations/${locationId}/announcements/${announcementEditTab.announcementId}/edit`
                      );
                    }
                  }}
                >
                  Edit Announcement
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnEditPage = isAnnouncementEditRoute;
                    closeAnnouncementEditTab();
                    if (wasOnEditPage) {
                      requestAnimationFrame(() => {
                        router.push(
                          `/dashboard/business/locations/${locationId}/announcements`
                        );
                      });
                    }
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            )}
          </nav>
        </div>

        {/* Page Content */}
        <div className='mt-6'>{children}</div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt='Enlarged preview'
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />

      <AlertDialog open={visibilityDialogOpen} onOpenChange={setVisibilityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingVisibility ? "Make Location Visible?" : "Hide Location?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingVisibility
                ? "This will make the location visible to all users on the map. Are you sure?"
                : "This will hide the location from the map. Users will no longer be able to see it. Are you sure?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingVisibility(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVisibilityChange}
              disabled={isUpdating} // Sử dụng biến isUpdating từ hook
              className={pendingVisibility ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pendingVisibility ? "Make Visible" : "Hide Location"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LocationDetailLayout({
  params,
  children,
}: {
  params: Promise<{ locationId: string }>;
  children: React.ReactNode;
}) {
  const { locationId } = use(params);

  return (
    <LocationTabProvider>
      <LocationDetailLayoutContent locationId={locationId}>
        {children}
      </LocationDetailLayoutContent>
    </LocationTabProvider>
  );
}
