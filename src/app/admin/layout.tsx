"use client";

import { useUser } from "@/hooks/user/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, LayoutDashboard, MapPin, Building2 } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user?.role !== 'ADMIN') {
            router.replace('/');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin"/></div>;
    }
    
    return (
        <div className="flex min-h-screen">
            <aside className="w-64 border-r bg-gray-100 p-4">
                <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
                <nav className="flex flex-col gap-2">
                    <Link href="/admin" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
                        <LayoutDashboard className="h-4 w-4"/> Dashboard
                    </Link>
                     <Link href="/admin/locations" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
                        <MapPin className="h-4 w-4"/> Manage Locations
                    </Link>
                     <Link href="/admin/business" className="flex items-center gap-2 p-2 rounded hover:bg-gray-200">
                        <Building2 className="h-4 w-4"/> Manage Businesses
                    </Link>
                </nav>
            </aside>
            <main className="flex-1 p-8 bg-muted/40">
                {children}
            </main>
        </div>
    );
}