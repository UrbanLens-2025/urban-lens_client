"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            // Special handling for theme toggle
            if (item.url === '#theme-toggle') {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground w-full"
                    onClick={toggleTheme}
                  >
                    <SunIcon className="h-4 w-4 hidden dark:block transition-transform duration-200" />
                    <MoonIcon className="h-4 w-4 block dark:hidden transition-transform duration-200" />
                    <span className="transition-all duration-200">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                >
                  <a href={item.url} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 transition-transform duration-200" />
                    <span className="transition-all duration-200">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
