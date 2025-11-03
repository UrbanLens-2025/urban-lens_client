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
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/shared/FileUpload";
import { TagMultiSelect } from "@/components/shared/TagMultiSelect";
import { useAddTagsToLocation } from "@/hooks/tags/useAddTagsToLocation";
import { useRemoveTagsFromLocation } from "@/hooks/tags/useRemoveTagsFromLocation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";

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

  // 3. Điền (pre-fill) form khi dữ liệu được tải
  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        description: location.description,
        imageUrl: location.imageUrl || [],
        isVisibleOnMap: location.isVisibleOnMap ?? false,
        tagIds: location.tags.map((t) => t.tag.id),
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

      const originalTagIds = location?.tags.map((t) => t.tag.id) || [];
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Location: {location.name}</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Update Location Details</CardTitle>
          <CardDescription>
            Make changes to your active location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea {...field} />
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
                      <TagMultiSelect
                        selectedTagIds={field.value}
                        onSelectionChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DisplayTags tags={tags} maxCount={4} />

              <FormField
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Images</FormLabel>
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

              <FormField
                name="isVisibleOnMap"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Visible on Map</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Should this location be visible to the public on the
                        map?
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

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isUpdating || isAddingTags || isRemovingTags}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
