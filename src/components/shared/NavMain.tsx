'use client';

import { type Icon } from '@tabler/icons-react';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const ROOT_ROUTES = ['/dashboard/business', '/dashboard/creator', '/admin'];
const EXCLUDED_PATHS = ['/create', '/edit', '/new'];

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    badge?: ReactNode;
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isItemActive = (url: string) => {
    if (pathname === url) return true;
    if (ROOT_ROUTES.includes(url)) return false;

    const hasExcludedPath = EXCLUDED_PATHS.some(
      (path) => pathname.includes(path) && !url.includes(path)
    );

    return !hasExcludedPath && pathname.startsWith(`${url}/`);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = isItemActive(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => router.push(item.url)}
                  isActive={isActive}
                  className={cn(
                    'relative m-1 rounded-lg transition-all duration-200',
                    'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
                    'before:w-1 before:rounded-r-full before:transition-all before:duration-200',
                    'group-data-[collapsible=icon]:before:hidden group-data-[collapsible=icon]:justify-center',
                    isActive
                      ? 'bg-gradient-to-r from-sidebar-accent to-sidebar-accent/80 text-sidebar-accent-foreground font-semibold shadow-lg shadow-sidebar-primary/10 before:bg-sidebar-primary before:h-10'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:shadow-sm before:h-0 hover:before:h-6 hover:before:bg-sidebar-primary/50'
                  )}
                >
                  {item.icon && (
                    <item.icon
                      className={cn(
                        'transition-all duration-200',
                        'group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5',
                        isActive
                          ? 'h-[1.1rem] w-[1.1rem] text-sidebar-primary drop-shadow-sm'
                          : 'h-4 w-4 text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90'
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      'transition-all duration-200 group-data-[collapsible=icon]:hidden',
                      isActive && 'tracking-wide'
                    )}
                  >
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className='group-data-[collapsible=icon]:hidden ml-auto'>
                      {item.badge}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
