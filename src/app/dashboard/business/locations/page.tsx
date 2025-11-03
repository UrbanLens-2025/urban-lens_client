/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useMyLocations } from "@/hooks/locations/useMyLocations";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  PlusCircle,
  Loader2,
  Edit,
  Eye,
} from "lucide-react";
import { Location } from "@/types";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { DisplayTags } from "@/components/shared/DisplayTags";

function ActiveLocationActions({ location }: { location: Location }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/business/locations/${location.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/business/locations/${location.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Live Page
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MyLocationsPage() {
  const [activePage, setActivePage] = useState(1);
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(activeSearchTerm, 300);

  const { data: activeLocationsResponse, isLoading: isLoadingActive } =
    useMyLocations(activePage, debouncedSearchTerm);

  const activeLocations: Location[] = activeLocationsResponse?.data || [];
  const activeMeta = activeLocationsResponse?.meta;
  const isLoading = isLoadingActive;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Locations</h1>
          <p className="text-muted-foreground">
            Manage your active locations and track submissions.
          </p>
        </div>
        <Link href="/dashboard/business/locations/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Submit New Location
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Active Locations ({activeMeta?.totalItems || 0})
          </CardTitle>
          <CardDescription>
            Showing page {activeMeta?.currentPage} of {activeMeta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search by name..."
              value={activeSearchTerm}
              onChange={(e) => setActiveSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeLocations.length > 0 ? (
                activeLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      {location.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {location.description}
                    </TableCell>
                    <TableCell>
                      <DisplayTags tags={location.tags} maxCount={4} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ActiveLocationActions location={location} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No active locations.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage(activePage - 1)}
              disabled={!activeMeta || activeMeta.currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivePage(activePage + 1)}
              disabled={
                !activeMeta || activeMeta.currentPage >= activeMeta.totalPages
              }
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
