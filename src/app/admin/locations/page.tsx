"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce"; // Cần cài đặt: npm install use-debounce
import { usePendingRequests } from "@/hooks/usePendingRequests";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { LocationRequest } from "@/types";
import { useProcessLocationRequest } from "@/hooks/useProcessLocationRequest";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboardPage() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Chờ 500ms sau khi gõ

    const { data: response, isLoading } = usePendingRequests(page, debouncedSearchTerm);
    const requests = response?.data || [];
    const meta = response?.meta;

    const { mutate: processRequest, isPending } = useProcessLocationRequest();
    
    // State để quản lý việc reject
    const [rejectingRequest, setRejectingRequest] = useState<LocationRequest | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const handleApprove = (id: string) => {
        processRequest({ id, payload: { status: 'APPROVED' } });
    };

    const handleConfirmReject = () => {
        if (rejectingRequest) {
            processRequest({
                id: rejectingRequest.id,
                payload: { status: 'REJECTED', adminNotes: rejectReason }
            }, {
                onSuccess: () => setRejectingRequest(null), // Đóng dialog khi thành công
            });
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Pending Location Requests</CardTitle>
                    <CardDescription>
                        Review and approve new location submissions. 
                        Showing page {meta?.currentPage} of {meta?.totalPages}.
                    </CardDescription>
                    <div className="pt-4">
                        <Input 
                            placeholder="Search by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && !response ? (
                        <div className="text-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Location Name</TableHead>
                                    <TableHead>Submitted By</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req: LocationRequest) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.name}</TableCell>
                                        <TableCell>{req.createdBy?.name || 'N/A'}</TableCell>
                                        <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm">View</Button>
                                            <Button size="sm" onClick={() => handleApprove(req.id)} disabled={isPending} className="bg-green-600 hover:bg-green-700">Approve</Button>
                                            <Button variant="destructive" size="sm" onClick={() => setRejectingRequest(req)} disabled={isPending}>Reject</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                 {requests.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">No pending requests found.</TableCell></TableRow>
                                 )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!rejectingRequest} onOpenChange={() => setRejectingRequest(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to reject this request?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Please provide a reason for rejection. This note will be visible to the business owner.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea 
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
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