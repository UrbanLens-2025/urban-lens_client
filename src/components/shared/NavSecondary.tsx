"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
    badge?: ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { setTheme, resolvedTheme } = useTheme()
  const pathname = usePathname()

  const toggleTheme = React.useCallback((checked: boolean) => {
    setTheme(checked ? 'dark' : 'light')
  }, [setTheme])

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <div className="px-2 py-1.5 mb-1 group-data-[collapsible=icon]:hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/60 to-transparent" />
        </div>
        <SidebarMenu>
          {items.map((item) => {
            // Special handling for theme toggle
            if (item.url === '#theme-toggle') {
              const isDark = resolvedTheme === 'dark'
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => toggleTheme(!isDark)}
                    className={cn(
                      "relative transition-all duration-300 ease-out rounded-lg mx-1 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground w-full group/theme group-data-[collapsible=icon]:justify-center"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                      {isDark ? (
                        <Moon className="size-4 text-sidebar-foreground/70 group-hover/theme:text-sidebar-foreground transition-all duration-300 group-data-[collapsible=icon]:size-5" />
                      ) : (
                        <Sun className="size-4 text-sidebar-foreground/70 group-hover/theme:text-sidebar-foreground transition-all duration-300 group-data-[collapsible=icon]:size-5" />
                      )}
                      <span className="transition-all duration-300 text-sidebar-foreground/80 group-hover/theme:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            const isActive =
              item.url !== '#theme-toggle' && pathname.startsWith(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
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
                  <Link href={item.url} className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                    <item.icon className={cn(
                      "h-4 w-4 transition-all duration-300",
                      "group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5",
                      isActive 
                        ? "text-sidebar-primary scale-110" 
                        : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                    )} />
                    <span className={cn(
                      "transition-all duration-300 flex-1 text-left",
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
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
