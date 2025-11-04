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
  {
    title: 'My Location Requests',
    url: '/dashboard/business/locations/requests',
    icon: IconFileText,
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

  if (isLoading || !user) {
    return (
      <Sidebar collapsible='icon' {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className='data-[slot=sidebar-menu-button]:!p-1.5'>
                <Loader2 className='animate-spin' />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:!p-1.5'
            >
              <a href='#'>
                <IconInnerShadowTop className='!size-5' />
                <span className='text-base font-semibold'>
                  {dashboardTitle}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
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
