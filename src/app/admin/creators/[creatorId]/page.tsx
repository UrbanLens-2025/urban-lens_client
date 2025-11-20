'use client';

import { use } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IconUserStar } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';

export default function AdminCreatorDetailPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = use(params);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IconUserStar className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Creator Profile Details</CardTitle>
          <CardDescription>
            Detailed view and management for a specific creator profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-8 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              To be implemented
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Creator ID:</span>
              <Badge variant="outline" className="font-mono">
                {creatorId}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This page will show detailed creator information, approval history,
              associated events, and management actions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

