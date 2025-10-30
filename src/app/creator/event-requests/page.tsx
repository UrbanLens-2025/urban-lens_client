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
import {
  ClipboardList,
  PlusCircle,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
} from "lucide-react";
import { useState } from "react";

// Mock data for event requests
const mockEventRequests = [
  {
    id: "REQ-001",
    eventName: "Summer Music Festival 2025",
    requestedLocation: "Central Park Amphitheater",
    locationOwner: "NYC Parks Department",
    requestDate: "2025-01-15",
    eventDate: "2025-07-15",
    status: "pending",
    attendees: 500,
    duration: "6 hours",
    description: "Annual summer music festival featuring local artists",
  },
  {
    id: "REQ-002",
    eventName: "Tech Innovation Conference",
    requestedLocation: "Downtown Convention Center",
    locationOwner: "Metro Convention Services",
    requestDate: "2025-01-10",
    eventDate: "2025-06-20",
    status: "approved",
    attendees: 300,
    duration: "2 days",
    description: "Conference focusing on emerging technologies and AI",
  },
  {
    id: "REQ-003",
    eventName: "Community Art Exhibition",
    requestedLocation: "City Gallery Space",
    locationOwner: "City Arts Council",
    requestDate: "2025-01-08",
    eventDate: "2025-05-10",
    status: "rejected",
    attendees: 150,
    duration: "1 week",
    description: "Showcase of local artists and community art projects",
    rejectionReason: "Dates conflict with previously scheduled exhibition",
  },
  {
    id: "REQ-004",
    eventName: "Food & Wine Festival",
    requestedLocation: "Riverside Park Pavilion",
    locationOwner: "Riverside Events LLC",
    requestDate: "2025-01-20",
    eventDate: "2025-08-05",
    status: "pending",
    attendees: 800,
    duration: "3 days",
    description: "Celebration of local cuisine and wine culture",
  },
  {
    id: "REQ-005",
    eventName: "Charity Marathon",
    requestedLocation: "City Streets Circuit",
    locationOwner: "City Transportation Dept",
    requestDate: "2024-12-20",
    eventDate: "2025-04-15",
    status: "approved",
    attendees: 1000,
    duration: "8 hours",
    description: "Annual charity run supporting local schools",
  },
  {
    id: "REQ-006",
    eventName: "Jazz Night Series",
    requestedLocation: "Waterfront Lounge",
    locationOwner: "Coastal Entertainment Group",
    requestDate: "2025-01-05",
    eventDate: "2025-03-10",
    status: "under_review",
    attendees: 200,
    duration: "4 hours",
    description: "Monthly jazz performance series",
  },
];

export default function EventRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = mockEventRequests.filter(
    (request) =>
      request.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      case "under_review":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
          <ClipboardList className="h-3 w-3 mr-1" />
          Under Review
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    {
      label: "Total Requests",
      value: mockEventRequests.length,
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      label: "Pending",
      value: mockEventRequests.filter((r) => r.status === "pending").length,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Approved",
      value: mockEventRequests.filter((r) => r.status === "approved").length,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Rejected",
      value: mockEventRequests.filter((r) => r.status === "rejected").length,
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage your event venue and approval requests
          </p>
        </div>
        <Button onClick={() => window.location.href = '/creator/events/create'}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Quick Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Requests</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Requested Location</TableHead>
                <TableHead>Location Owner</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">
                    {request.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {request.eventName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.requestedLocation}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {request.locationOwner}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(request.eventDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.attendees.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or create a new event request.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

