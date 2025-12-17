"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronDown,
  Filter,
  Flag,
  ImageIcon,
  User,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReports } from "@/hooks/admin/useReports";
import { useMarkReportFirstSeen } from "@/hooks/admin/useMarkReportFirstSeen";
import { useUser } from "@/hooks/user/useUser";
import { Report, ReportStatus, ReportTargetType } from "@/types";
import LoadingCustom from "@/components/shared/LoadingCustom";

type ReportsPanelProps = {
  targetId: string;
  targetType: ReportTargetType;
};

export function ReportsPanel({ targetId, targetType }: ReportsPanelProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<ReportStatus>("PENDING");
  const [resolutionAction, setResolutionAction] = useState<string>("");

  const { data: reportsData, isLoading: isLoadingReports } = useReports({
    page: 1,
    limit: 100,
    targetType,
    targetId,
    sortBy: "createdAt:DESC",
    status: statusFilter,
  });

  const { mutate: markFirstSeen } = useMarkReportFirstSeen();
  const { user: currentUser } = useUser();

  const groupedReports = useMemo(() => {
    if (!reportsData?.data) return {};

    const filteredReports = searchQuery.trim()
      ? reportsData.data.filter((report: Report) =>
          report.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : reportsData.data;

    return filteredReports.reduce((acc: Record<string, Report[]>, report: Report) => {
      const key = report.reportedReasonKey || "other";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(report);
      return acc;
    }, {});
  }, [reportsData, searchQuery]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId || !reportsData?.data) return null;
    return reportsData.data.find((r: Report) => r.id === selectedReportId) || null;
  }, [selectedReportId, reportsData]);

  const formatReportDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatReportDateOnly = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });


  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "??";

  return (
    <>
      {/* Action Bar */}
      <div className="bg-card border rounded-lg px-3 py-2 flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedReportIds.size === 0
              ? "Select reports to process"
              : `${selectedReportIds.size} ${selectedReportIds.size === 1 ? "report" : "reports"} selected`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedReportIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedReportIds(new Set())}
              className="text-xs text-muted-foreground hover:underline underline-offset-4"
            >
              × Clear
            </button>
          )}
          <Select value={resolutionAction} onValueChange={setResolutionAction}>
            <SelectTrigger className="h-6 px-3 text-xs py-0" size="sm">
              <SelectValue placeholder="Select action" className="text-xs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approve" className="text-xs py-1.5">Approve Report</SelectItem>
              <SelectItem value="reject" className="text-xs py-1.5">Reject Report</SelectItem>
              <SelectItem value="no_action" className="text-xs py-1.5">No Action</SelectItem>
              <SelectItem value="escalate" className="text-xs py-1.5">Escalate</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              // Mock - do nothing for now
            }}
            disabled={selectedReportIds.size === 0 || !resolutionAction}
            className="px-3 text-xs"
          >
            Apply
          </Button>
        </div>
      </div>

      <Card className="pt-0">
        <CardContent className="p-0">
          {isLoadingReports ? (
            <div className="flex items-center justify-center h-64">
              <LoadingCustom />
            </div>
          ) : (
            <div className="flex min-h-[500px]">
              {/* Left Panel - Reports List (1/3) */}
              <div className="w-1/3 border-r flex flex-col max-h-[600px]">
                {/* Search Bar */}
                <div className="p-4 border-b bg-background sticky top-0 z-10 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search reports by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2"
                        >
                          <Filter className="h-4 w-4" />
                          Filter
                          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                            {statusFilter === "PENDING" ? "OPEN" : "CLOSED"}
                          </Badge>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setStatusFilter("PENDING")}
                          className={statusFilter === "PENDING" ? "bg-muted" : ""}
                        >
                          OPEN
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setStatusFilter("CLOSED")}
                          className={statusFilter === "CLOSED" ? "bg-muted" : ""}
                        >
                          CLOSED
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {/* Reports List */}
                <div className="overflow-y-auto flex-1">
                  {!reportsData?.data || reportsData.data.length === 0 || Object.keys(groupedReports).length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground p-4">
                      <div className="text-center">
                        <Flag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No reports found</p>
                      </div>
                    </div>
                  ) : (
                    Object.entries(groupedReports).map(
                      ([reasonKey, reports]) => {
                        const displayName =
                          (reports as Report[])[0]?.reportedReasonEntity
                            ?.displayName || reasonKey;
                        const isExpanded = expandedReasons[reasonKey] ?? true;
                        return (
                          <Collapsible
                            key={reasonKey}
                            open={isExpanded}
                            onOpenChange={(open) =>
                              setExpandedReasons((prev) => ({
                                ...prev,
                                [reasonKey]: open,
                              }))
                            }
                          >
                            {/* Reason Header */}
                            <CollapsibleTrigger asChild>
                              <div className="px-4 py-3 bg-muted/50 border-b sticky top-0 cursor-pointer hover:bg-muted/70 transition-colors">
                                <div className="flex items-center gap-2">
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                                  />
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  <span className="font-medium text-sm">
                                    {displayName}
                                  </span>
                                  <Badge variant="secondary" className="ml-auto">
                                    {(reports as Report[]).length}
                                  </Badge>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            {/* Reports in this group */}
                            <CollapsibleContent>
                              {(reports as Report[]).map((report) => {
                                const isChecked = selectedReportIds.has(report.id);

                                const handleClick = () => {
                                  setSelectedReportId(report.id);
                                  const needsMark =
                                    !report.firstSeenAt || !report.firstSeenByAdminId;

                                  if (needsMark) {
                                    const optimisticFirstSeenAt = new Date().toISOString();
                                    const firstSeenByAdminId = currentUser?.id ?? null;
                                    markFirstSeen({
                                      reportId: report.id,
                                      firstSeenAt: optimisticFirstSeenAt,
                                      firstSeenByAdminId,
                                    });
                                  }
                                };

                                const handleCheckboxChange = (checked: boolean | string) => {
                                  const nextChecked = Boolean(checked);
                                  setSelectedReportIds((prev) => {
                                    const newSet = new Set(prev);
                                    if (nextChecked) {
                                      newSet.add(report.id);
                                    } else {
                                      newSet.delete(report.id);
                                    }
                                    return newSet;
                                  });
                                };

                                const isUnseen = !report.firstSeenAt;

                                return (
                                  <div
                                    key={report.id}
                                    onClick={handleClick}
                                    className={`px-4 py-3 border-b cursor-pointer transition-colors hover:bg-muted/50 flex items-start gap-3 ${selectedReportId === report.id ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
                                  >
                                    <div
                                      className="mt-0.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={handleCheckboxChange}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {isUnseen && (
                                            <Badge className="shrink-0 bg-sky-500/15 text-sky-700 border-sky-500/30 text-[10px] px-1.5 py-0 h-5">
                                              New
                                            </Badge>
                                          )}
                                          <h4 className="font-medium text-sm line-clamp-1 overflow-hidden flex-1">
                                            {report.title}
                                          </h4>
                                        </div>
                                        <Badge
                                          variant={
                                            report.status === "PENDING"
                                              ? "secondary"
                                              : "default"
                                          }
                                          className={`shrink-0 text-[10px] px-1.5 py-0 h-5 ${report.status === "PENDING"
                                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            : "bg-green-500/10 text-green-600 border-green-500/20"}`}
                                        >
                                          {report.status === "PENDING" ? "OPEN" : "CLOSED"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 overflow-hidden">
                                        {report.description}
                                      </p>
                                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <User className="h-3 w-3 shrink-0" />
                                          <span className="truncate">
                                            {report.createdBy?.firstName}{" "}
                                            {report.createdBy?.lastName}
                                          </span>
                                        </div>
                                        <span className="shrink-0">
                                          {formatReportDateOnly(report.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }
                    )
                  )}
                </div>
              </div>

              {/* Right Panel - Report Details (2/3) */}
              <div className="w-2/3 overflow-y-auto max-h-[600px]">
                {!reportsData?.data || reportsData.data.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground p-6">
                    <div className="text-center">
                      <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <Flag className="h-10 w-10 opacity-30" />
                      </div>
                      <p className="text-lg font-semibold text-foreground/70">
                        No reports found
                      </p>
                      <p className="text-sm mt-1 max-w-[200px] mx-auto">
                        There are no reports for this event
                      </p>
                    </div>
                  </div>
                ) : selectedReport ? (
                  <div className="p-6 flex flex-col h-full min-h-[600px]">
                    <div className="space-y-6 flex-1">
                      {/* Header with Status */}
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h2 className="text-xl font-bold leading-tight">
                            {selectedReport.title}
                          </h2>
                          <Badge
                            className={`shrink-0 ${selectedReport.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-green-500/10 text-green-600 border-green-500/20"}`}
                            variant="outline"
                          >
                            {selectedReport.status === "PENDING" ? "OPEN" : "CLOSED"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span>{selectedReport.reportedReasonEntity?.displayName}</span>
                          <span>•</span>
                          <span>{formatReportDate(selectedReport.createdAt)}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Report details
                        </h3>
                        <p className="text-sm leading-relaxed">
                          {selectedReport.description || "No description provided."}
                        </p>
                      </div>

                      {/* Attached Images */}
                      {selectedReport.attachedImageUrls && selectedReport.attachedImageUrls.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Attachments
                          </h3>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedReport.attachedImageUrls.map((url: string, index: number) => (
                              <div
                                key={index}
                                className="relative h-20 rounded-md overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(url, "_blank")}
                              >
                                {failedImages.has(url) ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-4 w-4 mb-0.5 opacity-50" />
                                    <span className="text-[10px]">Failed</span>
                                  </div>
                                ) : (
                                  <Image
                                    src={url}
                                    alt={`Attachment ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    onError={() => {
                                      setFailedImages((prev) => new Set(prev).add(url));
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t my-6" />

                    {/* Reporter - Always at bottom */}
                    {selectedReport.createdBy && (
                      <div className="mt-auto">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Reported By
                        </h3>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {selectedReport.createdBy.avatarUrl && (
                              <AvatarImage
                                src={selectedReport.createdBy.avatarUrl}
                                alt={`${selectedReport.createdBy.firstName} ${selectedReport.createdBy.lastName}`}
                              />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                              {getInitials(
                                selectedReport.createdBy.firstName,
                                selectedReport.createdBy.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {selectedReport.createdBy.firstName}{" "}
                              {selectedReport.createdBy.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedReport.createdBy.email}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="shrink-0 gap-2"
                          >
                            <Link
                              href={`/admin/reports?createdById=${selectedReport.createdBy.id}`}
                            >
                              History
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground p-6">
                    <div className="text-center">
                      <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <Flag className="h-10 w-10 opacity-30" />
                      </div>
                      <p className="text-lg font-semibold text-foreground/70">
                        Select a report
                      </p>
                      <p className="text-sm mt-1 max-w-[200px] mx-auto">
                        Choose a report from the list on the left to view its details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

