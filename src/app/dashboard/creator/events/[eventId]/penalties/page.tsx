"use client";

import { use, useState, useMemo } from "react";
import { useEventPenalties } from "@/hooks/penalties/useEventPenalties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Scale,
  Search,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function EventPenaltiesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: penalties, isLoading, isError } = useEventPenalties(eventId);

  const filteredPenalties = useMemo(() => {
    if (!penalties) return [];
    if (!searchQuery.trim()) return penalties;

    const query = searchQuery.toLowerCase();
    return penalties.filter((penalty) => {
      const reason = penalty.reason?.toLowerCase() || "";
      const action = penalty.penaltyAction?.toLowerCase() || "";
      const createdBy = penalty.createdBy
        ? `${penalty.createdBy.firstName} ${penalty.createdBy.lastName}`.toLowerCase()
        : "";
      const email = penalty.createdBy?.email?.toLowerCase() || "";

      return (
        reason.includes(query) ||
        action.includes(query) ||
        createdBy.includes(query) ||
        email.includes(query)
      );
    });
  }, [penalties, searchQuery]);

  const formatDateTime = (iso: string) => {
    return format(new Date(iso), "MMM dd, yyyy 'at' h:mm a");
  };

  const getPenaltyActionVariant = (action: string) => {
    const a = action?.toUpperCase();
    if (a === "WARN_USER") return "secondary" as const;
    if (a === "SUSPEND_ACCOUNT" || a === "SUSPEND_LOCATION_BOOKING")
      return "default" as const;
    if (a === "BAN_ACCOUNT" || a === "BAN_POST") return "destructive" as const;
    return "outline" as const;
  };

  const formatPenaltyAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        <p className="font-medium">Error loading penalties</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Penalties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reason, action, or admin name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredPenalties.length} of {penalties?.length || 0}{" "}
              penalty{penalties?.length !== 1 ? "ies" : ""}
            </div>
          )}

          {/* Penalties Table */}
          {!penalties || penalties.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-muted/10">
              <Scale className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No penalties found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No penalties have been issued for this event"}
              </p>
            </div>
          ) : filteredPenalties.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-muted/10">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPenalties.map((penalty) => (
                    <TableRow key={penalty.id} className="hover:bg-muted/20">
                      <TableCell>
                        <Badge
                          variant={getPenaltyActionVariant(penalty.penaltyAction)}
                          className="w-fit text-xs"
                        >
                          {formatPenaltyAction(penalty.penaltyAction)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {penalty.reason || (
                            <span className="text-muted-foreground italic">
                              No reason provided
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {penalty.createdBy ? (
                          <div className="flex items-center gap-2">
                            {penalty.createdBy.avatarUrl ? (
                              <img
                                src={penalty.createdBy.avatarUrl}
                                alt={penalty.createdBy.firstName}
                                className="w-8 h-8 rounded-full border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium">
                                {penalty.createdBy.firstName}{" "}
                                {penalty.createdBy.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {penalty.createdBy.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Unknown
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateTime(penalty.createdAt)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
