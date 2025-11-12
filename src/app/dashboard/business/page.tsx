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
import { ArrowUpRight, PlusCircle, Star, Eye, Building2 } from "lucide-react";
import Link from "next/link";

function StatCard({ title, value, change, icon: Icon }: any) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{value}</div>
        <p className="text-xs font-medium text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}

export default function BusinessDashboardPage() {
  return (
    <div className="space-y-8 pb-8 overflow-x-hidden">
      <div className="flex justify-end">
        <Link href="/dashboard/business/locations/create" className="shrink-0">
          <Button className="shadow-md hover:shadow-lg transition-all">
            <PlusCircle className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add New Location</span><span className="sm:hidden">Add Location</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 shadow-lg border-2">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                My Locations
              </CardTitle>
              <Link href={"/dashboard/business/locations"}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-muted/50">
                  <TableCell className="font-medium">My Awesome Cafe</TableCell>
                  <TableCell>
                    <Badge className="font-medium">APPROVED</Badge>
                  </TableCell>
                  <TableCell className="font-medium">4.8 (250 reviews)</TableCell>
                </TableRow>
                <TableRow className="hover:bg-muted/50">
                  <TableCell className="font-medium">New Bistro</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">PENDING</Badge>
                  </TableCell>
                  <TableCell className="font-medium">N/A</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg border-2">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm">
              <p className="font-semibold mb-1">John D. - ★★★★★</p>
              <p className="text-sm text-muted-foreground">
                &quot;Amazing coffee and great atmosphere!&quot;
              </p>
            </div>
            <div className="flex flex-col p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors shadow-sm">
              <p className="font-semibold mb-1">Jane S. - ★★★★☆</p>
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
