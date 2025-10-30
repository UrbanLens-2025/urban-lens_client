"use client";

import { type Icon } from "@tabler/icons-react";
import { ChevronRight } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string;
    icon?: Icon;
    items?: {
      title: string;
      url: string;
      icon?: Icon;
    }[];
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const hasSubItems = item.items && item.items.length > 0;
            const isActive = item.url ? pathname === item.url : false;
            const isSubItemActive = hasSubItems && item.items?.some(subItem => pathname === subItem.url);

            if (hasSubItems) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isSubItemActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={`${
                          isSubItemActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/40"
                        }`}
                      >
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                onClick={() => router.push(subItem.url)}
                                className={`${
                                  isSubActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/40"
                                }`}
                              >
                                {subItem.icon && <subItem.icon className="mr-2 h-4 w-4" />}
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => item.url && router.push(item.url)}
                  className={`${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/40"
                  }`}
                >
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
