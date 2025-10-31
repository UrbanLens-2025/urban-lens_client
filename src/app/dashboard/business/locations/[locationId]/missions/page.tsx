"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocationMissions } from "@/hooks/missions/useLocationMissions";
import { LocationMission, SortState } from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  PlusCircle,
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { useDeleteLocationMission } from "@/hooks/missions/useDeleteLocationMission";

function MissionActions({
  mission,
  onDeleteClick,
}: {
  mission: LocationMission;
  onDeleteClick: () => void;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}`}
          >
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}/edit`}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDeleteClick} className="text-red-500">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ManageMissionsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });

  const [missionToDelete, setMissionToDelete] = useState<LocationMission | null>(null);

  const {
    data: response,
    isLoading,
    isError,
  } = useLocationMissions({
    locationId,
    page,
    sortBy: `${sort.column}:${sort.direction}`,
    search: debouncedSearchTerm,
  });

  const { mutate: deleteMission, isPending: isDeleting } = useDeleteLocationMission(locationId);

  const missions = response?.data || [];
  const meta = response?.meta;

  const getStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    if (new Date(startDate) > now)
      return <Badge variant="outline">Scheduled</Badge>;
    if (new Date(endDate) < now)
      return <Badge variant="secondary">Completed</Badge>;
    return <Badge className="bg-green-600">Active</Badge>;
  };

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === "DESC"
          ? "ASC"
          : "DESC",
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const onConfirmDelete = () => {
    if (!missionToDelete) return;
    deleteMission(missionToDelete.id, {
      onSuccess: () => {
        setMissionToDelete(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-3xl font-bold">Manage Missions</h1>
        </div>
        <Link
          href={`/dashboard/business/locations/${locationId}/missions/create`}
        >
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Mission
          </Button>
        </Link>
      </div>

      {/* --- Bảng Danh sách --- */}
      <Card>
        <CardHeader>
          <CardTitle>All Missions ({meta?.totalItems || 0})</CardTitle>
          <CardDescription>
            Create and manage challenges for this location. Showing page{" "}
            {meta?.currentPage} of {meta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search missions by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !response ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500 py-12">
              Failed to load missions.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("title")}>
                      Title <SortIcon column="title" />
                    </Button>
                  </TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("target")}
                    >
                      Target <SortIcon column="target" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("reward")}
                    >
                      Reward <SortIcon column="reward" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.length > 0 ? (
                  missions.map((mission) => (
                    <TableRow key={mission.id}>
                      <TableCell className="font-medium">
                        {mission.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {mission.metric}
                      </TableCell>
                      <TableCell>{mission.target}</TableCell>
                      <TableCell>{mission.reward} pts</TableCell>
                      <TableCell>
                        {getStatus(mission.startDate, mission.endDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <MissionActions 
                          mission={mission} 
                          onDeleteClick={() => setMissionToDelete(mission)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No missions found for this location.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={!meta || meta.currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={!meta || meta.currentPage >= meta.totalPages}
        >
          Next
        </Button>
      </div>

      <AlertDialog open={!!missionToDelete} onOpenChange={() => setMissionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this mission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mission: 
              <strong className="ml-1">&quot;{missionToDelete?.title}&quot;</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={isDeleting} >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Yes, Delete Mission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
