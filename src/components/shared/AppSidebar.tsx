"use client";

import * as React from "react";
import {
  IconBuildingBridge2,
  IconCalendar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconMapPin,
  IconSettings,
  IconTag,
  IconMapPinCode,
  IconWallet,
  IconCalendarEvent,
  IconClipboardList,
  IconPlus,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "./NavMain";
import { NavSecondary } from "./NavSecondary";
import { NavUser } from "./NavUser";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/user/useUser";

const adminNav = [
  { title: "Overview", url: "/admin", icon: IconDashboard },
  { title: "Locations", url: "/admin/locations", icon: IconMapPin },
  { title: "Business", url: "/admin/business", icon: IconBuildingBridge2 },
  { title: "Tags", url: "/admin/tags", icon: IconTag },
  { title: "Addresses", url: "/admin/addresses", icon: IconMapPinCode },
];

const businessNav = [
  { title: "Overview", url: "/dashboard/business", icon: IconDashboard },
  {
    title: "My Locations",
    url: "/dashboard/business/locations",
    icon: IconMapPin,
  },
];

const creatorNav = [
  { title: "Overview", url: "/creator/dashboard", icon: IconDashboard },
  { 
    title: "Events", 
    icon: IconCalendar,
    items: [
      { title: "My Events", url: "/creator/events", icon: IconCalendarEvent },
      { title: "Event Requests", url: "/creator/event-requests", icon: IconClipboardList },
      { title: "Create Event", url: "/creator/events/create", icon: IconPlus },
    ]
  },
];

const navSecondary = [
  { title: "Settings", url: "#", icon: IconSettings },
  { title: "Get Help", url: "#", icon: IconHelp },
];

const creatorNavSecondary = [
  { title: "Settings", url: "#", icon: IconSettings },
  { title: "Wallet", url: "/creator/wallet", icon: IconWallet },
  { title: "Get Help", url: "#", icon: IconHelp },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useUser();

  const dashboardTitle = React.useMemo(() => {
    switch (user?.role) {
      case "ADMIN":
        return "Admin Dashboard";
      case "BUSINESS_OWNER":
        return "Business Dashboard";
      case "EVENT_CREATOR":
        return "Creator Dashboard";
      default:
        return "Dashboard";
    }
  }, [user]);

  const { navMain, navSecondaryItems } = React.useMemo(() => {
    if (!user) return { navMain: [], navSecondaryItems: navSecondary };

    switch (user.role) {
      case "ADMIN":
        return {
          navMain: adminNav,
          navSecondaryItems: navSecondary,
        };
      case "BUSINESS_OWNER":
        return {
          navMain: businessNav,
          navSecondaryItems: navSecondary,
        };
      case "EVENT_CREATOR":
        return {
          navMain: creatorNav,
          navSecondaryItems: creatorNavSecondary,
        };
      default:
        return {
          navMain: [],
          navSecondaryItems: navSecondary,
        };
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
                <Loader2 className="animate-spin" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  {dashboardTitle}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email,
            avatar: user.avatarUrl || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
