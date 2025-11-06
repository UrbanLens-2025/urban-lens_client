'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useCreatePublicLocation } from '@/hooks/admin/useCreatePublicLocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, CheckCircle2, MapPin, Image, Settings, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { LocationAddressPicker } from '@/components/shared/LocationAddressPicker';
import { DisplayTags } from '@/components/shared/DisplayTags';
import { useResolvedTags } from '@/hooks/tags/useResolvedTags';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAllTags } from '@/hooks/tags/useAllTags';
import type { Tag } from '@/types';
import { Badge } from '@/components/ui/badge';

const publicLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  latitude: z.number({ error: 'Please select a location on the map.' }).optional(),
  longitude: z.number({ error: 'Please select a location on the map.' }).optional(),
  radiusMeters: z.number().min(1, 'Radius must be at least 1 meter.'),
  addressLine: z.string().min(1, 'Street address is required.'),
  addressLevel1: z.string().min(1, 'Province/City is required'),
  addressLevel2: z.string().min(1, 'District/Ward is required'),
  imageUrl: z
    .array(z.string().url())
    .min(1, 'At least one location image is required.'),
  isVisibleOnMap: z.boolean(),
  tagIds: z.array(z.number()).min(1, 'At least one tag is required.'),
});
type FormValues = z.infer<typeof publicLocationSchema>;

const steps = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Tell us about your location',
    icon: CheckCircle2,
    fields: ['name', 'description', 'tagIds'] as const,
  },
  {
    id: 2,
    title: 'Address & Map',
    description: 'Set the location and coverage area',
    icon: MapPin,
    fields: ['addressLine', 'latitude', 'longitude'] as const,
  },
  {
    id: 3,
    title: 'Images & Settings',
    description: 'Upload photos and configure visibility',
    icon: Image,
    fields: ['imageUrl', 'isVisibleOnMap'] as const,
  },
];

const INITIAL_DISPLAY_COUNT = 5;

export default function CreatePublicLocationPage() {
  const router = useRouter();
  const { mutate: createLocation, isPending } = useCreatePublicLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(publicLocationSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      addressLine: '',
      addressLevel1: '',
      addressLevel2: '',
      latitude: undefined,
      longitude: undefined,
      radiusMeters: 1,
      imageUrl: [],
      tagIds: [],
      isVisibleOnMap: true,
    },
  });

  const watchedValues = form.watch();
  const { resolvedTags: tags } = useResolvedTags(watchedValues.tagIds);
  const { data: allTags, isLoading: isLoadingTags } = useAllTags();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const selectedTagIds = watchedValues.tagIds || [];

  // Filter to only show LOCATION_TYPE tags for locations
  const tagsFromDb: Tag[] = (allTags || []).filter((tag) => tag.groupName === 'LOCATION_TYPE');
  const groupedTags = tagsFromDb.reduce((acc: Record<string, Tag[]>, tag: Tag) => {
    const group = tag.groupName || 'Others';
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  // Check if at least one LOCATION_TYPE tag is selected
  const locationTypeTagIds = (allTags || [])
    .filter((tag) => tag.groupName === 'LOCATION_TYPE')
    .map((tag) => tag.id);
  const hasLocationType = selectedTagIds.some((id) => locationTypeTagIds.includes(id));

  const toggleTag = (tagId: number, groupName: string | null) => {
    const group = groupName || 'Others';
    // LOCATION_TYPE: single selection (required)
    if (group === 'LOCATION_TYPE') {
      if (selectedTagIds.includes(tagId)) {
        form.setValue('tagIds', selectedTagIds.filter((id) => id !== tagId), { shouldValidate: true });
      } else {
        const locationTypeTags = groupedTags['LOCATION_TYPE']?.map((t) => t.id) || [];
        const newSelection = selectedTagIds.filter((id) => !locationTypeTags.includes(id));
        form.setValue('tagIds', [...newSelection, tagId], { shouldValidate: true });
      }
    } else {
      // Other groups: multiple selection (shouldn't happen since we filter to LOCATION_TYPE only)
      const newSelection = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId];
      form.setValue('tagIds', newSelection, { shouldValidate: true });
    }
  };

  const getGroupLabel = (group: string) => {
    if (group === 'Others') return 'Others';
    return group
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') + (group === 'LOCATION_TYPE' ? ' (Select One)' : '');
  };

  const getFilteredTags = (tags: Tag[], groupName: string) => {
    const term = (searchTerms[groupName] || '').toLowerCase();
    return tags.filter((t) => t.displayName.toLowerCase().includes(term));
  };
  const getDisplayedTags = (tags: Tag[], groupName: string) => {
    const filtered = getFilteredTags(tags, groupName);
    const isExpanded = expandedGroups[groupName];
    return isExpanded ? filtered : filtered.slice(0, INITIAL_DISPLAY_COUNT);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNextStep = async () => {
    const fields = steps[currentStep].fields;
    if (fields) {
      // Additional validation for LOCATION_TYPE in step 1
      if (currentStep === 0 && fields.includes('tagIds')) {
        if (!hasLocationType) {
          form.setError('tagIds', {
            type: 'manual',
            message: 'At least one location type is required. Please select a location type.',
          });
          await form.trigger('tagIds', { shouldFocus: true });
          return;
        }
      }
      
      const output = await form.trigger(fields, { shouldFocus: true });
      if (!output) return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

  async function onSubmit(values: FormValues) {
    // Validate LOCATION_TYPE requirement
    if (!hasLocationType) {
      form.setError('tagIds', {
        type: 'manual',
        message: 'At least one location type is required. Please select a location type.',
      });
      await form.trigger('tagIds', { shouldFocus: true });
      return;
    }

    // Note: tagIds might not be in the payload type, but we'll include it if the API accepts it
    const { tagIds, ...payload } = values;
    createLocation(payload as any);
  }

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Public Location</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add a new public location to the platform
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                        isCompleted && 'bg-primary text-primary-foreground border-primary',
                        isActive && 'bg-primary text-primary-foreground border-primary',
                        !isActive && !isCompleted && 'bg-muted border-muted-foreground/20'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="mt-2 text-xs text-center max-w-[80px]">
                      <div
                        className={cn(
                          'font-medium',
                          isActive && 'text-primary',
                          !isActive && 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 mx-2 transition-colors',
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* === STEP 1: Basic Information === */}
              <div className={cn('space-y-6', currentStep !== 0 && 'hidden')}>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Provide basic details about your location. This information will be visible to event creators.
                  </AlertDescription>
                </Alert>
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Downtown Event Hall" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a clear, descriptive name for your location
                      </FormDescription>
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
                          placeholder="Describe your location, amenities, capacity, and what makes it special..."
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Help event creators understand what your location offers
                      </FormDescription>
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
                      {isLoadingTags ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(groupedTags)
                            .sort(([a], [b]) => {
                              if (a === 'Others') return 1;
                              if (b === 'Others') return -1;
                              return a.localeCompare(b);
                            })
                            .map(([groupName, tagsInGroup]) => {
                              const filtered = getFilteredTags(tagsInGroup, groupName);
                              const displayed = getDisplayedTags(tagsInGroup, groupName);
                              const hasMore = filtered.length > INITIAL_DISPLAY_COUNT;
                              const isGroupExpanded = expandedGroups[`group_${groupName}`] ?? true;
                              const isExpandedList = expandedGroups[groupName];
                              const isLocationType = groupName === 'LOCATION_TYPE';
                              const hasError = isLocationType && !hasLocationType && form.formState.errors.tagIds;
                              return (
                                <div 
                                  key={groupName} 
                                  className={cn(
                                    'border rounded-lg p-3 space-y-2 bg-muted/30',
                                    hasError && 'bg-destructive/5 border-destructive border-2 shadow-md'
                                  )}
                                >
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
                                        <span className="text-xs text-muted-foreground font-normal ml-2">({filtered.length})</span>
                                      </h3>
                                    </button>
                                    {isGroupExpanded && (
                                      <div className="relative w-40">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                          type="text"
                                          placeholder="Search tags..."
                                          value={searchTerms[groupName] || ''}
                                          onChange={(e) =>
                                            setSearchTerms((prev) => ({
                                              ...prev,
                                              [groupName]: e.target.value,
                                            }))
                                          }
                                          className="h-8 pl-8 text-xs"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  {isGroupExpanded && (
                                    <>
                                      <div className="flex flex-wrap gap-2">
                                        {displayed.map((tag) => {
                                          const isSelected = selectedTagIds.includes(tag.id);
                                          return (
                                            <Badge
                                              key={tag.id}
                                              variant={isSelected ? 'default' : 'outline'}
                                              className={cn(
                                                'cursor-pointer transition-all',
                                                isSelected && 'ring-2 ring-primary'
                                              )}
                                              style={
                                                isSelected
                                                  ? {
                                                      backgroundColor: tag.color,
                                                      color: '#fff',
                                                      borderColor: tag.color,
                                                    }
                                                  : {}
                                              }
                                              onClick={() => toggleTag(tag.id, tag.groupName)}
                                            >
                                              <span className="mr-1">{tag.icon}</span>
                                              {tag.displayName}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                      {hasMore && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedGroups((prev) => ({
                                              ...prev,
                                              [groupName]: !prev[groupName],
                                            }))
                                          }
                                          className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                          {isExpandedList ? (
                                            <>
                                              <ChevronUp className="h-3 w-3" />
                                              Show Less
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDown className="h-3 w-3" />
                                              View More ({filtered.length - INITIAL_DISPLAY_COUNT} more)
                                            </>
                                          )}
                                        </button>
                                      )}
                                      {filtered.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                          No tags found for "{searchTerms[groupName]}"
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                      <FormDescription>
                        Select tags that best describe your location (e.g., Indoor, Outdoor, Parking Available)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {tags.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-2">Selected Tags:</p>
                    <DisplayTags tags={tags} maxCount={10} />
                  </div>
                )}
              </div>

              {/* === STEP 2: Address & Map === */}
              <div className={cn('space-y-6', currentStep !== 1 && 'hidden')}>
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Set the exact location and define the coverage area where events can be booked.
                  </AlertDescription>
                </Alert>
                <LocationAddressPicker />
                <FormField
                  control={form.control}
                  name="radiusMeters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Effective Radius: {field.value} meters
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={(value) => field.onChange(value[0])}
                          defaultValue={[field.value]}
                          className="pt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Define how far from the location point events can be booked (1-100 meters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === STEP 3: Images & Settings === */}
              <div className={cn('space-y-6', currentStep !== 2 && 'hidden')}>
                <Alert>
                  <Image className="h-4 w-4" />
                  <AlertDescription>
                    Upload high-quality photos of your location and configure visibility settings.
                  </AlertDescription>
                </Alert>
                <FormField
                  name="imageUrl"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Photos (at least 1 required)</FormLabel>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormDescription>
                        Showcase your location with clear, professional photos. Multiple angles are recommended.
                      </FormDescription>
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
                        <FormLabel className="text-base">Visible on Map</FormLabel>
                        <FormDescription>
                          Allow this location to appear on the public map for event creators to discover
                        </FormDescription>
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
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={isFirstStep ? () => router.back() : handlePrevStep}
                  disabled={isPending}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {isFirstStep ? 'Cancel' : 'Previous'}
                </Button>
                {isLastStep ? (
                  <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Location
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNextStep} size="lg">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
