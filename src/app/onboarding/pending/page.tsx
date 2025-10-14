"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md text-center p-6">
        <CardHeader>
          <MailCheck className="mx-auto h-16 w-16 text-green-500" />
          <CardTitle className="mt-4 text-2xl">Application Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Thank you! Your business profile has been submitted and is currently under review. 
            We will notify you once it has been approved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}