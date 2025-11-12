"use client";

import { use, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// --- Hooks & Components ---
import { useUpdateLocationMission } from "@/hooks/missions/useUpdateLocationMission";
import { useLocationMissionById } from "@/hooks/missions/useLocationMissionById";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, CalendarIcon, ExternalLink, Sparkles, Target, Trophy } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// --- Zod Schema ---
const missionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  metric: z.string().min(1, "Metric is required"),
  target: z.number().min(1, "Target must be at least 1"),
  reward: z.number().min(1, "Reward must be at least 1"),
  startDate: z.date({ error: "Start date is required." }),
  endDate: z.date({ error: "End date is required." }),
  imageUrls: z
    .array(z.string().url())
    .min(1, "At least one image is required."),
});
type FormValues = z.infer<typeof missionSchema>;

export default function EditMissionPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = use(params);
  const router = useRouter();

  const { data: mission, isLoading: isLoadingData } =
    useLocationMissionById(missionId);
  const { mutate: updateMission, isPending: isUpdating } =
    useUpdateLocationMission();

  // --- Set sensible defaultValues so the form is controlled immediately ---
  const form = useForm<FormValues>({
    resolver: zodResolver(missionSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      metric: "",
      target: 1,
      reward: 1,
      // default to today and tomorrow for usability; they will be reset when mission loads
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      imageUrls: [],
    },
  });

  useEffect(() => {
    if (mission) {
      form.reset({
        title: mission.title ?? "",
        description: mission.description ?? "",
        metric: mission.metric ?? "",
        target: mission.target ?? 1,
        reward: mission.reward ?? 1,
        startDate: mission.startDate ? new Date(mission.startDate) : new Date(),
        endDate: mission.endDate
          ? new Date(mission.endDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
        imageUrls: Array.isArray(mission.imageUrls) ? mission.imageUrls : [],
      });
    }
  }, [mission, form]);

  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    updateMission({ missionId, payload });
  }

  const missionStatus = useMemo(() => {
    if (!mission) {
      return {
        badge: null,
        status: "unknown" as const,
        helper: "",
        start: null as Date | null,
        end: null as Date | null,
      };
    }

    const now = new Date();
    const start = mission.startDate ? new Date(mission.startDate) : null;
    const end = mission.endDate ? new Date(mission.endDate) : null;

    let status: "scheduled" | "active" | "completed" = "active";
    if (start && start > now) status = "scheduled";
    else if (end && end < now) status = "completed";

    let helper = "";
    if (status === "scheduled" && start) {
      helper = `Starts ${formatDistanceToNow(start, { addSuffix: true })}`;
    } else if (status === "completed" && end) {
      helper = `Ended ${formatDistanceToNow(end, { addSuffix: true })}`;
    } else if (status === "active" && end) {
      helper = `Ends ${formatDistanceToNow(end, { addSuffix: true })}`;
    }

    const badge =
      status === "scheduled" ? (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          Scheduled
        </Badge>
      ) : status === "completed" ? (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Completed
        </Badge>
      ) : (
        <Badge className="bg-emerald-500/90 text-white">Active</Badge>
      );

    return { badge, status, helper, start, end };
  }, [mission]);

  const missionImages = useMemo(
    () => (Array.isArray(mission?.imageUrls) ? mission?.imageUrls.slice(0, 4) : []),
    [mission]
  );

  const metricLabel = useMemo(() => {
    if (!mission?.metric) return "Metric";
    return mission.metric
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }, [mission?.metric]);

  const dateRangeLabel = useMemo(() => {
    if (!missionStatus.start || !missionStatus.end) return "No schedule";
    return `${format(missionStatus.start, "PPP")} → ${format(missionStatus.end, "PPP")}`;
  }, [missionStatus.start, missionStatus.end]);

  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!mission) {
    return <div>Mission not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span>Back to missions</span>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {missionStatus.badge}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                Target {mission.target?.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                Reward {mission.reward?.toLocaleString()} pts
              </span>
              {missionStatus.helper && (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {missionStatus.helper}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {mission.locationId && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/business/locations/${mission.locationId}/missions/${mission.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View mission
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Mission details</CardTitle>
                  <CardDescription>
                    Keep the mission title descriptive, and outline what creators must do to earn the reward.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    name="title"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mission title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the mission requirements, helpful tips, or eligibility notes."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      name="metric"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metric</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. CHECK_INS, ORDERS" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="target"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Enter target"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="reward"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward (points)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="Enter reward"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Schedule & media</CardTitle>
                  <CardDescription>
                    Control when the mission is live and provide imagery to inspire participation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      name="startDate"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-between text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="endDate"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-between text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    name="imageUrls"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission imagery</FormLabel>
                        <FormControl>
                          <FileUpload value={field.value ?? []} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/60 bg-muted/40">
                <CardHeader>
                  <CardTitle>Mission snapshot</CardTitle>
                  <CardDescription>Quick reference for mission metadata.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      {missionStatus.badge}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Metric</span>
                      <span className="font-medium">{metricLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">{mission.target?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reward</span>
                      <span className="font-medium">{mission.reward?.toLocaleString()} pts</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Schedule</span>
                      <div className="font-medium">{dateRangeLabel}</div>
                      {missionStatus.helper && <div className="text-xs text-muted-foreground">{missionStatus.helper}</div>}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <span className="text-muted-foreground">Preview</span>
                    {missionImages && missionImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {missionImages.map((url, index) => (
                          <div
                            key={url + index}
                            className="relative h-24 overflow-hidden rounded-md border bg-background shadow-sm"
                          >
                            <img src={url} alt={`Mission image ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-md border border-dashed bg-background text-xs text-muted-foreground">
                        Images you upload will be shown here.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Publishing checklist</CardTitle>
                  <CardDescription>Confirm everything looks ready before saving.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="rounded-md border border-dashed bg-muted/30 p-3 leading-relaxed">
                    <p>• Target and reward align with your campaign goals.</p>
                    <p>• Schedule reflects when the mission should appear to creators.</p>
                    <p>• Imagery is high quality and clearly showcases the experience.</p>
                  </div>
                  <p className="leading-relaxed">
                    Need to pause or duplicate this mission later? Save your changes here, then manage additional actions
                    from the mission detail screen.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
