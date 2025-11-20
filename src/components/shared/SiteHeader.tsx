"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import * as React from "react";
import { usePathname, useParams, useSearchParams } from "next/navigation";
import { ChevronRight, Wallet, MapPin, Calendar, FileText, Building2, CreditCard, Users, Settings, BarChart3, Gift, Target, Megaphone, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Route segment to label mapping
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  business: "Business",
  creator: "Creator",
  admin: "Admin",
  accounts: "Accounts Management",
  wallet: "Wallet",
  locations: "Locations",
  "location-requests": "Location Requests",
  "location-bookings": "Location Bookings",
  requests: "Requests",
  events: "Events",
  request: "Event Requests",
  missions: "Missions",
  vouchers: "Vouchers",
  announcements: "Announcements",
  "booking-config": "Booking Config",
  availability: "Availability",
  edit: "Edit",
  create: "Create",
  new: "New",
  deposit: "Deposit",
  withdraw: "Withdraw",
};

// Route segment to icon mapping
const routeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wallet: Wallet,
  locations: MapPin,
  "location-bookings": Calendar,
  requests: FileText,
  events: Calendar,
  request: FileText,
  missions: Target,
  vouchers: Gift,
  announcements: Megaphone,
  "booking-config": Settings,
  availability: Calendar,
  deposit: CreditCard,
  withdraw: CreditCard,
  business: Building2,
  creator: Users,
  admin: BarChart3,
};

// Check if a segment looks like an ID (UUID or long alphanumeric)
function isIdSegment(segment: string): boolean {
  // UUID format or long alphanumeric strings
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
         /^[0-9a-f]{24}$/i.test(segment) ||
         (segment.length > 20 && /^[a-z0-9-]+$/i.test(segment));
}

// Get label for dynamic route segments (IDs)
function getDynamicRouteLabel(
  segment: string,
  prevSegment: string | undefined,
  params: Record<string, string | string[]>,
  searchParams: URLSearchParams,
  pathname: string
): string | null {
  // Transaction detail pages
  if (prevSegment === "wallet" && isIdSegment(segment)) {
    const type = searchParams.get("type");
    if (type === "internal") {
      return "Internal Transaction";
    }
    return "External Transaction";
  }

  // Location detail
  if (prevSegment === "locations" && isIdSegment(segment)) {
    return "Location Details";
  }

  // Mission detail
  if (prevSegment === "missions" && isIdSegment(segment)) {
    return "Mission Details";
  }

  // Voucher detail
  if (prevSegment === "vouchers" && isIdSegment(segment)) {
    return "Voucher Details";
  }

  // Event detail
  if (prevSegment === "events" && isIdSegment(segment)) {
    return "Event Details";
  }

  // Booking detail
  if (prevSegment === "location-bookings" && isIdSegment(segment)) {
    return "Booking Details";
  }

  // Request detail - for event requests (creator dashboard)
  if (prevSegment === "requests" || prevSegment === "request") {
    if (isIdSegment(segment)) {
      return "Request Details";
    }
  }

  // Ticket detail
  if (prevSegment === "tickets" && isIdSegment(segment)) {
    return "Ticket Details";
  }

  // Announcement detail
  if (prevSegment === "announcements" && isIdSegment(segment)) {
    return "Announcement Details";
  }

  return null;
}

function buildBreadcrumbs(
  pathname: string,
  params: Record<string, string | string[]>,
  searchParams: URLSearchParams
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = "";

  // Skip "dashboard", "admin", "business", "creator" as they're implicit
  const skipSegments = ["dashboard", "admin", "business", "creator"];
  const startIndex = skipSegments.includes(segments[0]) ? 1 : 0;

  segments.forEach((segment, index) => {
    if (index < startIndex) {
      currentPath += `/${segment}`;
      return;
    }

    // Skip "business" and "creator" segments even if they appear later
    if (skipSegments.includes(segment)) {
      currentPath += `/${segment}`;
      return;
    }

    const prevSegment = index > 0 ? segments[index - 1] : undefined;
    // Get the actual previous segment that wasn't skipped
    let actualPrevSegment = prevSegment;
    for (let i = index - 1; i >= 0; i--) {
      if (!skipSegments.includes(segments[i])) {
        actualPrevSegment = segments[i];
        break;
      }
    }
    const isLast = index === segments.length - 1;

    // Check if this is a dynamic route (ID segment)
    if (isIdSegment(segment)) {
      const dynamicLabel = getDynamicRouteLabel(segment, actualPrevSegment, params, searchParams, pathname);
      if (dynamicLabel) {
        breadcrumbs.push({
          label: dynamicLabel,
          icon: routeIcons[actualPrevSegment || ""] || FileText,
        });
      }
      // Still add to currentPath for navigation
      currentPath += `/${segment}`;
      return;
    }

    currentPath += `/${segment}`;
    
    // Handle special action pages
    if (segment === "edit" || segment === "create" || segment === "new") {
      const actionLabel = segment === "new" ? "Create" : segment.charAt(0).toUpperCase() + segment.slice(1);
      const parentLabel = actualPrevSegment ? routeLabels[actualPrevSegment] || actualPrevSegment : "Item";
      breadcrumbs.push({
        label: `${actionLabel} ${parentLabel}`,
        icon: FileText,
      });
      return;
    }

    // Skip "request" segment when it's under locations (since location requests are merged into locations page)
    if ((segment === "request" || segment === "requests") && actualPrevSegment === "locations") {
      return;
    }

    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    const icon = routeIcons[segment];

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      icon,
    });
  });

  return breadcrumbs;
}

export function SiteHeader() {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const breadcrumbs = React.useMemo(() => {
    return buildBreadcrumbs(pathname, params as Record<string, string | string[]>, searchParams);
  }, [pathname, params, searchParams]);

  // Handle root dashboard pages - show "Overview" instead of just "Business" or "Creator"
  if (breadcrumbs.length === 1 && (pathname === "/dashboard/business" || pathname === "/dashboard/creator" || pathname === "/admin")) {
    return (
      <header className="sticky top-0 z-10 flex h-[var(--header-height)] rounded-t-lg shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 shrink-0"
          />
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
            <h1 className="text-base font-semibold text-foreground truncate">Overview</h1>
          </div>
        </div>
      </header>
    );
  }

  // Handle admin/business page - show "Business Registrations"
  if (pathname === "/admin/business") {
    return (
      <header className="sticky top-0 z-10 flex h-[var(--header-height)] rounded-t-lg shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 shrink-0"
          />
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <h1 className="text-base font-semibold text-foreground truncate">Business Registrations</h1>
          </div>
        </div>
      </header>
    );
  }

  // If only one breadcrumb, show it as a simple title
  if (breadcrumbs.length <= 1) {
    const item = breadcrumbs[0] || { label: "Dashboard" };
    const Icon = item.icon;

    return (
      <header className="sticky top-0 z-10 flex h-[var(--header-height)] rounded-t-lg shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 shrink-0"
          />
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
            <h1 className="text-base font-semibold text-foreground truncate">{item.label}</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex h-[var(--header-height)] rounded-t-lg shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 shrink-0"
        />
        <nav className="flex items-center gap-1 min-w-0 flex-1" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 min-w-0 flex-wrap">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const Icon = item.icon;

              return (
                <li key={index} className="flex items-center gap-1 min-w-0">
                  {index > 0 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mx-0.5" />
                  )}
                  {isLast ? (
                    <div className="flex items-center gap-2 min-w-0">
                      {Icon && (
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-base font-semibold text-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={cn(
                        "flex items-center gap-1 min-w-0 text-xs text-muted-foreground hover:text-foreground transition-colors",
                        "truncate"
                      )}
                    >
                      {Icon && (
                        <Icon className="h-3 w-3 shrink-0" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
}
