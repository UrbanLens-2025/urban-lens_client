"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { useDeleteTicket } from "@/hooks/events/useDeleteTicket";
import { useEventTabs } from "@/contexts/EventTabContext";
import { useEventById } from "@/hooks/events/useEventById";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Ticket,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function EventTicketsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { openTicketCreateTab } = useEventTabs();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  const { data: tickets, isLoading } = useEventTickets(eventId);
  const { data: event } = useEventById(eventId);
  const deleteTicket = useDeleteTicket();
  const { openTicketDetailsTab } = useEventTabs();
  
  const isEventCancelled = event?.status?.toUpperCase() === "CANCELLED";

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    if (currency === "VND") {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(num);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const handleDeleteTicket = async (ticketId: string) => {
    deleteTicket.mutate(
      { eventId, ticketId },
      {
        onSuccess: () => {
          setTicketToDelete(null);
        },
      }
    );
  };

  // Filter tickets
  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch = ticket.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && ticket.isActive) ||
                         (statusFilter === "inactive" && !ticket.isActive);
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate stats
  const totalTickets = tickets?.length || 0;
  const activeTickets = tickets?.filter(t => t.isActive).length || 0;
  const totalRevenuePotential = tickets?.reduce((sum, ticket) => 
    sum + (parseFloat(ticket.price) * ticket.totalQuantityAvailable), 0
  ) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Total Tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active Tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTickets - activeTickets} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue Potential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totalRevenuePotential.toString(), tickets?.[0]?.currency || "VND")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Ticket Management
              </CardTitle>
              <CardDescription className="mt-1">
                Create and manage tickets for your event
              </CardDescription>
            </div>
            {!isEventCancelled && (
              <Button
                className="w-full md:w-auto"
                onClick={(e) => {
                  e.preventDefault();
                  openTicketCreateTab();
                  router.push(`/dashboard/creator/events/${eventId}/tickets/create`);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Ticket
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {searchQuery || statusFilter !== "all" ? (
            <div className="text-sm text-muted-foreground">
              Showing {filteredTickets.length} of {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
            </div>
          ) : null}

          {/* Tickets Table */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-muted/10">
              <Ticket className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {tickets?.length === 0 ? "No tickets created yet" : "No tickets found"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {tickets?.length === 0 
                  ? "Create your first ticket to start selling" 
                  : "Try adjusting your search or filters"}
              </p>
              {tickets?.length === 0 && !isEventCancelled && (
                <Link href={`/dashboard/creator/ticket-form/create/${eventId}`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Sale Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const availableQuantity = ticket.totalQuantityAvailable - ticket.quantityReserved;
                    const availabilityPercentage = ticket.totalQuantityAvailable > 0 
                      ? (availableQuantity / ticket.totalQuantityAvailable) * 100 
                      : 0;
                    const isSaleActive = new Date(ticket.saleStartDate) <= new Date() && 
                                        new Date(ticket.saleEndDate) >= new Date();

                    return (
                      <TableRow key={ticket.id} className="group">
                        <TableCell>
                          <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                            {ticket.imageUrl ? (
                              <img
                                src={ticket.imageUrl}
                                alt={ticket.displayName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const icon = document.createElement('div');
                                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                    parent.appendChild(icon.firstChild!);
                                  }
                                }}
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/dashboard/creator/events/${eventId}/tickets/${ticket.id}`}
                            className="block space-y-1 hover:opacity-80 transition-opacity cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              openTicketDetailsTab(ticket.id, ticket.displayName);
                              router.push(`/dashboard/creator/events/${eventId}/tickets/${ticket.id}`);
                            }}
                          >
                            <div className="font-medium hover:underline">{ticket.displayName}</div>
                            {ticket.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {ticket.description}
                              </div>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {formatCurrency(ticket.price, ticket.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.minQuantityPerOrder}-{ticket.maxQuantityPerOrder} per order
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {availableQuantity} / {ticket.totalQuantityAvailable}
                            </div>
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  availabilityPercentage > 50
                                    ? "bg-green-500"
                                    : availabilityPercentage > 20
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${availabilityPercentage}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ticket.saleStartDate)}
                            </div>
                            <div className="text-muted-foreground">
                              to {formatDate(ticket.saleEndDate)}
                            </div>
                            {!isSaleActive && ticket.isActive && (
                              <Badge variant="outline" className="text-xs">
                                Not on sale
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.isActive ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  openTicketDetailsTab(ticket.id, ticket.displayName);
                                  router.push(`/dashboard/creator/events/${eventId}/tickets/${ticket.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <Link href={`/dashboard/creator/ticket-form/edit/${eventId}/${ticket.id}`}>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Ticket
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setTicketToDelete(ticket.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Ticket
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!ticketToDelete} onOpenChange={() => setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ticket
              and remove it from the event. Any existing bookings will remain valid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ticketToDelete && handleDeleteTicket(ticketToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTicket.isPending}
            >
              {deleteTicket.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
