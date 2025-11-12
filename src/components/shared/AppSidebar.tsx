'use client';

import * as React from 'react';
import {
  IconBriefcase,
  IconCalendar,
  IconCalendarCheck,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconMapPin,
  IconSettings,
  IconTag,
  IconFileText,
  IconWallet,
  IconBrandBooking,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavMain } from './NavMain';
import { NavSecondary } from './NavSecondary';
import { NavUser } from './NavUser';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/user/useUser';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const adminNav = [
  { title: 'Overview', url: '/admin', icon: IconDashboard },
  { title: 'Locations', url: '/admin/locations', icon: IconMapPin },
  { title: 'Business', url: '/admin/business', icon: IconBriefcase },
  { title: 'Events', url: '/admin/events', icon: IconCalendar },
  { title: 'Wallet', url: '/admin/wallet', icon: IconWallet },
  { title: 'Tags', url: '/admin/tags', icon: IconTag },
];

const businessNav = [
  { title: 'Overview', url: '/dashboard/business', icon: IconDashboard },
  {
    title: 'My Locations',
    url: '/dashboard/business/locations',
    icon: IconMapPin,
  },
  { title: "Location Bookings", url: "/dashboard/business/location-bookings", icon: IconBrandBooking },
  { title: "Wallet", url: "/dashboard/business/wallet", icon: IconWallet },
];

const creatorNav = [
  { title: "Overview", url: "/dashboard/creator", icon: IconCalendar },
  { title: "My Events", url: "/dashboard/creator/events", icon: IconCalendar },
  { title: "Event Requests", url: "/dashboard/creator/request", icon: IconCalendarCheck },
  { title: "Wallet", url: "/dashboard/creator/wallet", icon: IconWallet },
];

const navSecondary = [
  { title: 'Settings', url: '#', icon: IconSettings },
  { title: 'Get Help', url: '#', icon: IconHelp },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const dashboardTitle = React.useMemo(() => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Admin Dashboard';
      case 'BUSINESS_OWNER':
        return 'Business Dashboard';
      case 'EVENT_CREATOR':
        return 'Creator Dashboard';
      default:
        return 'Dashboard';
    }
  }, [user]);

  const dashboardUrl = React.useMemo(() => {
    switch (user?.role) {
      case 'ADMIN':
        return '/admin';
      case 'BUSINESS_OWNER':
        return '/dashboard/business';
      case 'EVENT_CREATOR':
        return '/dashboard/creator';
      default:
        return '/dashboard';
    }
  }, [user]);

  const { navMain } = React.useMemo(() => {
    if (!user) return { navMain: [] };

    switch (user.role) {
      case 'ADMIN':
        return {
          navMain: adminNav,
        };
      case 'BUSINESS_OWNER':
        return {
          navMain: businessNav,
        };
      case 'EVENT_CREATOR':
        return {
          navMain: creatorNav,
        };
      default:
        return {
          navMain: [],
        };
    }
  }, [user]);

  const isDashboardActive = pathname === dashboardUrl;

  if (isLoading || !user) {
    return (
      <Sidebar collapsible='icon' {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className='data-[slot=sidebar-menu-button]:!p-1.5'>
                <Loader2 className='animate-spin size-5' />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.push(dashboardUrl)}
              isActive={isDashboardActive}
              className={cn(
                "data-[slot=sidebar-menu-button]:!p-2 transition-all duration-200",
                isDashboardActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                  : "hover:bg-sidebar-accent/50"
              )}
            >
              <IconInnerShadowTop className={cn(
                "!size-5 transition-transform duration-200",
                isDashboardActive && "scale-110"
              )} />
              <span className='text-base font-semibold transition-all duration-200'>
                {dashboardTitle}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-2">
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50">
        <NavUser
          user={{
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email,
            avatar: user.avatarUrl || '',
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
