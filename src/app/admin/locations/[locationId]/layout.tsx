"use client";

import type React from "react";
import { use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocationByIdForAdmin } from "@/hooks/admin/useLocationByIdForAdmin";
import {
  Loader2,
  ArrowLeft,
  Layers,
  Edit,
  Building,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function AdminLocationDetailLayoutContent({
  locationId,
  children,
}: {
  locationId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: location, isLoading, isError } = useLocationByIdForAdmin(locationId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading location details</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const isEditPage = pathname.includes("/edit");
  const activeTab = isEditPage ? "edit" : "overview";

  const handleTabChange = (value: string) => {
    if (value === "overview") {
      router.push(`/admin/locations/${locationId}`);
    } else if (value === "edit") {
      router.push(`/admin/locations/${locationId}/edit`);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2 break-words">{location.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant="outline" className="text-sm px-3 py-1">
                {location.ownershipType === "OWNED_BY_BUSINESS" ? (
                  <>
                    <Building className="h-3 w-3 mr-1" /> Business Owned
                  </>
                ) : location.ownershipType === "PUBLIC_PLACE" ? (
                  <>
                    <Globe className="h-3 w-3 mr-1" /> Public Place
                  </>
                ) : (
                  "User Owned"
                )}
              </Badge>
              <Badge
                variant={location.isVisibleOnMap ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {location.isVisibleOnMap ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" /> Visible on Map
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" /> Hidden
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none">
          <TabsTrigger value="overview" className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-muted">
            <Layers className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2 rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-muted">
            <Edit className="h-4 w-4" />
            Edit Location
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Page Content */}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default function AdminLocationDetailLayout({
  params,
  children,
}: {
  params: Promise<{ locationId: string }>;
  children: React.ReactNode;
}) {
  const { locationId } = use(params);

  return (
    <AdminLocationDetailLayoutContent locationId={locationId}>
      {children}
    </AdminLocationDetailLayoutContent>
  );
}

