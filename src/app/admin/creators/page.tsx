'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconUserStar } from '@tabler/icons-react';

export default function AdminCreatorsPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IconUserStar className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Creator Profiles Management</CardTitle>
          <CardDescription>
            This page will display all event creator profiles for review and management
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="rounded-lg bg-muted/50 p-8">
            <p className="text-lg font-medium text-muted-foreground">
              To be implemented
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Features will include creator profile approval, status management, and analytics
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

