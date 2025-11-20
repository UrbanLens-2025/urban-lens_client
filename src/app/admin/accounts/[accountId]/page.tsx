'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconArrowLeft, IconUser } from '@tabler/icons-react';

export default function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/accounts">
          <Button variant="ghost" size="icon">
            <IconArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Account Details</h1>
          <p className="text-sm text-muted-foreground">View and manage account information</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IconUser className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Account Information</CardTitle>
          <CardDescription>
            Detailed view and management for this account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-8 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              To be implemented
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Account ID:</span>
              <Badge variant="outline" className="font-mono">
                {accountId}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This page will display comprehensive account details including:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Profile information and avatar</li>
              <li>• Account status and role management</li>
              <li>• Activity history and logs</li>
              <li>• Associated business or creator profiles</li>
              <li>• Account actions (lock/unlock, reset password)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

