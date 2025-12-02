"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"
import { MoonIcon, SunIcon } from 'lucide-react'
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

            const isActive =
              item.url !== '#theme-toggle' && pathname.startsWith(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 transition-transform duration-200" />
                    <span className="transition-all duration-200 flex-1 text-left">
                      {item.title}
                    </span>
                    {item.badge}
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
