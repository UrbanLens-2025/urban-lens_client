"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import * as React from "react";
import { usePathname } from "next/navigation";


export function SiteHeader() {
  const pathname = usePathname();

  const titleMap: Record<string, string> = {
    "/admin": "Overview",
    "/dashboard/business": "Overview",
    "/creator/dashboard": "Overview",
    "/admin/locations": "Locations",
    "/admin/business": "Business",
    "/admin/tags": "Tags",
    "/admin/addresses": "Addresses",
    "/dashboard/business/locations": "My Locations",
    "/creator/events": "My Events",
    "/creator/event-requests": "Event Requests",
    "/creator/events/create": "Create Event",
    "/creator/wallet": "Wallet",
  };

  const title =
    titleMap[pathname] ||
    Object.keys(titleMap).find((key) => pathname.startsWith(key + "/")) && titleMap[
      Object.keys(titleMap).find((key) => pathname.startsWith(key + "/"))!
    ] ||
    "Untitled";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
