"use client";

import { use, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { useLocationById } from "@/hooks/locations/useLocationById";
import { useUpdateLocation } from "@/hooks/locations/useUpdateLocation";
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
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
  ImagePlus,
  Tag,
  Save,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/shared/FileUpload";
import { useAddTagsToLocation } from "@/hooks/tags/useAddTagsToLocation";
import { useRemoveTagsFromLocation } from "@/hooks/tags/useRemoveTagsFromLocation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LocationTagsSelector } from "@/components/locations/LocationTagsSelector";

const updateLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.array(z.string().url()).min(1, "At least one image is required"),
  isVisibleOnMap: z.boolean().optional(),
  tagIds: z.array(z.number()).min(1, "At least one tag is required"),
});
type FormValues = z.infer<typeof updateLocationSchema>;

export default function EditLocationPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: location, isLoading: isLoadingData } =
    useLocationById(locationId);

  const { mutateAsync: updateLocation, isPending: isUpdating } =
    useUpdateLocation();
  const { mutateAsync: addTags, isPending: isAddingTags } =
    useAddTagsToLocation();
  const { mutateAsync: removeTags, isPending: isRemovingTags } =
    useRemoveTagsFromLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(updateLocationSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      imageUrl: [],
      isVisibleOnMap: false,
      tagIds: [],
    },
  });
  
  const watchedValues = form.watch();

  const { resolvedTags: tags } = useResolvedTags(watchedValues.tagIds);
  const isDirty = form.formState.isDirty;

  // 3. Điền (pre-fill) form khi dữ liệu được tải
  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        description: location.description,
        imageUrl: location.imageUrl || [],
        isVisibleOnMap: location.isVisibleOnMap ?? false,
        tagIds: location.tags.map((t) => t.id),
      });
    }
  }, [location, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const {
        name,
        description,
        imageUrl,
        isVisibleOnMap,
        tagIds: newTagIds,
      } = values;

      const mainPayload = {
        name,
        description,
        imageUrl,
        isVisibleOnMap: isVisibleOnMap ?? false,
        tagIds: newTagIds,
      };

      const originalTagIds = location?.tags.map((t) => t.id) || [];
      const tagsToAdd = newTagIds.filter((id) => !originalTagIds.includes(id));
      const tagsToRemove = originalTagIds.filter(
        (id) => !newTagIds.includes(id)
      );

      const mutationPromises = [];

      mutationPromises.push(
        updateLocation({ locationId, payload: mainPayload })
      );

      if (tagsToAdd.length > 0) {
        mutationPromises.push(addTags({ locationId, tagIds: tagsToAdd }));
      }

      if (tagsToRemove.length > 0) {
        mutationPromises.push(removeTags({ locationId, tagIds: tagsToRemove }));
      }

      await Promise.all(mutationPromises);

      queryClient.invalidateQueries({ queryKey: ["myLocations"] });
      queryClient.invalidateQueries({ queryKey: ["location", locationId] });
      toast.success("Location updated successfully");
      router.refresh();
    } catch (err) {
      toast.error("An error occurred while saving. Please try again.");
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!location) {
    return <div>Location not found.</div>;
  }

  const previewImages = watchedValues.imageUrl ?? [];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span>Back to location details</span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
        <div className="flex flex-col gap-6 bg-muted/40 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
              Editing location
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {location.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location.addressLine}</span>
              <span>•</span>
              <span>
                {location.addressLevel2}, {location.addressLevel1}
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            <p>
              Last updated&nbsp;
              <span className="font-medium text-foreground">
                {new Date(location.updatedAt).toLocaleString()}
              </span>
            </p>
            <p>Created {new Date(location.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Tag className="h-4 w-4 text-primary" />
                  Core details
                </CardTitle>
                <CardDescription>
                  Update the information customers will see on the listing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Skyline Rooftop Venue"
                          {...field}
                        />
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
                          rows={5}
                          placeholder="Describe the ambiance, capacity, and unique features guests should know."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="tagIds"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <LocationTagsSelector
                          value={field.value}
                          onChange={(ids) => field.onChange(ids)}
                          error={form.formState.errors.tagIds?.message}
                          helperText="Select the location type and other relevant categories."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Selected tags
                  </p>
                  <div className="mt-3">
                    {tags.length > 0 ? (
                      <DisplayTags tags={tags} maxCount={10} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No tags selected yet.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  Gallery
                </CardTitle>
                <CardDescription>
                  Add at least one high-quality image to showcase the space.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  name="imageUrl"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Visibility & publishing
                </CardTitle>
                <CardDescription>
                  Control whether this location appears to creators on the map.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  name="isVisibleOnMap"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 bg-muted/10 p-4">
                      <div className="space-y-1">
                        <FormLabel>Visible on map</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Toggle off if you want to temporarily hide this location from creators.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  {watchedValues.isVisibleOnMap ? (
                    <>
                      <Eye className="h-4 w-4 text-emerald-500" />
                      <span>This location will appear in venue search results.</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>This location is hidden and only accessible via direct links.</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse items-stretch gap-3 border-t pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isUpdating || isAddingTags || isRemovingTags}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isUpdating}
                className="sm:min-w-[160px]"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Current publishing state
              </CardTitle>
              <CardDescription>
                Quick snapshot of how this location appears today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2">
                <div className="text-sm text-muted-foreground">Visibility</div>
                <Badge
                  variant={location.isVisibleOnMap ? "secondary" : "outline"}
                  className={location.isVisibleOnMap ? "bg-emerald-500/10 text-emerald-600" : ""}
                >
                  {location.isVisibleOnMap ? "Visible" : "Hidden"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total check-ins</span>
                <span className="font-semibold">
                  {(location.totalCheckIns || "0").toString()}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Live tags
                </p>
                <div className="mt-2">
                  {location.tags.length > 0 ? (
                    <DisplayTags tags={location.tags} maxCount={10} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tags currently assigned.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
