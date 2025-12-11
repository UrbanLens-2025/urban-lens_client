"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventById } from "@/hooks/events/useEventById";
import { useAddEventTags, useRemoveEventTags } from "@/hooks/events/useEventTags";
import { updateEvent } from "@/api/events";
import { useEventRequestById } from "@/hooks/events/useEventRequestById";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAllTags } from "@/hooks/tags/useAllTags";
import { Tag, UpdateEventPayload } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { FileUpload } from "@/components/shared/FileUpload";
import { DateTimePicker } from "@/app/dashboard/creator/request/create/_components/DateTimePicker";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Globe,
  Star,
  ImageIcon,
  Tag as TagIcon,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Info,
  FileText,
  Link2,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const updateEventSchema = z.object({
  displayName: z
    .string()
    .min(3, "Event name must be at least 3 characters")
    .max(255, "Event name must not exceed 255 characters")
    .optional(),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(1024, "Description must not exceed 1024 characters")
    .optional(),
  expectedNumberOfParticipants: z
    .number()
    .int("Must be a whole number")
    .positive("Must be greater than 0")
    .optional(),
  avatarUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .transform((val) => (val === "" || !val ? null : val))
    .optional(),
  coverUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .transform((val) => (val === "" || !val ? null : val))
    .optional(),
  startDate: z
    .date()
    .optional()
    .nullable(),
  endDate: z
    .date()
    .optional()
    .nullable(),
  social: z
    .array(
      z.object({
        platform: z.string().min(1, "Platform is required"),
        url: z.string().url("Invalid URL"),
        isMain: z.boolean(),
      })
    )
    .optional(),
  eventValidationDocuments: z
    .array(
      z.object({
        documentType: z.string().min(1, "Document type is required"),
        documentImageUrls: z.array(z.string().url("Invalid image URL")).min(1, "At least one image is required"),
      })
    )
    .optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
);

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

const INITIAL_DISPLAY_COUNT = 5;

// Section definitions for navigation
const sections = [
  { id: "basic", label: "Basic Info", icon: FileText },
  { id: "dates", label: "Schedule", icon: CalendarDays },
  { id: "tags", label: "Tags", icon: TagIcon },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "social", label: "Social Links", icon: Globe },
  { id: "documents", label: "Documents", icon: FileCheck },
];

// Helper component for field labels with tooltips
function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const addEventTags = useAddEventTags();
  const removeEventTags = useRemoveEventTags();

  const { data: event, isLoading, isError } = useEventById(eventId);
  const { data: eventRequest } = useEventRequestById(event?.referencedEventRequestId || null);
  const { data: allTags, isLoading: isLoadingTags } = useAllTags();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [pendingTagIds, setPendingTagIds] = useState<number[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basic");

  // Refs for scroll-to-section
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Filter to only show EVENT_TYPE tags for events
  const tags = (allTags || []).filter((tag) => tag.groupName === "EVENT_TYPE");
  const currentTagIds = event?.tags?.map((tag) => tag.id) || [];
  const displayedTagIds = pendingTagIds !== null ? pendingTagIds : currentTagIds;

  const form = useForm<UpdateEventForm>({
    resolver: zodResolver(updateEventSchema) as any,
    mode: "onChange",
    defaultValues: {
      displayName: "",
      description: "",
      expectedNumberOfParticipants: undefined,
      avatarUrl: null,
      coverUrl: null,
      startDate: undefined,
      endDate: undefined,
      social: [],
      eventValidationDocuments: [],
    },
  });

  // Update form when event data loads
  useEffect(() => {
    if (event) {
      form.reset({
        displayName: event.displayName || "",
        description: event.description || "",
        expectedNumberOfParticipants: eventRequest?.expectedNumberOfParticipants || undefined,
        avatarUrl: event.avatarUrl || null,
        coverUrl: event.coverUrl || null,
        startDate: event.startDate ? new Date(event.startDate) : undefined,
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        social: event.social || [],
        eventValidationDocuments: eventRequest?.eventValidationDocuments || [],
      });
      setPendingTagIds(null);
    }
  }, [event, eventRequest, form]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social",
  });

  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control: form.control,
    name: "eventValidationDocuments",
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

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  const onSubmit = async (data: UpdateEventForm) => {
    setIsSubmitting(true);
    try {
      const isPublished = event?.status?.toUpperCase() === "PUBLISHED";
      const payload: UpdateEventPayload = {};
      
      // Don't allow editing displayName, startDate, or endDate if event is published
      if (!isPublished && data.displayName !== undefined) {
        payload.displayName = data.displayName;
      }
      if (data.description !== undefined) payload.description = data.description;
      if (data.expectedNumberOfParticipants !== undefined) payload.expectedNumberOfParticipants = data.expectedNumberOfParticipants;
      if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl || null;
      if (data.coverUrl !== undefined) payload.coverUrl = data.coverUrl || null;
      if (!isPublished && data.startDate !== undefined) {
        payload.startDate = data.startDate ? data.startDate.toISOString() : null;
      }
      if (!isPublished && data.endDate !== undefined) {
        payload.endDate = data.endDate ? data.endDate.toISOString() : null;
      }
      // social and eventValidationDocuments are full replacements (not partial updates)
      if (data.social !== undefined) payload.social = data.social || [];
      if (data.eventValidationDocuments !== undefined) payload.eventValidationDocuments = data.eventValidationDocuments || [];

      const updatedEvent = await updateEvent(eventId, payload);
      
      queryClient.invalidateQueries({ queryKey: ['eventDetail'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.setQueryData(['eventDetail', updatedEvent.id], updatedEvent);

      if (pendingTagIds !== null) {
        const tagsToAdd = pendingTagIds.filter(id => !currentTagIds.includes(id));
        const tagsToRemove = currentTagIds.filter(id => !pendingTagIds.includes(id));

        if (tagsToRemove.length > 0) {
          await removeEventTags.mutateAsync({
            eventId,
            payload: { tagIds: tagsToRemove },
          });
        }

        if (tagsToAdd.length > 0) {
          await addEventTags.mutateAsync({
            eventId,
            payload: { tagIds: tagsToAdd },
          });
        }
      }

      toast.success("Event updated successfully!");
      router.push(`/dashboard/creator/events/${eventId}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6">
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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update your event details and settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/creator/events/${eventId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || !form.formState.isDirty}
            >
              {isSubmitting ? (
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
        </div>

        <div className="flex gap-6">
          {/* Section Navigation Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <nav className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Sections
                </p>
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div ref={(el) => {sectionRefs.current["basic"] = el}}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle>Basic Information</CardTitle>
                          <CardDescription>
                            The essential details that define your event
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => {
                          const isPublished = event?.status?.toUpperCase() === "PUBLISHED";
                          return (
                            <FormItem>
                              <FormLabel>
                                <FieldLabel
                                  label="Event Name"
                                  tooltip={isPublished ? "Event name cannot be changed after publishing" : "A clear, memorable name for your event. This is what attendees will see first."}
                                />
                              </FormLabel>
                              <FormControl>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Input
                                          placeholder="e.g., Summer Music Festival 2025"
                                          {...field}
                                          className="h-11"
                                          disabled={isPublished}
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    {isPublished && (
                                      <TooltipContent>
                                        <p>Event name cannot be edited after publishing</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <FieldLabel
                                label="Description"
                                tooltip="A detailed description of your event. Include what attendees can expect, highlights, and any special features."
                              />
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what makes your event special..."
                                rows={6}
                                {...field}
                                className="resize-none"
                              />
                            </FormControl>
                            <div className="flex justify-between items-center">
                              <FormMessage />
                              <span className={cn(
                                "text-xs transition-colors",
                                (field.value?.length || 0) > 900 ? "text-orange-500" : "text-muted-foreground"
                              )}>
                                {field.value?.length || 0}/1024 characters
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expectedNumberOfParticipants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <FieldLabel
                                label="Expected Number of Participants"
                                tooltip="The estimated number of attendees for your event"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 100"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? undefined : parseInt(value, 10));
                                }}
                                className="h-11"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Event Dates */}
                <div ref={(el) => {sectionRefs.current["dates"] = el}}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <CalendarDays className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <CardTitle>Event Schedule</CardTitle>
                          <CardDescription>
                            When will your event take place?
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => {
                            const isPublished = event?.status?.toUpperCase() === "PUBLISHED";
                            return (
                              <FormItem className="w-full">
                                <div className="mb-2">
                                  <FieldLabel
                                    label="Start Date & Time"
                                    tooltip={isPublished ? "Start date cannot be changed after publishing" : "When your event begins. Attendees will use this to plan their arrival."}
                                  />
                                </div>
                                <FormControl>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <DateTimePicker
                                            label=""
                                            value={field.value || undefined}
                                            onChange={(date) => field.onChange(date || null)}
                                            error={form.formState.errors.startDate?.message}
                                            disabled={isPublished}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      {isPublished && (
                                        <TooltipContent>
                                          <p>Start date cannot be edited after publishing</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => {
                            const isPublished = event?.status?.toUpperCase() === "PUBLISHED";
                            return (
                              <FormItem className="w-full">
                                <div className="mb-2">
                                  <FieldLabel
                                    label="End Date & Time"
                                    tooltip={isPublished ? "End date cannot be changed after publishing" : "When your event concludes. Must be after the start date."}
                                  />
                                </div>
                                <FormControl>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <DateTimePicker
                                            label=""
                                            value={field.value || undefined}
                                            onChange={(date) => field.onChange(date || null)}
                                            error={form.formState.errors.endDate?.message}
                                            disabled={isPublished}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      {isPublished && (
                                        <TooltipContent>
                                          <p>End date cannot be edited after publishing</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tags Management */}
                <div ref={(el) => {sectionRefs.current["tags"] = el}}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <TagIcon className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <CardTitle>Event Tags</CardTitle>
                          <CardDescription>
                            Help attendees discover your event with relevant tags
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isLoadingTags ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {/* Selected Tags */}
                          {displayedTagIds.length > 0 && (
                            <div className="p-4 rounded-lg bg-muted/50 border-2 border-dashed">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Selected Tags ({displayedTagIds.length})
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {displayedTagIds.map((tagId) => {
                                  const tag = tags.find((t: Tag) => t.id === tagId);
                                  if (!tag) return null;
                                  return (
                                    <Badge
                                      key={tagId}
                                      style={{
                                        backgroundColor: tag.color,
                                        color: "#fff",
                                      }}
                                      className="pl-2 pr-1.5 py-1 flex items-center gap-1.5 text-sm hover:opacity-90 transition-opacity"
                                    >
                                      <span>{tag.icon}</span>
                                      <span>{tag.displayName}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newTagIds = displayedTagIds.filter(id => id !== tagId);
                                          setPendingTagIds(newTagIds);
                                        }}
                                        disabled={isSubmitting}
                                        className="ml-1 rounded-full hover:bg-white/30 p-0.5 disabled:opacity-50 transition-colors"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Tag Selection */}
                          {(() => {
                            const groupedTags = tags.reduce(
                              (acc: Record<string, Tag[]>, tag: Tag) => {
                                const group = tag.groupName || "Others";
                                if (!acc[group]) {
                                  acc[group] = [];
                                }
                                acc[group].push(tag);
                                return acc;
                              },
                              {}
                            );

                            const getGroupLabel = (group: string) => {
                              if (group === "Others") return "Others";
                              return group
                                .split("_")
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(" ");
                            };

                            const getFilteredTags = (tags: Tag[], groupName: string) => {
                              const searchTerm = searchTerms[groupName]?.toLowerCase() || "";
                              return tags.filter((tag: Tag) =>
                                tag.displayName.toLowerCase().includes(searchTerm)
                              );
                            };

                            const getDisplayedTags = (tags: Tag[], groupName: string) => {
                              const filtered = getFilteredTags(tags, groupName);
                              const isExpanded = expandedGroups[groupName];
                              return isExpanded ? filtered : filtered.slice(0, INITIAL_DISPLAY_COUNT);
                            };

                            const handleAddTag = (tagId: number) => {
                              if (!displayedTagIds.includes(tagId)) {
                                const newTagIds = [...displayedTagIds, tagId];
                                setPendingTagIds(newTagIds);
                              }
                            };

                            return (
                              <div className="space-y-3">
                                {Object.entries(groupedTags)
                                  .sort(([a], [b]) => {
                                    if (a === "Others") return 1;
                                    if (b === "Others") return -1;
                                    return a.localeCompare(b);
                                  })
                                  .map(([groupName, tags]) => {
                                    const filteredTags = getFilteredTags(tags, groupName);
                                    const displayedTags = getDisplayedTags(tags, groupName);
                                    const hasMore = filteredTags.length > INITIAL_DISPLAY_COUNT;
                                    const isExpanded = expandedGroups[groupName];
                                    const isGroupExpanded = expandedGroups[`group_${groupName}`] ?? true;

                                    return (
                                      <div key={groupName} className="border rounded-lg overflow-hidden bg-card">
                                        <div className="bg-muted/30 p-3">
                                          <div className="flex items-center justify-between gap-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setExpandedGroups((prev) => ({
                                                  ...prev,
                                                  [`group_${groupName}`]: !prev[`group_${groupName}`],
                                                }))
                                              }
                                              className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                                            >
                                              {isGroupExpanded ? (
                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                              ) : (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                              )}
                                              <h3 className="text-sm font-semibold">
                                                {getGroupLabel(groupName)}
                                                <span className="text-xs text-muted-foreground font-normal ml-2">
                                                  ({filteredTags.length} available)
                                                </span>
                                              </h3>
                                            </button>
                                            {isGroupExpanded && (
                                              <div className="relative w-48">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <Input
                                                  type="text"
                                                  placeholder="Search tags..."
                                                  value={searchTerms[groupName] || ""}
                                                  onChange={(e) =>
                                                    setSearchTerms((prev) => ({
                                                      ...prev,
                                                      [groupName]: e.target.value,
                                                    }))
                                                  }
                                                  className="pl-8 h-8 text-xs"
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {isGroupExpanded && (
                                          <div className="p-3 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                              {displayedTags.map((tag: Tag) => {
                                                const isSelected = displayedTagIds.includes(tag.id);
                                                return (
                                                  <Badge
                                                    key={tag.id}
                                                    variant={isSelected ? "default" : "outline"}
                                                    style={
                                                      isSelected
                                                        ? {
                                                            backgroundColor: tag.color,
                                                            color: "#fff",
                                                            borderColor: tag.color,
                                                          }
                                                        : {
                                                            borderColor: tag.color,
                                                            color: tag.color,
                                                          }
                                                    }
                                                    className={cn(
                                                      "cursor-pointer transition-all hover:shadow-sm px-2.5 py-1 text-sm",
                                                      isSelected && "ring-2 ring-offset-2 ring-primary/50",
                                                      !isSelected && "hover:bg-muted/50"
                                                    )}
                                                    onClick={() => handleAddTag(tag.id)}
                                                  >
                                                    <span className="mr-1.5">{tag.icon}</span>
                                                    {tag.displayName}
                                                  </Badge>
                                                );
                                              })}
                                            </div>

                                            {hasMore && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  setExpandedGroups((prev) => ({
                                                    ...prev,
                                                    [groupName]: !prev[groupName],
                                                  }))
                                                }
                                                className="w-full h-8 text-xs"
                                              >
                                                {isExpanded ? (
                                                  <>
                                                    <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                                                    Show Less
                                                  </>
                                                ) : (
                                                  <>
                                                    <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                                                    Show {filteredTags.length - INITIAL_DISPLAY_COUNT} More
                                                  </>
                                                )}
                                              </Button>
                                            )}

                                            {filteredTags.length === 0 && searchTerms[groupName] && (
                                              <p className="text-xs text-muted-foreground text-center py-3">
                                                No tags found for &quot;{searchTerms[groupName]}&quot;
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Images */}
                <div ref={(el) => {sectionRefs.current["images"] = el}}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <ImageIcon className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <CardTitle>Event Images</CardTitle>
                          <CardDescription>
                            Visual assets to attract attendees
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="coverUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <FieldLabel
                                label="Cover Image"
                                tooltip="A wide banner image (recommended: 1920x1080px) that will be displayed prominently at the top of your event page."
                              />
                            </FormLabel>
                            <FormDescription className="text-xs">
                              This image appears as the banner on your event page
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

                      <Separator />

                      <FormField
                        control={form.control}
                        name="avatarUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <FieldLabel
                                label="Avatar Image"
                                tooltip="A square image (recommended: 512x512px) used as your event's profile picture in listings and previews."
                              />
                            </FormLabel>
                            <FormDescription className="text-xs">
                              This image appears in event listings and thumbnails
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
                </div>

                {/* Social Links */}
                <div ref={(el) => {sectionRefs.current["social"] = el}}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Globe className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>
                              Connect attendees with your online presence
                            </CardDescription>
                          </div>
                        </div>
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {fields.length === 0 ? (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
                          <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground mb-2">
                            No social links added yet
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Add links to your social media profiles, website, or other online presence
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddSocialLink}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Link
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="border rounded-lg p-4 space-y-4 bg-card hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                    {index + 1}
                                  </div>
                                  {socialLinks[index]?.isMain && (
                                    <Badge variant="default" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Primary Link
                                    </Badge>
                                  )}
                                </div>
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <div className="relative">
                                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input
                                            type="url"
                                            placeholder="https://..."
                                            className="pl-9"
                                            {...urlField}
                                          />
                                        </div>
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
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-sm">
                                        Set as Primary Link
                                      </FormLabel>
                                      <p className="text-xs text-muted-foreground">
                                        This link will be featured prominently
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
                </div>

                {/* Documents */}
                <div ref={(el) => {sectionRefs.current["documents"] = el}}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <FileCheck className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <CardTitle>Event Validation Documents</CardTitle>
                          <CardDescription>
                            Upload required documents for event validation
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {documentFields.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No documents uploaded yet</p>
                          <p className="text-xs mt-1">Add documents to validate your event</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {documentFields.map((field, index) => (
                            <div key={field.id} className="border-2 border-primary/10 rounded-lg p-4 space-y-4 bg-primary/5">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                  <FileCheck className="h-4 w-4 text-primary" />
                                  Document {index + 1}
                                </h3>
                                {documentFields.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDocument(index)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <FormField
                                control={form.control}
                                name={`eventValidationDocuments.${index}.documentType`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Document Type</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <FormControl>
                                        <SelectTrigger className="border-primary/20 focus:border-primary/50">
                                          <SelectValue placeholder="Select document type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="EVENT_PERMIT">Event Permit</SelectItem>
                                        <SelectItem value="TAX_REGISTRATION">Tax Registration</SelectItem>
                                        <SelectItem value="HEALTH_PERMIT">Health Permit</SelectItem>
                                        <SelectItem value="LIABILITY_INSURANCE">Liability Insurance</SelectItem>
                                        <SelectItem value="ORGANIZER_ID">Organizer ID</SelectItem>
                                        <SelectItem value="BUSINESS_LICENSE">Business License</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`eventValidationDocuments.${index}.documentImageUrls`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Document Images</FormLabel>
                                    <FormControl>
                                      <FileUpload
                                        value={field.value || []}
                                        onChange={(urls) => field.onChange(urls)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {index < documentFields.length - 1 && <Separator />}
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendDocument({
                          documentType: "EVENT_PERMIT",
                          documentImageUrls: [],
                        })}
                        className="w-full border-primary/20 hover:border-primary/50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Document
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

