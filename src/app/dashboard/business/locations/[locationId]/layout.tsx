"use client";

import type React from "react";
import { use, useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { LocationTabProvider, useLocationTabs } from "@/contexts/LocationTabContext";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function LocationDetailLayoutContent({
  locationId,
  children,
}: {
  locationId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    voucherCreateTab,
    openVoucherCreateTab,
    closeVoucherCreateTab,
    voucherEditTab,
    openVoucherEditTab,
    closeVoucherEditTab,
    voucherDetailTab,
    closeVoucherDetailTab,
    missionCreateTab,
    openMissionCreateTab,
    closeMissionCreateTab,
    missionEditTab,
    openMissionEditTab,
    closeMissionEditTab,
    missionDetailTab,
    closeMissionDetailTab,
    announcementCreateTab,
    openAnnouncementCreateTab,
    closeAnnouncementCreateTab,
    announcementDetailTab,
    openAnnouncementDetailTab,
    closeAnnouncementDetailTab,
  } = useLocationTabs();

  const [preventAutoOpenVoucherId, setPreventAutoOpenVoucherId] = useState<string | null>(null);
  const [preventAutoOpenMissionId, setPreventAutoOpenMissionId] = useState<string | null>(null);
  const [preventAutoOpenAnnouncementId, setPreventAutoOpenAnnouncementId] = useState<string | null>(null);
  
  // Use refs to track if we've already opened tabs to prevent infinite loops
  const voucherCreateTabOpenedRef = useRef(false);
  const missionCreateTabOpenedRef = useRef(false);
  const announcementCreateTabOpenedRef = useRef(false);

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: location, isLoading, isError } = useLocationById(locationId);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
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
    // Check if voucher detail tab is open and active
    if (path === 'voucher-detail' && voucherDetailTab.isOpen) {
      return pathname.includes('/vouchers/') && 
        pathname !== `/dashboard/business/locations/${locationId}/vouchers`;
    }
    
    // Check if voucher create tab is open and active
    if (path === 'voucher-create' && voucherCreateTab.isOpen) {
      return pathname.includes('/vouchers/create');
    }
    
    // Check if voucher edit tab is open and active
    if (path === 'voucher-edit' && voucherEditTab.isOpen) {
      return pathname.includes('/vouchers/') && pathname.includes('/edit');
    }
    
    // Check if mission detail tab is open and active
    if (path === 'mission-detail' && missionDetailTab.isOpen) {
      return pathname.includes('/missions/') && 
        pathname !== `/dashboard/business/locations/${locationId}/missions`;
    }
    
    // Check if mission create tab is open and active
    if (path === 'mission-create' && missionCreateTab.isOpen) {
      return pathname.includes('/missions/create');
    }
    
    // Check if mission edit tab is open and active
    if (path === 'mission-edit' && missionEditTab.isOpen) {
      return pathname.includes('/missions/') && pathname.includes('/edit');
    }
    
    // Check if announcement detail tab is open and active
    if (path === 'announcement-detail' && announcementDetailTab.isOpen) {
      return pathname.includes('/announcements/') && 
        pathname !== `/dashboard/business/locations/${locationId}/announcements`;
    }
    
    // Check if announcement create tab is open and active
    if (path === 'announcement-create' && announcementCreateTab.isOpen) {
      return pathname.includes('/announcements/create');
    }
    
    if (path === `/dashboard/business/locations/${locationId}`) {
      return pathname === path;
    }
    
    return pathname.startsWith(path) && 
      !(pathname.includes('/vouchers/') && pathname !== `/dashboard/business/locations/${locationId}/vouchers`) &&
      !(pathname.includes('/missions/') && pathname !== `/dashboard/business/locations/${locationId}/missions`) &&
      !(pathname.includes('/announcements/') && pathname !== `/dashboard/business/locations/${locationId}/announcements`);
  };

  const isVoucherDetailsRoute = pathname.includes('/vouchers/') && 
    pathname !== `/dashboard/business/locations/${locationId}/vouchers` &&
    !pathname.includes('/vouchers/create') &&
    !pathname.includes('/edit');
  const isVoucherCreateRoute = pathname.includes('/vouchers/create');
  const isVoucherEditRoute = pathname.includes('/vouchers/') && pathname.includes('/edit');
  const isMissionDetailsRoute = pathname.includes('/missions/') && 
    pathname !== `/dashboard/business/locations/${locationId}/missions` &&
    !pathname.includes('/missions/create') &&
    !pathname.includes('/edit');
  const isMissionCreateRoute = pathname.includes('/missions/create');
  const isMissionEditRoute = pathname.includes('/missions/') && pathname.includes('/edit');
  const isAnnouncementRoute = pathname.includes('/announcements/') && pathname !== `/dashboard/business/locations/${locationId}/announcements`;
  const isEditLocationRoute = pathname === `/dashboard/business/locations/${locationId}/edit`;

  // Memoize heroImage before conditional returns (Rules of Hooks)
  const heroImage = useMemo(
    () => location?.imageUrl?.[0] ?? "",
    [location?.imageUrl]
  );

  // Auto-open tabs based on routes
  useEffect(() => {
    if (pathname.includes("/vouchers")) setActiveTab("vouchers");
    else if (pathname.includes("/missions")) setActiveTab("missions");
    else if (pathname.includes("/availability") || pathname.includes("/booking-config")) setActiveTab("booking");
    else if (pathname.includes("/announcements")) setActiveTab("announcements");
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
    if (announcementCreateTab.isOpen && pathname.includes('/announcements/create') && !announcementCreateTabOpenedRef.current) {
      announcementCreateTabOpenedRef.current = true;
    } else if (!pathname.includes('/announcements/create')) {
      announcementCreateTabOpenedRef.current = false;
    }
  }, [pathname, announcementCreateTab.isOpen]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading location details</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const truncatedDescription = location.description 
    ? (location.description.length > 150 ? location.description.substring(0, 150) + "..." : location.description)
    : null;

  // Limit tags to show
  const MAX_VISIBLE_TAGS = 4;
  const visibleTags = location.tags?.slice(0, MAX_VISIBLE_TAGS) || [];
  const remainingTagsCount = (location.tags?.length || 0) - MAX_VISIBLE_TAGS;

  return (
    <div className="space-y-0">
      {/* Cover Banner */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden rounded-b-3xl">
        {heroImage ? (
          <img
            src={heroImage}
            alt={location.name}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(heroImage)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center space-y-2">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No cover image</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
        
        {/* Back Button - Overlay */}
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="default" 
            size="icon" 
            onClick={() => router.push('/dashboard/business/locations')} 
            className="bg-background/98 border-2 border-foreground/30 shadow-2xl backdrop-blur-lg hover:bg-background min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5 text-foreground stroke-2" />
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="space-y-8 p-6 -mt-20 relative z-10">
        {/* Header Section with Avatar and Key Info */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={location.name}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background shadow-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(heroImage)}
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background shadow-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Key Information */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold">{location.name}</h1>
                  <Badge variant={location.isVisibleOnMap ? "default" : "secondary"} className="text-sm">
                    {location.isVisibleOnMap ? (
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3 w-3" />
                        Visible
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <EyeOff className="h-3 w-3" />
                        Hidden
                      </span>
                    )}
                  </Badge>
                </div>
                
                {truncatedDescription && (
                  <p className="text-base text-muted-foreground leading-relaxed max-w-3xl line-clamp-2">
                    {truncatedDescription}
                  </p>
                )}

                {/* Address and Tags Information */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {/* Address */}
                  <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium whitespace-nowrap">
                      {location.addressLine}
                    </span>
                    {location.addressLevel1 && location.addressLevel2 && (
                      <>
                        <span className="text-muted-foreground mx-1.5">•</span>
                        <span className="text-muted-foreground text-xs">
                          {location.addressLevel1}, {location.addressLevel2}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Limited Tags */}
                  {visibleTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {visibleTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          style={{
                            backgroundColor: `${tag.color}15`,
                            borderColor: tag.color,
                            color: tag.color,
                          }}
                          className="text-xs border"
                        >
                          <span className="mr-1">{tag.icon}</span>
                          {tag.displayName}
                        </Badge>
                      ))}
                      {remainingTagsCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{remainingTagsCount} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("edit");
                    router.push(`/dashboard/business/locations/${locationId}/edit`);
                  }}
                  className="w-full sm:w-auto gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Location
                </Button>
              </div>
            </div>

            {/* Location Metadata */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
              {location.createdAt && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-medium">Created:</span>
                  <span>{formatCompactDateTime(location.createdAt)}</span>
                </div>
              )}
              {location.radiusMeters && (
                <div className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" />
                  <span className="font-medium">Service Radius:</span>
                  <span>{location.radiusMeters}m</span>
                </div>
              )}
              {location.totalCheckIns !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium">Total Check-ins:</span>
                  <span>{Number(location.totalCheckIns || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b">
          <nav className="flex gap-1 overflow-x-auto">
            <Link href={`/dashboard/business/locations/${locationId}`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/business/locations/${locationId}`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Layers className="h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/vouchers`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/business/locations/${locationId}/vouchers`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Ticket className="h-4 w-4" />
                Vouchers
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/missions`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/business/locations/${locationId}/missions`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Rocket className="h-4 w-4" />
                Missions
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/booking-config`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/business/locations/${locationId}/booking-config`) ||
                  isActiveTab(`/dashboard/business/locations/${locationId}/availability`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                Booking & Availability
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${locationId}/announcements`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/business/locations/${locationId}/announcements`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Megaphone className="h-4 w-4" />
                Announcements
              </Button>
            </Link>
            
            {/* Dynamic Voucher Create Tab */}
            {voucherCreateTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('voucher-create')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    router.push(`/dashboard/business/locations/${locationId}/vouchers/create`);
                  }}
                >
                  <TicketPercent className="h-4 w-4 mr-2" />
                  Create Voucher
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnCreatePage = isVoucherCreateRoute;
                    closeVoucherCreateTab();
                    if (wasOnCreatePage) {
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/business/locations/${locationId}/vouchers`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Dynamic Voucher Edit Tab */}
            {voucherEditTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('voucher-edit')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    if (voucherEditTab.voucherId) {
                      router.push(`/dashboard/business/locations/${locationId}/vouchers/${voucherEditTab.voucherId}/edit`);
                    }
                  }}
                >
                  <TicketPercent className="h-4 w-4 mr-2" />
                  Edit Voucher
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnEditPage = isVoucherEditRoute;
                    closeVoucherEditTab();
                    if (wasOnEditPage) {
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/business/locations/${locationId}/vouchers`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Dynamic Mission Create Tab */}
            {missionCreateTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('mission-create')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    router.push(`/dashboard/business/locations/${locationId}/missions/create`);
                  }}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Create Mission
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnCreatePage = isMissionCreateRoute;
                    closeMissionCreateTab();
                    if (wasOnCreatePage) {
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/business/locations/${locationId}/missions`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Dynamic Mission Edit Tab */}
            {missionEditTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('mission-edit')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    if (missionEditTab.missionId) {
                      router.push(`/dashboard/business/locations/${locationId}/missions/${missionEditTab.missionId}/edit`);
                    }
                  }}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Edit Mission
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnEditPage = isMissionEditRoute;
                    closeMissionEditTab();
                    if (wasOnEditPage) {
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/business/locations/${locationId}/missions`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Dynamic Announcement Create Tab */}
            {announcementCreateTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('announcement-create')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    router.push(`/dashboard/business/locations/${locationId}/announcements/create`);
                  }}
                >
                  <Megaphone className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const wasOnCreatePage = announcementCreateTab.isOpen && pathname.includes('/announcements/create');
                    closeAnnouncementCreateTab();
                    if (wasOnCreatePage) {
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/business/locations/${locationId}/announcements`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </nav>
        </div>

        {/* Page Content */}
        <div className="mt-6">
          {children}
        </div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt="Enlarged preview"
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
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
