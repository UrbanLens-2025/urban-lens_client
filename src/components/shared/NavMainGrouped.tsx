"use client";

import { type Icon, IconChevronDown } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavGroup = {
  groupLabel: string;
  items: {
    title: string;
    url: string;
    icon?: Icon;
    description?: string;
  }[];
};

const STORAGE_KEY = "admin-sidebar-groups";

export function NavMainGrouped({ groups }: { groups: NavGroup[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  
  // Initialize collapse state from localStorage, default all to true (expanded)
  const [groupStates, setGroupStates] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    
    // Default all groups to expanded
    const defaultStates: Record<string, boolean> = {};
    groups.forEach((group) => {
      defaultStates[group.groupLabel] = true;
    });
    return defaultStates;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groupStates));
    }
  }, [groupStates]);

  // Smart active state detection - checks if pathname starts with the URL
  const isItemActive = (url: string) => {
    if (pathname === url) return true;
    
    // For exact matches on root pages, only match exactly
    if (url === "/admin") {
      return pathname === url;
    }
    
    // Exclude "create", "edit", and "new" pages from matching their parent routes
    // e.g., /admin/locations/create should not highlight "Locations"
    const excludedChildRoutes = ["/create", "/edit", "/new"];
    const isExcludedChild = excludedChildRoutes.some(excluded => 
      pathname.includes(excluded) && !url.includes(excluded)
    );
    
    if (isExcludedChild) {
      return false;
    }
    
    // For other pages, check if pathname starts with the URL
    // This handles nested routes like /admin/locations/[locationId]
    return pathname.startsWith(url + "/") || pathname === url;
  };

  const toggleGroup = (groupLabel: string) => {
    setGroupStates((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  // When sidebar is collapsed to icon mode, render all items flat with tooltips
  if (state === "collapsed") {
    const allItems = groups.flatMap((group) => group.items);
    
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {allItems.map((item) => {
              const isActive = isItemActive(item.url);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => router.push(item.url)}
                    isActive={isActive}
                    className={cn(
                      "relative transition-all duration-300 ease-out rounded-lg",
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
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // When sidebar is expanded, render grouped collapsible structure
  return (
    <>
      {groups.map((group) => {
        const isOpen = groupStates[group.groupLabel] ?? true;

        return (
          <Collapsible
            key={group.groupLabel}
            open={isOpen}
            onOpenChange={() => toggleGroup(group.groupLabel)}
            className="group/collapsible"
          >
            <SidebarGroup className="py-0">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent/60 rounded-lg px-3 py-2.5 mx-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground/80 transition-all duration-300 group/label group-data-[collapsible=icon]:hidden">
                  <span className="flex items-center gap-2">
                    <span className="h-0.5 w-3 bg-sidebar-primary/40 rounded-full group-hover/label:bg-sidebar-primary/60 transition-colors duration-300" />
                    {group.groupLabel}
                  </span>
                  <IconChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-all duration-300 text-sidebar-foreground/50 group-hover/label:text-sidebar-foreground/70",
                      isOpen && "rotate-180"
                    )}
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent className="transition-all duration-300 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <SidebarGroupContent className="pt-1">
                  <SidebarMenu>
                    {group.items.map((item) => {
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
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );
      })}
    </>
  );
}

