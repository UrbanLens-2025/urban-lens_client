"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useBusinessAccounts } from "@/hooks/admin/useBusinessAccounts";
import { useProcessBusinessAccount } from "@/hooks/admin/useProcessBusinessAccount";

// Import các component UI
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { BusinessProfile, BusinessStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminBusinessPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 50);
  const [statusTab, setStatusTab] = useState<BusinessStatus>("PENDING");

  const { data: response, isLoading } = useBusinessAccounts({
    page,
    search: debouncedSearchTerm,
    status: statusTab,
    sortBy: "createdAt:DESC",
  });
  const businesses = response?.data || [];
  const meta = response?.meta;

  const { mutate: processAccount, isPending } = useProcessBusinessAccount();

  const [approvingBusiness, setApprovingBusiness] =
    useState<BusinessProfile | null>(null);
  const [rejectingBusiness, setRejectingBusiness] =
    useState<BusinessProfile | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const queryClient = useQueryClient();

  const handleConfirmApprove = () => {
    if (!approvingBusiness) return;
    processAccount(
      { id: approvingBusiness.accountId, payload: { status: "APPROVED" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["businessAccounts"] });
          setApprovingBusiness(null);
        },
      }
    );
  };

  const handleConfirmReject = () => {
    if (!rejectingBusiness) return;
    processAccount(
      {
        id: rejectingBusiness.accountId,
        payload: { status: "REJECTED", adminNotes: adminNotes },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["businessAccounts"] });
          setRejectingBusiness(null);
          setAdminNotes("");
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Business Registrations</CardTitle>
          <CardDescription>
            Approve or reject new business accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={statusTab}
            onValueChange={(value) => {
              setStatusTab(value as BusinessStatus);
              setPage(1);
            }}
          >
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
              </TabsList>
              <div className="w-full max-w-sm">
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              {isLoading ? (
                <div className="text-center p-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((biz: BusinessProfile) => (
                      <TableRow key={biz.accountId}>
                        <TableCell className="font-medium">
                          {biz.name}
                        </TableCell>
                        <TableCell>{biz.email}</TableCell>
                        <TableCell>{biz.category}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {statusTab === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setApprovingBusiness(biz)}
                                disabled={isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRejectingBusiness(biz)}
                                disabled={isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {statusTab !== "PENDING" && (
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {businesses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                          No accounts found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={!!approvingBusiness} onOpenChange={() => setApprovingBusiness(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve this Business Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to approve the business &quot;{approvingBusiness?.name}&quot;?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmApprove} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirm Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!rejectingBusiness} onOpenChange={() => setRejectingBusiness(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject this Business Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for rejecting &quot;{rejectingBusiness?.name}&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea 
                        placeholder="Reason for rejection..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmReject} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirm Reject
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

      {/* --- PHÂN TRANG --- */}
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
    </div>
  );
}
