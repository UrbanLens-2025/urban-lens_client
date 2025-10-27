"use client";

import { useUser } from "@/hooks/user/useUser";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Loader2,
  LayoutDashboard,
  MapPin,
  Building2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  {
    title: "Locations",
    href: "/admin/locations",
    icon: MapPin,
  },
  { title: "Business", href: "/admin/business", icon: Building2 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user?.role !== "ADMIN") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <aside className="w-64 border-r bg-background hidden md:block fixed h-screen top-0 left-0">
        <div className="p-4">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
        </div>
        <nav className="flex flex-col p-2">
          {sidebarNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 md:pl-72">{children}</main>
    </div>
  );
}
