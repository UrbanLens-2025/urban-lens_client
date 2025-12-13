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
  IconBuildingPlus,
  IconLayout,
} from '@tabler/icons-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavMain } from './NavMain';
import { NavSecondary } from './NavSecondary';
import { NavUser } from './NavUser';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/user/useUser';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';

const adminOverview = [{ title: 'Overview', url: '/admin', icon: IconLayout }];

const adminNavGroups = [
  {
    groupLabel: 'User Management',
    items: [{ title: 'Accounts', url: '/admin/accounts', icon: IconUsers }],
  },
  {
    groupLabel: 'Content Management',
    items: [
      { title: 'Locations', url: '/admin/locations', icon: IconMapPin },
      {
        title: 'Public new Location',
        url: '/admin/locations/create',
        icon: IconBuildingPlus,
      },
      { title: 'Events', url: '/admin/events', icon: IconCalendar },
      // { title: 'Tags', url: '/admin/tags', icon: IconTag },
    ],
  },
  {
    groupLabel: 'Review Requests',
    items: [
      {
        title: 'Location Requests',
        url: '/admin/location-requests',
        icon: IconClipboardList,
      },
      {
        title: 'Business Registrations',
        url: '/admin/business',
        icon: IconBriefcase,
      },
      { title: 'Reports', url: '/admin/reports', icon: IconFlag },
    ],
  },
  {
    groupLabel: 'Financial',
    items: [
      { title: 'Wallet', url: '/admin/wallet', icon: IconWallet },
      {
        title: 'Withdraw Requests',
        url: '/admin/wallet/withdraw-requests',
        icon: IconFileText,
      },
    ],
  },
  {
    groupLabel: 'System Settings',
    items: [
      {
        title: 'Scheduled Jobs',
        url: '/admin/system/scheduled-jobs',
        icon: IconClock,
      },
      {
        title: 'System Config Table',
        url: '/admin/system/configuration',
        icon: IconSettings,
      },
    ],
  },
];

const getBusinessOverview = () => [
  { title: 'Overview', url: '/dashboard/business', icon: IconLayout },
  {
    title: 'Add location',
    url: '/dashboard/business/locations/create',
    icon: IconPlus,
  },
  {
    title: 'My Locations',
    url: '/dashboard/business/locations',
    icon: IconMapPin,
  },
  { title: 'Wallet', url: '/dashboard/business/wallet', icon: IconWallet },
];

const businessNavGroups = [
  {
    groupLabel: 'Requests',
    items: [
      {
        title: 'Location Requests',
        url: '/dashboard/business/location-requests',
        icon: IconClipboardList,
      },
      {
        title: 'Location Bookings',
        url: '/dashboard/business/location-bookings',
        icon: IconBrandBooking,
      },
    ],
  },
];

const getCreatorNav = () => [
  { title: 'Overview', url: '/dashboard/creator', icon: IconLayout },
  {
    title: 'Create event',
    url: '/dashboard/creator/request/create',
    icon: IconPlus,
  },
  { title: 'My Events', url: '/dashboard/creator/events', icon: IconCalendar },
  { title: 'Wallet', url: '/dashboard/creator/wallet', icon: IconWallet },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();

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

  const navMain = React.useMemo(() => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN': {
        // Flatten all groups into a single array
        const allItems = [
          ...adminOverview,
          ...adminNavGroups.flatMap((group) => group.items),
        ];
        return allItems;
      }
      case 'BUSINESS_OWNER': {
        // Flatten all groups into a single array
        const allItems = [
          ...getBusinessOverview(),
          ...businessNavGroups.flatMap((group) => group.items),
        ];
        return allItems;
      }
      case 'EVENT_CREATOR':
        return getCreatorNav();
      default:
        return [];
    }
  }, [user]);

  const navSecondary = React.useMemo(() => {
    if (!user) {
      return [{ title: 'Toggle theme', url: '#theme-toggle', icon: IconHelp }];
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
      <SidebarHeader className='border-b border-sidebar-border/60'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.push(dashboardUrl)}
              tooltip={dashboardTitle}
              className={cn(
                'data-[slot=sidebar-menu-button]:!p-3 transition-all duration-300 hover:bg-sidebar-accent/60 rounded-lg group/header',
                'group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:justify-center'
              )}
            >
              <div className='flex items-center gap-3 group-data-[collapsible=icon]:justify-center'>
                <div
                  className={cn(
                    'flex items-center justify-center rounded-lg bg-sidebar-primary/10 group-hover/header:bg-sidebar-primary/20 transition-colors duration-300',
                    'size-8 group-data-[collapsible=icon]:size-9'
                  )}
                >
                  <IconInnerShadowTop
                    className={cn(
                      'text-sidebar-primary transition-transform duration-300 group-hover/header:scale-110',
                      'size-4 group-data-[collapsible=icon]:size-5'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-base font-semibold tracking-tight transition-all duration-300 text-sidebar-foreground',
                    'group-data-[collapsible=icon]:hidden'
                  )}
                >
                  {dashboardTitle}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='gap-1 py-2'>
        {navMain.length > 0 && <NavMain items={navMain} />}
        <NavSecondary items={navSecondary} className='mt-auto pt-2' />
      </SidebarContent>
      <SidebarFooter className='border-t border-sidebar-border/60 bg-sidebar/50 backdrop-blur-sm'>
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
