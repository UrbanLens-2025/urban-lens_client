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
    
    // For other pages, check if pathname starts with the URL
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
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition-colors">
                  <span>{group.groupLabel}</span>
                  <IconChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent className="transition-all duration-200 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <SidebarGroupContent>
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
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        );
      })}
    </>
  );
}

