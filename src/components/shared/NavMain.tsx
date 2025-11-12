"use client";

import { type Icon } from "@tabler/icons-react";

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
                    "transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  {item.icon && (
                    <item.icon 
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isActive && "scale-110"
                      )} 
                    />
                  )}
                  <span className="transition-all duration-200">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
