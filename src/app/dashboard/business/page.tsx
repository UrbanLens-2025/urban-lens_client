/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, PlusCircle, Star, Eye } from "lucide-react";
import Link from "next/link";

function StatCard({ title, value, change, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}

export default function BusinessDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/business/locations/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Location
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Reviews"
          value="1,234"
          change="+20.1% from last month"
          icon={Star}
        />
        <StatCard
          title="Average Rating"
          value="4.5"
          change="+0.2 this month"
          icon={Star}
        />
        <StatCard
          title="Page Views"
          value="23,456"
          change="+180% from last month"
          icon={Eye}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>My Locations</CardTitle>
              <Link href={"/dashboard/business/locations"}>
                <ArrowUpRight />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">My Awesome Cafe</TableCell>
                  <TableCell>
                    <Badge>APPROVED</Badge>
                  </TableCell>
                  <TableCell>4.8 (250 reviews)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">New Bistro</TableCell>
                  <TableCell>
                    <Badge variant="secondary">PENDING</Badge>
                  </TableCell>
                  <TableCell>N/A</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col p-3 border rounded-md">
              <p className="font-semibold">John D. - ★★★★★</p>
              <p className="text-sm text-muted-foreground">
                &quot;Amazing coffee and great atmosphere!&quot;
              </p>
            </div>
            <div className="flex flex-col p-3 border rounded-md">
              <p className="font-semibold">Jane S. - ★★★★☆</p>
              <p className="text-sm text-muted-foreground">
                &quot;Good place, but a bit crowded on weekends.&quot;
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
