"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Clock,
  Filter,
  Flag,
  ImageIcon,
  User,
  Search,
  RefreshCw,
  Gavel,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReports } from "@/hooks/admin/useReports";
import { useMarkReportFirstSeen } from "@/hooks/admin/useMarkReportFirstSeen";
import { useUser } from "@/hooks/user/useUser";
import { useProcessReportsNoAction } from "@/hooks/admin/useProcessReportsNoAction";
import { useProcessReportsMalicious } from "@/hooks/admin/useProcessReportsMalicious";
import { useBanPostPenalty } from "@/hooks/admin/useBanPostPenalty";
import { useWarnUserPenalty } from "@/hooks/admin/useWarnUserPenalty";
import { useProcessReportsTicketRefund } from "@/hooks/admin/useProcessReportsTicketRefund";
import { Report, ReportStatus, ReportTargetType } from "@/types";
import LoadingCustom from "@/components/shared/LoadingCustom";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const [resolutionAction, setResolutionAction] = useState<string>("no_action");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMaliciousModalOpen, setIsMaliciousModalOpen] = useState(false);
  const [isAddPenaltyModalOpen, setIsAddPenaltyModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [penaltyAction, setPenaltyAction] = useState<"ban_post" | "warn_user">(
    targetType === "post" ? "ban_post" : "warn_user"
  );
  const [penaltyReason, setPenaltyReason] = useState("");
  const [noActionReason, setNoActionReason] = useState("");
  const [maliciousReason, setMaliciousReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundPercentage, setRefundPercentage] = useState<string>("0");
  const [shouldCancelTickets, setShouldCancelTickets] = useState<boolean>(true);

  const {
    data: reportsData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useReports({
    page: 1,
    limit: 100,
    targetType,
    targetId,
    sortBy: "createdAt:DESC",
    status: statusFilter,
  });

  const { mutate: markFirstSeen } = useMarkReportFirstSeen();
  const { mutate: processNoAction, isPending: isProcessingNoAction } = useProcessReportsNoAction();
  const { mutate: processMalicious, isPending: isProcessingMalicious } = useProcessReportsMalicious();
  const { mutate: banPostPenalty, isPending: isBanningPost } = useBanPostPenalty();
  const { mutate: warnUserPenalty, isPending: isWarningUser } = useWarnUserPenalty();
  const { mutate: processTicketRefund, isPending: isProcessingRefund } = useProcessReportsTicketRefund();
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

  const getResolutionLabel = (action?: string | null) => {
    if (!action) return "Resolution";
    const normalized = action.toUpperCase();
    if (normalized === "NO_ACTION_TAKEN") return "No action taken";
    if (normalized === "MALICIOUS_REPORT") return "Malicious report";
    if (normalized === "CANCEL_EVENT") return "Event cancelled";
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/(^|\\s)\\S/g, (t) => t.toUpperCase());
  };

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
              <SelectItem value="no_action" className="text-xs py-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>No action</span>
                </div>
              </SelectItem>
              <SelectItem value="malicious_report" className="text-xs py-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Mark as malicious</span>
                </div>
              </SelectItem>
              {targetType === "event" && (
                <SelectItem value="ticket_refund" className="text-xs py-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-600" />
                    <span>Refund ticket</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (selectedReportIds.size === 0) return;
              if (resolutionAction === "no_action") {
                setIsConfirmModalOpen(true);
              } else if (resolutionAction === "malicious_report") {
                setIsMaliciousModalOpen(true);
              } else if (resolutionAction === "ticket_refund" && targetType === "event") {
                setIsRefundModalOpen(true);
              }
            }}
            disabled={selectedReportIds.size === 0 || !resolutionAction}
            className="px-3 text-xs"
          >
            Apply
          </Button>
          <Separator
            orientation="vertical"
            className="mx-1 bg-border border-2 h-8"
          />
          <Button
            variant="destructive"
            className="px-3 text-xs gap-2"
            onClick={() => setIsAddPenaltyModalOpen(true)}
          >
            <Gavel className="h-4 w-4" />
            Add Penalty
          </Button>
        </div>
      </div>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm no action</DialogTitle>
            <DialogDescription>
              Provide a reason for taking no action on the selected reports.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={noActionReason}
              onChange={(e) => setNoActionReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={4}
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isProcessingNoAction}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedReportIds.size === 0) {
                  setIsConfirmModalOpen(false);
                  return;
                }
                processNoAction(
                  {
                    reportIds: Array.from(selectedReportIds),
                    reason: noActionReason || "No action taken",
                  },
                  {
                    onSuccess: () => {
                      setIsConfirmModalOpen(false);
                      setNoActionReason("");
                      setSelectedReportIds(new Set());
                    },
                  }
                );
              }}
              disabled={isProcessingNoAction}
            >
              {isProcessingNoAction ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TicketRefundDialog
        open={isRefundModalOpen}
        onOpenChange={setIsRefundModalOpen}
        refundReason={refundReason}
        refundPercentage={refundPercentage}
        shouldCancelTickets={shouldCancelTickets}
        onRefundReasonChange={setRefundReason}
        onRefundPercentageChange={setRefundPercentage}
        onShouldCancelTicketsChange={setShouldCancelTickets}
        isProcessingRefund={isProcessingRefund}
        selectedCount={selectedReportIds.size}
        targetType={targetType}
        onConfirm={(payload) =>
          processTicketRefund(
            {
              reportIds: Array.from(selectedReportIds),
              reason: payload.reason,
              refundPercentage: payload.refundPercentage,
              shouldCancelTickets: payload.shouldCancelTickets,
            },
            {
              onSuccess: () => {
                setIsRefundModalOpen(false);
                setRefundReason("");
                setRefundPercentage("0");
                setShouldCancelTickets(true);
                setSelectedReportIds(new Set());
              },
            }
          )
        }
      />

      <Dialog open={isMaliciousModalOpen} onOpenChange={setIsMaliciousModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as malicious</DialogTitle>
            <DialogDescription>
              Provide a reason for marking the selected reports as malicious.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={maliciousReason}
              onChange={(e) => setMaliciousReason(e.target.value)}
              placeholder="Reason (required)"
              rows={4}
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaliciousModalOpen(false)}
              disabled={isProcessingMalicious}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedReportIds.size === 0) {
                  setIsMaliciousModalOpen(false);
                  return;
                }
                processMalicious(
                  {
                    reportIds: Array.from(selectedReportIds),
                    reason: maliciousReason || "Marked as malicious",
                  },
                  {
                    onSuccess: () => {
                      setIsMaliciousModalOpen(false);
                      setMaliciousReason("");
                      setSelectedReportIds(new Set());
                    },
                  }
                );
              }}
              disabled={isProcessingMalicious || !maliciousReason.trim()}
            >
              {isProcessingMalicious ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddPenaltyDialog
        open={isAddPenaltyModalOpen}
        onOpenChange={setIsAddPenaltyModalOpen}
        penaltyAction={penaltyAction}
        onPenaltyActionChange={setPenaltyAction}
        penaltyReason={penaltyReason}
        onPenaltyReasonChange={setPenaltyReason}
        isBanningPost={isBanningPost}
        isWarningUser={isWarningUser}
        targetType={targetType}
        selectedCount={selectedReportIds.size}
        onConfirm={(payload) => {
          if (payload.type === "ban_post") {
            banPostPenalty(
              {
                targetEntityId: targetId,
                banReason: payload.reason,
              },
              {
                onSuccess: () => {
                  setPenaltyReason("");
                  setIsAddPenaltyModalOpen(false);
                },
              }
            );
          } else if (payload.type === "warn_user") {
            warnUserPenalty(
              {
                targetEntityId: targetId,
                targetEntityType: targetType,
                warningNote: payload.reason,
              },
              {
                onSuccess: () => {
                  setPenaltyReason("");
                  setIsAddPenaltyModalOpen(false);
                },
              }
            );
          }
        }}
      />

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
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search reports by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-2 text-xs"
                      onClick={() => refetchReports()}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
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
                              <div className="px-4 py-3 bg-muted border-b sticky top-0 cursor-pointer hover:bg-muted/80 transition-colors">
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
                                const hasResolution = Boolean(report.resolutionAction);

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
                                    {!hasResolution && (
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
                                    )}
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
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Badge
                                            variant={
                                              report.resolutionAction
                                                ? "outline"
                                                : report.status === "PENDING"
                                                  ? "secondary"
                                                  : "default"
                                            }
                                            className={`text-[10px] px-1.5 py-0 h-5 ${report.resolutionAction
                                              ? "bg-muted/40"
                                              : report.status === "PENDING"
                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                : "bg-green-500/10 text-green-600 border-green-500/20"}`}
                                          >
                                            {report.resolutionAction
                                              ? getResolutionLabel(report.resolutionAction)
                                              : report.status === "PENDING"
                                                ? "OPEN"
                                                : "CLOSED"}
                                          </Badge>
                                        </div>
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
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {!selectedReport.resolutionAction && (
                              <Checkbox
                                className="mt-1"
                                checked={selectedReportIds.has(selectedReport.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedReportIds((prev) => {
                                    const next = new Set(prev);
                                    if (checked) {
                                      next.add(selectedReport.id);
                                    } else {
                                      next.delete(selectedReport.id);
                                    }
                                    return next;
                                  });
                                }}
                              />
                            )}
                            <h2 className="text-xl font-bold leading-tight break-words">
                              {selectedReport.title}
                            </h2>
                          </div>
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

                    {/* Resolution + Reporter */}
                    <div className="mt-auto space-y-5">
                      {(selectedReport.resolutionAction || selectedReport.resolvedAt) && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Resolution
                          </h3>
                          <div className="flex items-center gap-3 text-sm flex-wrap">
                            <Badge variant="outline" className="bg-muted/40">
                              {getResolutionLabel(selectedReport.resolutionAction)}
                            </Badge>
                            {selectedReport.resolvedAt && (
                              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Resolved {formatReportDate(selectedReport.resolvedAt)}
                              </span>
                            )}
                          </div>
                          {(selectedReport.resolvedById || selectedReport.resolvedByType || selectedReport.resolvedBy) && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              Resolved by:&nbsp;
                              <span className="font-medium text-foreground">
                                {selectedReport.resolvedBy
                                  ? `${selectedReport.resolvedBy.firstName} ${selectedReport.resolvedBy.lastName}`
                                  : selectedReport.resolvedById}
                              </span>
                              {selectedReport.resolvedByType && (
                                <span className="text-muted-foreground">
                                  ({selectedReport.resolvedByType})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {(selectedReport.resolutionAction || selectedReport.resolvedAt) && (
                        <div className="border-t" />
                      )}

                      {/* Reporter - Always at bottom */}
                      {selectedReport.createdBy && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
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

type AddPenaltyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penaltyAction: "ban_post" | "warn_user";
  onPenaltyActionChange: (action: "ban_post" | "warn_user") => void;
  penaltyReason: string;
  onPenaltyReasonChange: (reason: string) => void;
  isBanningPost: boolean;
  isWarningUser: boolean;
  targetType: ReportTargetType;
  selectedCount: number;
  onConfirm: (payload: { type: "ban_post" | "warn_user"; reason: string }) => void;
};

const AddPenaltyDialog = memo(function AddPenaltyDialog({
  open,
  onOpenChange,
  penaltyAction,
  onPenaltyActionChange,
  penaltyReason,
  onPenaltyReasonChange,
  isBanningPost,
  isWarningUser,
  targetType,
  selectedCount,
  onConfirm,
}: AddPenaltyDialogProps) {
  const isBanDisabled =
    targetType !== "post" ||
    penaltyAction !== "ban_post" ||
    !penaltyReason.trim() ||
    selectedCount === 0 ||
    isBanningPost;

  const isWarningDisabled =
    penaltyAction !== "warn_user" ||
    !penaltyReason.trim() ||
    isWarningUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <Gavel className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogHeader className="p-0">
                <DialogTitle className="text-lg">Add Penalty</DialogTitle>
                <DialogDescription className="text-sm">
                  Choose an action and add a short note for why this post is being penalized.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="space-y-3">
            <Select
              value={penaltyAction}
              onValueChange={(val) => onPenaltyActionChange(val as "ban_post" | "warn_user")}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select a penalty action" />
              </SelectTrigger>
              <SelectContent>
                {targetType === "post" && (
                  <SelectItem value="ban_post" className="text-sm">
                    Ban post
                  </SelectItem>
                )}
                <SelectItem value="warn_user" className="text-sm">
                  Send warning
                </SelectItem>
              </SelectContent>
            </Select>

            {(penaltyAction === "ban_post" || penaltyAction === "warn_user") && (
              <Textarea
                value={penaltyReason}
                onChange={(e) => onPenaltyReasonChange(e.target.value)}
                placeholder={
                  penaltyAction === "ban_post"
                    ? "Add a brief ban reason for this post"
                    : "Add a brief warning note for this post"
                }
                rows={4}
              />
            )}
          </div>
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            size="sm"
            disabled={penaltyAction === "ban_post" ? isBanDisabled : isWarningDisabled}
            onClick={() => {
              if (penaltyAction === "ban_post") {
                if (isBanDisabled) return;
                onConfirm({ type: "ban_post", reason: penaltyReason.trim() });
                return;
              }
              if (penaltyAction === "warn_user") {
                if (isWarningDisabled) return;
                onConfirm({ type: "warn_user", reason: penaltyReason.trim() });
              }
            }}
          >
            {penaltyAction === "ban_post"
              ? isBanningPost
                ? "Saving..."
                : "Confirm"
              : isWarningUser
                ? "Sending..."
                : "Send warning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

type TicketRefundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refundReason: string;
  refundPercentage: string;
  shouldCancelTickets: boolean;
  onRefundReasonChange: (value: string) => void;
  onRefundPercentageChange: (value: string) => void;
  onShouldCancelTicketsChange: (value: boolean) => void;
  isProcessingRefund: boolean;
  selectedCount: number;
  targetType: ReportTargetType;
  onConfirm: (payload: {
    reason: string;
    refundPercentage: number;
    shouldCancelTickets: boolean;
  }) => void;
};

const TicketRefundDialog = memo(function TicketRefundDialog({
  open,
  onOpenChange,
  refundReason,
  refundPercentage,
  shouldCancelTickets,
  onRefundReasonChange,
  onRefundPercentageChange,
  onShouldCancelTicketsChange,
  isProcessingRefund,
  selectedCount,
  targetType,
  onConfirm,
}: TicketRefundDialogProps) {
  const parsedPercentage = Number(refundPercentage);
  const isInvalidPercentage =
    Number.isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100;
  const disabled =
    targetType !== "event" ||
    selectedCount === 0 ||
    isProcessingRefund ||
    !refundReason.trim() ||
    isInvalidPercentage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund ticket(s)</DialogTitle>
          <DialogDescription>
            Submit a refund request for the selected reports. Available for events only.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={refundReason}
            onChange={(e) => onRefundReasonChange(e.target.value)}
            placeholder="Reason for refund (required)"
            rows={4}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="refund-percentage" className="text-xs">
                Refund percentage
              </Label>
              <Input
                id="refund-percentage"
                type="number"
                min={0}
                max={100}
                step={1}
                value={refundPercentage}
                onChange={(e) => onRefundPercentageChange(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Enter a value between 0 and 100.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cancel tickets</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cancel-tickets"
                  checked={shouldCancelTickets}
                  onCheckedChange={(checked) => onShouldCancelTicketsChange(Boolean(checked))}
                />
                <Label htmlFor="cancel-tickets" className="text-sm">
                  Also cancel existing tickets
                </Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessingRefund}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onConfirm({
                reason: refundReason.trim(),
                refundPercentage: parsedPercentage,
                shouldCancelTickets,
              });
            }}
          >
            {isProcessingRefund ? "Submitting..." : "Confirm refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});


