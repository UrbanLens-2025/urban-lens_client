"use client";

import { use, useState } from "react";
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
import { Loader2, ArrowLeft } from "lucide-react";
import { useCreateCreatorAnnouncement } from "@/hooks/announcements/useCreateCreatorAnnouncement";

const announcementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description should be at least 10 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  imageUrl: z.string().url("Please provide a valid URL").optional().or(z.literal("")),
  isHidden: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function NewCreatorAnnouncementPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const [placeholderImage, setPlaceholderImage] = useState<string | undefined>(undefined);
  const { mutate: createAnnouncement, isPending: isCreating } = useCreateCreatorAnnouncement();

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

  const onSubmit = (values: AnnouncementFormValues) => {
    createAnnouncement(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        imageUrl: values.imageUrl?.trim() ? values.imageUrl.trim() : undefined,
        isHidden: values.isHidden,
        eventId,
      },
      {
        onSuccess: () => router.push(`/dashboard/creator/events/${eventId}/announcements`),
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span>
            <Link href="/dashboard/creator/events" className="text-muted-foreground hover:underline">
              Events
            </Link>
            <span className="px-1">/</span>
            <Link
              href={`/dashboard/creator/events/${eventId}/announcements`}
              className="text-muted-foreground hover:underline"
            >
              Announcements
            </Link>
            <span className="px-1">/</span>
            <span className="text-foreground">Create</span>
          </span>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Create announcement</CardTitle>
          <CardDescription>Publish news and updates for your event.</CardDescription>
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
                          Hidden announcements will not appear to attendees until you publish them.
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
                        <SingleFileUpload value={field.value ?? placeholderImage} onChange={(value) => {
                          setPlaceholderImage(typeof value === "string" ? value : undefined);
                          field.onChange(value);
                        }} />
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
                  onClick={() => router.push(`/dashboard/creator/events/${eventId}/announcements`)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create announcement
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
