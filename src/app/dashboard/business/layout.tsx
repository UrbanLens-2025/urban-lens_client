"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, MapPin, Star, Settings } from "lucide-react";

const sidebarNavItems = [
  { title: "Overview", href: "/dashboard/business", icon: Home },
  {
    title: "My Locations",
    href: "/dashboard/business/locations",
    icon: MapPin,
  },
  { title: "Reviews", href: "/dashboard/business/reviews", icon: Star },
  { title: "Settings", href: "/dashboard/business/settings", icon: Settings },
];

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="w-64 border-r bg-background hidden md:block fixed h-screen top-0 left-0">
        <div className="p-4">
          <h2 className="text-xl font-bold">Business Dashboard</h2>
        </div>
        <nav className="flex flex-col p-2">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === item.href && "bg-muted text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 md:pl-72">{children}</main>
    </div>
  );
}
