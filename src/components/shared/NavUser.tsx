'use client';

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from '@tabler/icons-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/user/useUser';
import { deregisterDevice } from '@/api/notifications';
import { getFCMToken } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile, state } = useSidebar();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user: currentUser } = useUser();

  const logout = async () => {
    // Deregister FCM token before logging out
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await deregisterDevice({ token: fcmToken });
      }
    } catch (error) {
      console.error('Failed to deregister FCM device:', error);
    }

    localStorage.removeItem('token');
    queryClient.clear();
    router.push('/login');
  };

  const getNotificationsUrl = () => {
    if (currentUser?.role === 'BUSINESS_OWNER') {
      return '/dashboard/business/notifications';
    } else if (currentUser?.role === 'EVENT_CREATOR') {
      return '/dashboard/creator/notifications';
    }
    return '#';
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              tooltip={
                state === 'collapsed'
                  ? `${user.name} - ${user.email}`
                  : undefined
              }
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-lg mx-1 transition-all duration-300 hover:bg-sidebar-accent/60 group/user group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-2 !px-3 !py-3'
            >
              <div className='flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center'>
                <div className='relative'>
                  <Avatar
                    className={cn(
                      'rounded-lg ring-2 ring-sidebar-border group-hover/user:ring-sidebar-primary/40 transition-all duration-300',
                      'h-9 w-9 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10'
                    )}
                  >
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className='rounded-lg bg-sidebar-primary/10 text-sidebar-primary font-semibold'>
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='absolute -bottom-0.5 -right-0.5 z-10 size-2.5 rounded-full bg-green-500 ring-2 ring-sidebar group-data-[collapsible=icon]:size-2' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden'>
                  <span className='truncate font-semibold text-sidebar-foreground'>
                    {user.name}
                  </span>
                  <span className='text-sidebar-foreground/60 truncate text-xs'>
                    {user.email}
                  </span>
                </div>
                <IconDotsVertical className='ml-auto size-4 text-sidebar-foreground/50 group-hover/user:text-sidebar-foreground transition-colors duration-300 group-data-[collapsible=icon]:hidden' />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg shadow-lg border-sidebar-border/50'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={8}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-3 px-3 py-3 text-left'>
                <Avatar className='h-10 w-10 rounded-lg ring-2 ring-sidebar-border'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-lg bg-sidebar-primary/10 text-sidebar-primary font-semibold'>
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight min-w-0'>
                  <span className='truncate font-semibold'>{user.name}</span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className='my-1' />
            <DropdownMenuGroup>
              <DropdownMenuItem className='cursor-pointer transition-colors duration-200 hover:bg-sidebar-accent/50'>
                <IconUserCircle className='size-4 mr-2' />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer transition-colors duration-200 hover:bg-sidebar-accent/50'>
                <IconCreditCard className='size-4 mr-2' />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = getNotificationsUrl();
                  if (url !== '#') {
                    router.push(url);
                  }
                }}
                className='cursor-pointer transition-colors duration-200 hover:bg-sidebar-accent/50'
              >
                <IconNotification className='size-4 mr-2' />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className='my-1' />
            <DropdownMenuItem
              onClick={logout}
              className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors duration-200'
            >
              <IconLogout className='size-4 mr-2' />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
