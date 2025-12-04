'use client';

import * as React from 'react';
import {
  IconBriefcase,
  IconCalendar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconMapPin,
  IconTag,
  IconFileText,
  IconWallet,
  IconBrandBooking,
  IconUsers,
  IconStar,
  IconClipboardList,
  IconPlus,
  IconBell,
  IconFlag,
  IconSettings,
  IconClock,
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
import { NavMainGrouped } from './NavMainGrouped';
import { NavSecondary } from './NavSecondary';
import { NavUser } from './NavUser';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/user/useUser';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';

const adminOverview = [
  { title: 'Overview', url: '/admin', icon: IconDashboard },
];

const adminNavGroups = [
  {
    groupLabel: 'User Management',
    items: [
      { title: 'All Accounts', url: '/admin/accounts', icon: IconUsers },
      { title: 'Creator Profiles', url: '/admin/creators', icon: IconStar },
    ]
  },
  {
    groupLabel: 'Content Management',
    items: [
      { title: 'Locations', url: '/admin/locations', icon: IconMapPin },
      { title: 'Add Public Location', url: '/admin/locations/create', icon: IconPlus },
      { title: 'Events', url: '/admin/events', icon: IconCalendar },
      { title: 'Tags', url: '/admin/tags', icon: IconTag },
    ]
  },
  {
    groupLabel: 'Review Requests',
    items: [
      { title: 'Location Requests', url: '/admin/location-requests', icon: IconClipboardList },
      { title: 'Business Registrations', url: '/admin/business', icon: IconBriefcase },
      { title: 'Reports', url: '/admin/reports', icon: IconFlag },
      { title: 'Wallet Withdrawals', url: '/admin/wallet-withdrawals', icon: IconWallet },
    ]
  },
  {
    groupLabel: 'Financial',
    items: [
      { title: 'Wallet', url: '/admin/wallet', icon: IconWallet },
      { title: 'External Transactions', url: '/admin/wallet/external-transactions', icon: IconFileText },
    ]
  },
  {
    groupLabel: 'System Settings',
    items: [
      { title: 'Scheduled Jobs', url: '/admin/system/scheduled-jobs', icon: IconClock },
    ]
  },
];

const getBusinessOverview = () => [
  { title: 'Overview', url: '/dashboard/business', icon: IconDashboard },
  { title: 'Add location', url: '/dashboard/business/locations/create', icon: IconPlus },
  { title: 'My Locations', url: '/dashboard/business/locations', icon: IconMapPin },
  { title: 'Wallet', url: '/dashboard/business/wallet', icon: IconWallet },
];

const businessNavGroups = [
  {
    groupLabel: 'Requests',
    items: [
      { title: 'Location Requests', url: '/dashboard/business/location-requests', icon: IconClipboardList },
      { title: 'Location Bookings', url: '/dashboard/business/location-bookings', icon: IconBrandBooking },
    ]
  },
];

const getCreatorNav = () => [
  { title: "Overview", url: "/dashboard/creator", icon: IconCalendar },
  { title: "Create event", url: "/dashboard/creator/request/create", icon: IconPlus },
  { title: "My Events", url: "/dashboard/creator/events", icon: IconCalendar },
  { title: "Wallet", url: "/dashboard/creator/wallet", icon: IconWallet },
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

  const { navMain, navOverview, navGroups } = React.useMemo(() => {
    if (!user) return { navMain: [], navOverview: [], navGroups: [] };

    switch (user.role) {
      case 'ADMIN':
        return {
          navMain: [],
          navOverview: adminOverview,
          navGroups: adminNavGroups,
        };
      case 'BUSINESS_OWNER':
        return {
          navMain: [],
          navOverview: getBusinessOverview(),
          navGroups: businessNavGroups,
        };
      case 'EVENT_CREATOR':
        return {
          navMain: getCreatorNav(),
          navOverview: [],
          navGroups: [],
        };
      default:
        return {
          navMain: [],
          navOverview: [],
          navGroups: [],
        };
    }
  }, [user]);

  const navSecondary = React.useMemo(() => {
    if (!user) {
      return [
        { title: 'Toggle theme', url: '#theme-toggle', icon: IconHelp },
      ];
    }

    switch (user.role) {
      case 'BUSINESS_OWNER':
        return [
          {
            title: 'Notifications',
            url: '/dashboard/business/notifications',
            icon: IconBell,
            badge: <NotificationBadge />,
          },
          { title: 'Toggle theme', url: '#theme-toggle', icon: IconHelp },
        ];
      case 'EVENT_CREATOR':
        return [
          {
            title: 'Notifications',
            url: '/dashboard/creator/notifications',
            icon: IconBell,
            badge: <NotificationBadge />,
          },
          { title: 'Toggle theme', url: '#theme-toggle', icon: IconHelp },
        ];
      case 'ADMIN':
      default:
        return [
          { title: 'Toggle theme', url: '#theme-toggle', icon: IconHelp },
        ];
    }
  }, [user]);

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
              className={cn(
                "data-[slot=sidebar-menu-button]:!p-2 transition-all duration-200 hover:bg-sidebar-accent/50"
              )}
            >
              <IconInnerShadowTop className={cn(
                "!size-5 transition-transform duration-200"
              )} />
              <span className='text-base font-semibold transition-all duration-200'>
                {dashboardTitle}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {navOverview.length > 0 && <NavMain items={navOverview} />}
        {navGroups.length > 0 ? (
          <NavMainGrouped groups={navGroups} />
        ) : (
          <NavMain items={navMain} />
        )}
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
