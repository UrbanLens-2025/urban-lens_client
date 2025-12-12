"use client";

import { type Icon } from "@tabler/icons-react";
import { ReactNode } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  // Smart active state detection - checks if pathname starts with the URL
  // This highlights parent routes when on child pages
  const isItemActive = (url: string) => {
    if (pathname === url) return true;
    
    // For exact matches on root pages, only match exactly
    if (url === "/dashboard/business" || url === "/dashboard/creator" || url === "/admin") {
      return pathname === url;
    }
    
    // Exclude "create" pages from matching their parent routes
    // e.g., /dashboard/business/locations/create should not highlight "My Locations"
    const excludedChildRoutes = ["/create", "/edit", "/new"];
    const isExcludedChild = excludedChildRoutes.some(excluded => 
      pathname.includes(excluded) && !url.includes(excluded)
    );
    
    if (isExcludedChild) {
      return false;
    }
    
    // For other pages, check if pathname starts with the URL
    // This handles nested routes like /dashboard/business/locations/[locationId]
    return pathname.startsWith(url + "/") || pathname === url;
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
                    "relative transition-all duration-300 ease-out rounded-lg mx-1",
                    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:rounded-r-full before:transition-all before:duration-300",
                    "group-data-[collapsible=icon]:before:hidden group-data-[collapsible=icon]:justify-center",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm shadow-sidebar-accent/20 before:bg-sidebar-primary before:h-6"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground before:opacity-0 hover:before:opacity-100 hover:before:bg-sidebar-primary/40"
                  )}
                >
                  {item.icon && (
                    <item.icon 
                      className={cn(
                        "h-4 w-4 transition-all duration-300",
                        "group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5",
                        isActive 
                          ? "text-sidebar-primary scale-110" 
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                      )} 
                    />
                  )}
                  <span className={cn(
                    "transition-all duration-300",
                    "group-data-[collapsible=icon]:hidden",
                    isActive && "font-medium"
                  )}>
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="group-data-[collapsible=icon]:hidden">
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
