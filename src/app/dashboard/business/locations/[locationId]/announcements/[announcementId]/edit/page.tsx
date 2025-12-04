"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload";
import { useAnnouncementById } from "@/hooks/announcements/useAnnouncementById";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { useUpdateAnnouncement } from "@/hooks/announcements/useUpdateAnnouncement";
import { Loader2, CalendarDays, Clock, MapPin } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const announcementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description should be at least 10 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  imageUrl: z.string().url("Please provide a valid URL").optional().or(z.literal("")),
  isHidden: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ locationId: string; announcementId: string }>;
}) {
  const { locationId, announcementId } = use(params);
  const router = useRouter();

  const {
    data: announcement,
    isLoading,
    isError,
  } = useAnnouncementById(announcementId);
  const {
    data: location,
    isLoading: isLoadingLocation,
  } = useLocationById(locationId);
  const { mutate: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncement(announcementId);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      imageUrl: "",
      isHidden: false,
    },
  });

  useEffect(() => {
    if (!announcement) return;
    form.reset({
      title: announcement.title,
      description: announcement.description,
      startDate: announcement.startDate ? announcement.startDate.slice(0, 16) : "",
      endDate: announcement.endDate ? announcement.endDate.slice(0, 16) : "",
      imageUrl: announcement.imageUrl ?? "",
      isHidden: announcement.isHidden,
    });
  }, [announcement, form]);

  const onSubmit = (values: AnnouncementFormValues) => {
    updateAnnouncement(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        imageUrl: values.imageUrl?.trim() ? values.imageUrl.trim() : undefined,
        isHidden: values.isHidden,
      },
      {
        onSuccess: () => router.push(`/dashboard/business/locations/${locationId}/announcements`),
      }
    );
  };

  if (isLoading || isLoadingLocation) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !announcement) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
        <p>We couldn&apos;t load this announcement. It may have been removed.</p>
        <Button asChild>
          <Link href={`/dashboard/business/locations/${locationId}/announcements`}>
            Back to announcements
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            <Link href="/dashboard/business/locations" className="text-muted-foreground hover:underline">
              Locations
            </Link>
            <span className="px-1">/</span>
            <Link
              href={`/dashboard/business/locations/${locationId}`}
              className="text-muted-foreground hover:underline"
            >
              {location?.name ?? "Location"}
            </Link>
            <span className="px-1">/</span>
            <Link
              href={`/dashboard/business/locations/${locationId}/announcements`}
              className="text-muted-foreground hover:underline"
            >
              Announcements
            </Link>
            <span className="px-1">/</span>
            <span className="text-foreground">Edit</span>
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span>Created {formatDateTime(announcement.createdAt)}</span>
          <span className="px-2">•</span>
          <span>Updated {formatDateTime(announcement.updatedAt)}</span>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Edit announcement</CardTitle>
          <CardDescription>Update details and visibility for this announcement.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Announcement headline" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder="Share the announcement details" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start at</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End at</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isHidden"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Hide announcement</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Hidden announcements will not appear to visitors.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image (optional)</FormLabel>
                      <FormControl>
                        <SingleFileUpload value={field.value ?? undefined} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/business/locations/${locationId}/announcements`)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium text-foreground">Current window</p>
                <p>Starts: {announcement.startDate ? formatDateTime(announcement.startDate) : "Not set"}</p>
                <p>Ends: {announcement.endDate ? formatDateTime(announcement.endDate) : "Not set"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium text-foreground">Timestamps</p>
                <p>Created {formatDateTime(announcement.createdAt)}</p>
                <p>Updated {formatDateTime(announcement.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium text-foreground">{location?.name ?? "Location"}</p>
                {location?.addressLine && <p>{location.addressLine}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
