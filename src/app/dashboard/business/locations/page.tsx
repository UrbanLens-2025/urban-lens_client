"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  PlusCircle, 
  Search, 
  Eye,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import Link from "next/link";
import type { Location } from "@/types";

const getStatusLabel = (isVisible: boolean) => {
  return isVisible ? "Visible" : "Draft";
};

const getStatusIcon = (isVisible: boolean) => {
  return <Eye className="h-3 w-3" />;
};

const getStatusBadgeStyle = (isVisible: boolean) => {
  return isVisible
    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
    : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
};

export default function MyLocationsPage() {
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const { data: locationsData, isLoading, refetch } = useMyLocations(page, debouncedSearchTerm, {
    limit: 10,
    sortBy: "createdAt:DESC",
    searchBy: ["name", "addressLine", "description"],
  });

  const allLocations = locationsData?.data || [];
  const meta = locationsData?.meta;

  // Filter locations by visibility if visibility filter is set
  const locations = visibilityFilter === "all" 
    ? allLocations 
    : visibilityFilter === "visible"
    ? allLocations.filter((location) => location.isVisibleOnMap)
    : allLocations.filter((location) => !location.isVisibleOnMap);

  // Calculate statistics from actual data
  const stats = useMemo(() => {
    const totalCheckIns = allLocations.reduce((sum, loc) => sum + parseInt(loc.totalCheckIns || "0"), 0);
    
    return {
      totalLocations: meta?.totalItems ?? 0,
      visibleLocations: allLocations.filter((loc) => loc.isVisibleOnMap).length,
      hiddenLocations: allLocations.filter((loc) => !loc.isVisibleOnMap).length,
      totalCheckIns,
    };
  }, [allLocations, meta]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Locations</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your locations
          </p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/business/locations/create'}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Quick Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible on Map</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visibleLocations}</div>
            <p className="text-xs text-muted-foreground">Currently visible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hiddenLocations}</div>
            <p className="text-xs text-muted-foreground">Not visible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCheckIns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col h-full">
            {/* Search and Filter Section */}
            <div className="px-6 py-4 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by location name, address, or tags..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-2">
                  {/* Visibility Filter */}
                  <Select
                    value={visibilityFilter}
                    onValueChange={(value) => {
                      setVisibilityFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visibility</SelectItem>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Refresh Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      refetch();
                      setPage(1);
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto">
              {isLoading && !locationsData ? (
                <div className="text-center py-12">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground/50" />
                </div>
              ) : (
                <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="w-12 font-semibold pl-6">#</TableHead>
                  <TableHead className="font-semibold">Location Name</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="font-semibold">Tags</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 pl-6 pr-6">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <MapPin className="h-12 w-12 mb-4" />
                        <p className="font-medium">No locations found</p>
                        <p className="text-sm mt-2">
                          {debouncedSearchTerm
                            ? "Try adjusting your search terms"
                            : "Create your first location to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location: Location, index: number) => {
                    const rowNumber = ((meta?.currentPage || 1) - 1) * (meta?.itemsPerPage || 10) + index + 1;
                    const visibleTags = location.tags?.slice(0, 2) || [];
                    const remainingTagsCount = (location.tags?.length || 0) - visibleTags.length;
                    
                    return (
                      <TableRow key={location.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4 pl-6">
                          <span className="text-sm font-medium text-muted-foreground">
                            {rowNumber}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <Link href={`/dashboard/business/locations/${location.id}`} className="hover:underline">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-foreground hover:text-primary transition-colors">{location.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {location.id.substring(0, 8)}...
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex flex-col min-w-0 gap-0.5">
                              <span className="text-sm font-medium truncate">
                                {location.addressLine || "N/A"}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {[location.addressLevel2, location.addressLevel1].filter(Boolean).join(", ") || ""}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {location.tags && location.tags.length > 0 ? (
                              <>
                                {visibleTags.map((tag, tagIndex) => (
                                  <Badge
                                    key={tag.id || tagIndex}
                                    variant="secondary"
                                    className="text-xs border-0 font-medium"
                                    style={{ 
                                      backgroundColor: tag.color || 'hsl(var(--muted))', 
                                      color: '#fff' 
                                    }}
                                  >
                                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                    {tag.displayName}
                                  </Badge>
                                ))}
                                {remainingTagsCount > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1.5 py-0.5 font-medium"
                                  >
                                    +{remainingTagsCount}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">No tags</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {formatDate(location.createdAt)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(location.createdAt).split(',')[1]?.trim()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 pr-6">
                          <Badge 
                            variant="outline"
                            className={`${getStatusBadgeStyle(location.isVisibleOnMap)} flex items-center gap-1.5 w-fit font-medium`}
                          >
                            {getStatusIcon(location.isVisibleOnMap)}
                            {getStatusLabel(location.isVisibleOnMap)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
              )}
            </div>

            {/* Table Bottom Border and Pagination */}
            <div className="border-t">
              {meta && meta.totalPages > 1 && (
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((meta.currentPage - 1) * meta.itemsPerPage) + 1} to{" "}
                      {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)} of{" "}
                      {meta.totalItems} locations
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={!meta || meta.currentPage <= 1 || isLoading}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Page {meta.currentPage} of {meta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={!meta || meta.currentPage >= meta.totalPages || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
