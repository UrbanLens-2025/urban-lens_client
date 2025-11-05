"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventById } from "@/hooks/events/useEventById";
import { useUpdateEvent } from "@/hooks/events/useUpdateEvent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload";
import {
  Loader2,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Globe,
  Star,
  ImageIcon,
} from "lucide-react";
import type { UpdateEventPayload } from "@/types";

const updateEventSchema = z.object({
  displayName: z
    .string()
    .min(3, "Event name must be at least 3 characters")
    .max(255, "Event name must not exceed 255 characters"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(1024, "Description must not exceed 1024 characters"),
  avatarUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .transform((val) => (val === "" ? null : val)),
  coverUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .transform((val) => (val === "" ? null : val)),
  refundPolicy: z
    .string()
    .nullable()
    .or(z.literal("").transform(() => null)),
  termsAndConditions: z
    .string()
    .nullable()
    .or(z.literal("").transform(() => null)),
  social: z
    .array(
      z.object({
        platform: z.string().min(1, "Platform is required"),
        url: z.string().url("Invalid URL"),
        isMain: z.boolean(),
      })
    )
    .optional()
    .default([]),
});

type UpdateEventForm = z.infer<typeof updateEventSchema>;

const popularPlatforms = [
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "Website",
  "Other",
];

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const updateEvent = useUpdateEvent();

  const { data: event, isLoading, isError } = useEventById(eventId);

  const form = useForm<UpdateEventForm>({
    resolver: zodResolver(updateEventSchema),
    mode: "onChange",
    defaultValues: {
      displayName: "",
      description: "",
      avatarUrl: null,
      coverUrl: null,
      refundPolicy: null,
      termsAndConditions: null,
      social: [],
    },
  });

  // Update form when event data loads
  useEffect(() => {
    if (event) {
      form.reset({
        displayName: event.displayName || "",
        description: event.description || "",
        avatarUrl: event.avatarUrl || null,
        coverUrl: event.coverUrl || null,
        refundPolicy: event.refundPolicy || null,
        termsAndConditions: event.termsAndConditions || null,
        social: event.social || [],
      });
    }
  }, [event, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social",
  });

  const socialLinks = form.watch("social") || [];

  const handleAddSocialLink = () => {
    append({
      platform: "",
      url: "",
      isMain: socialLinks.length === 0,
    });
  };

  const handleToggleMain = (index: number) => {
    const currentLinks = form.getValues("social") || [];
    const newLinks = currentLinks.map((link, i) => ({
      ...link,
      isMain: i === index,
    }));
    form.setValue("social", newLinks);
  };

  const onSubmit = async (data: UpdateEventForm) => {
    const payload: UpdateEventPayload = {
      displayName: data.displayName,
      description: data.description,
      avatarUrl: data.avatarUrl || null,
      coverUrl: data.coverUrl || null,
      refundPolicy: data.refundPolicy || null,
      termsAndConditions: data.termsAndConditions || null,
      social: data.social || [],
    };

    updateEvent.mutate({ eventId, payload });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading event details</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update your event details
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter event name"
                        {...field}
                        className="h-11"
                      />
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
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your event..."
                        rows={5}
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <div className="flex justify-between">
                      <FormMessage />
                      <span className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/1024 characters
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Event Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Image</FormLabel>
                    <FormDescription>
                      Upload a square image for your event avatar
                    </FormDescription>
                    <FormControl>
                      <SingleFileUpload
                        value={field.value || undefined}
                        onChange={(url) => field.onChange(url || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormDescription>
                      Upload a wide banner image for your event cover
                    </FormDescription>
                    <FormControl>
                      <SingleFileUpload
                        value={field.value || undefined}
                        onChange={(url) => field.onChange(url || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <FormDescription>
                  Add links to promote your event
                </FormDescription>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSocialLink}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No social links added yet. Click "Add Link" to add your first
                    link.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-3 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium">
                            Link {index + 1}
                          </FormLabel>
                          {socialLinks[index]?.isMain && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Main
                            </Badge>
                          )}
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`social.${index}.platform`}
                          render={({ field: platformField }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Facebook, Instagram"
                                  list={`platforms-${index}`}
                                  {...platformField}
                                />
                              </FormControl>
                              <datalist id={`platforms-${index}`}>
                                {popularPlatforms.map((platform) => (
                                  <option key={platform} value={platform} />
                                ))}
                              </datalist>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`social.${index}.url`}
                          render={({ field: urlField }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://..."
                                  {...urlField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`social.${index}.isMain`}
                        render={({ field: mainField }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">
                                Set as Main Link
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Mark this as your primary social media link
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={mainField.value || false}
                                onCheckedChange={(checked) => {
                                  mainField.onChange(checked);
                                  if (checked) {
                                    handleToggleMain(index);
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Policies & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="refundPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Policy</FormLabel>
                    <FormDescription>
                      Describe your refund policy for this event
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter refund policy details..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms and Conditions</FormLabel>
                    <FormDescription>
                      Describe the terms and conditions for this event
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter terms and conditions..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={updateEvent.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEvent.isPending || !form.formState.isValid}
            >
              {updateEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

