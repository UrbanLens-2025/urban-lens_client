'use client';

import { useState, useMemo } from 'react';
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
import { Loader2, CheckCircle2, MapPin, Image as ImageIcon, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Search, X, FileText, Tag as TagIcon, Eye, Ruler, Save } from 'lucide-react';
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
import { useTagCategories } from '@/hooks/tags/useTagCategories';
import type { TagCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';

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
    icon: ImageIcon,
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
  const { data: tagCategories, isLoading: isLoadingTags } = useTagCategories("LOCATION");
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedTagIds = watchedValues.tagIds || [];

  // Filter tags based on search term
  const filteredTags = useMemo(() => {
    if (!tagCategories) return [];
    const term = searchTerm.toLowerCase();
    return tagCategories.filter((tag) =>
      tag.name.toLowerCase().includes(term) ||
      tag.description.toLowerCase().includes(term)
    );
  }, [tagCategories, searchTerm]);

  // Get displayed tags (limited if not expanded)
  const displayedTags = useMemo(() => {
    return isExpanded ? filteredTags : filteredTags.slice(0, INITIAL_DISPLAY_COUNT);
  }, [filteredTags, isExpanded]);

  const hasMore = filteredTags.length > INITIAL_DISPLAY_COUNT;

  // Handle tag selection - allow multiple selections
  const toggleTag = (tagId: number) => {
    const isSelected = selectedTagIds.includes(tagId);
    if (isSelected) {
      form.setValue('tagIds', selectedTagIds.filter((id) => id !== tagId), { shouldValidate: true });
    } else {
      // Add to current selection (multiple allowed)
      form.setValue('tagIds', [...selectedTagIds, tagId], { shouldValidate: true });
    }
  };

  // Check if at least one tag is selected
  const hasLocationType = selectedTagIds.length > 0;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNextStep = async () => {
    const fields = steps[currentStep].fields;
    if (fields) {
      // Additional validation for tagIds in step 1
      if (currentStep === 0 && Array.isArray(fields) && fields.includes('tagIds' as any)) {
        if (!hasLocationType) {
          form.setError('tagIds', {
            type: 'manual',
            message: 'At least one tag category is required. Please select at least one tag category.',
          });
          await form.trigger('tagIds', { shouldFocus: true });
          return;
        }
      }
      
      const output = await form.trigger(fields as any, { shouldFocus: true });
      if (!output) return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

  async function onSubmit(values: FormValues) {
    // Validate tag categories requirement
    if (!hasLocationType) {
      form.setError('tagIds', {
        type: 'manual',
        message: 'At least one tag category is required. Please select at least one tag category.',
      });
      await form.trigger('tagIds', { shouldFocus: true });
      return;
    }

    // Include tagIds in the payload
    createLocation(values as any);
  }

  return (
    <PageContainer maxWidth="2xl">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Create Public Location
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Add a new public location to the platform
            </p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                {(() => {
                  const StepIcon = steps[currentStep].icon;
                  return (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <StepIcon className="h-4 w-4 text-primary" />
                    </div>
                  );
                })()}
                Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium border-primary/20">
              {Math.round(progress)}% Complete
            </Badge>
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
                        'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-md',
                        isCompleted && 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg scale-105',
                        isActive && 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary shadow-lg scale-110 ring-4 ring-primary/20',
                        !isActive && !isCompleted && 'bg-muted/50 border-muted-foreground/20 text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-3 text-xs text-center max-w-[100px]">
                      <div
                        className={cn(
                          'font-semibold transition-colors',
                          isActive && 'text-primary',
                          isCompleted && 'text-primary/80',
                          !isActive && !isCompleted && 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-3 relative">
                      <div className="h-0.5 bg-muted absolute top-6 left-0 right-0" />
                      <div
                        className={cn(
                          'h-0.5 absolute top-6 left-0 transition-all duration-500 bg-gradient-to-r from-primary to-primary/50',
                          isCompleted ? 'right-0' : 'right-full'
                        )}
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <Progress value={progress} className="mt-6 h-2" />
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* === STEP 1: Basic Information === */}
              <div className={cn('space-y-8', currentStep !== 0 && 'hidden')}>
                <Alert className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <AlertDescription className="text-sm font-medium">
                    Provide basic details about your location. This information will be visible to event creators.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Basic Information</h2>
                  </div>

                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <MapPin className="h-4 w-4 text-primary" />
                          Location Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Downtown Event Hall" 
                            className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-sm">
                          Choose a clear, descriptive name for your location
                        </FormDescription>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <FileText className="h-4 w-4 text-primary" />
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your location, amenities, capacity, and what makes it special..."
                            className="min-h-[120px] border-2 border-primary/20 focus:ring-2 focus:ring-primary/20 resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-sm">
                          Help event creators understand what your location offers
                        </FormDescription>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="tagIds"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <TagIcon className="h-4 w-4 text-primary" />
                          Location Tags
                        </FormLabel>
                        {isLoadingTags ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'border-2 rounded-xl p-4 space-y-3 bg-gradient-to-br from-card to-muted/20 shadow-sm transition-all',
                              !hasLocationType && form.formState.errors.tagIds && 'bg-destructive/5 border-destructive border-2 shadow-md ring-2 ring-destructive/20'
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold">
                                  Select Location Tags
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {filteredTags.length} available
                                </Badge>
                              </div>
                              <div className="relative w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder="Search tags..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="h-10 pl-9 pr-9 text-sm border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                                />
                                {searchTerm.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                              {displayedTags.map((tag: TagCategory) => {
                                const isSelected = selectedTagIds.includes(tag.id);
                                return (
                                  <Badge
                                    key={tag.id}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className={cn(
                                      'cursor-pointer transition-all px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow-md',
                                      isSelected && 'ring-2 ring-offset-2 ring-primary/30 scale-105',
                                      !isSelected && 'hover:scale-105 hover:bg-muted/50'
                                    )}
                                    style={
                                      isSelected
                                        ? {
                                            backgroundColor: tag.color,
                                            color: '#fff',
                                            borderColor: tag.color,
                                          }
                                        : { borderColor: tag.color, color: tag.color }
                                    }
                                    onClick={() => toggleTag(tag.id)}
                                    title={tag.description}
                                  >
                                    <span className="mr-1.5">{tag.icon}</span>
                                    {tag.name}
                                  </Badge>
                                );
                              })}
                            </div>

                            {hasMore && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full h-9 text-sm border border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="mr-2 h-4 w-4" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="mr-2 h-4 w-4" />
                                    View More ({filteredTags.length - INITIAL_DISPLAY_COUNT} more)
                                  </>
                                )}
                              </Button>
                            )}

                            {filteredTags.length === 0 && searchTerm && (
                              <div className="text-center py-6">
                                <p className="text-sm text-muted-foreground">
                                  No tags found for "<span className="font-medium">{searchTerm}</span>"
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        <FormDescription className="text-sm">
                          Select tags that best describe your location (you can select multiple)
                        </FormDescription>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                  {tags.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-2 border-primary/10">
                      <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-primary" />
                        Selected Tag Categories:
                      </p>
                      <DisplayTags tags={tags} maxCount={10} />
                    </div>
                  )}
                </div>
              </div>

              {/* === STEP 2: Address & Map === */}
              <div className={cn('space-y-8', currentStep !== 1 && 'hidden')}>
                <Alert className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                  <AlertDescription className="text-sm font-medium">
                    Set the exact location and define the coverage area where events can be booked.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Address & Location</h2>
                  </div>

                  <LocationAddressPicker />

                  <FormField
                    control={form.control}
                    name="radiusMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <Ruler className="h-4 w-4 text-primary" />
                          Effective Radius: <span className="text-primary font-bold">{field.value} meters</span>
                        </FormLabel>
                        <FormControl>
                          <div className="px-4 py-6 border-2 border-primary/10 rounded-xl bg-gradient-to-r from-muted/50 to-transparent">
                            <Slider
                              min={1}
                              max={100}
                              step={1}
                              onValueChange={(value) => field.onChange(value[0])}
                              defaultValue={[field.value]}
                              className="pt-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                              <span>1m</span>
                              <span>50m</span>
                              <span>100m</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-sm">
                          Define how far from the location point events can be booked (1-100 meters)
                        </FormDescription>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* === STEP 3: Images & Settings === */}
              <div className={cn('space-y-8', currentStep !== 2 && 'hidden')}>
                <Alert className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <AlertDescription className="text-sm font-medium">
                    Upload high-quality photos of your location and configure visibility settings.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Images & Visibility</h2>
                  </div>

                  <FormField
                    name="imageUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <ImageIcon className="h-4 w-4 text-primary" />
                          Location Photos
                        </FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 bg-muted/30 hover:border-primary/40 transition-colors">
                            <FileUpload
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-sm">
                          Showcase your location with clear, professional photos. Multiple angles are recommended.
                        </FormDescription>
                        <FormMessage className="text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="isVisibleOnMap"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-primary/10 p-6 bg-gradient-to-r from-muted/50 to-transparent hover:border-primary/20 transition-all">
                        <div className="space-y-1 flex-1">
                          <FormLabel className="flex items-center gap-2 text-base font-semibold">
                            <Eye className="h-4 w-4 text-primary" />
                            Visible on Map
                          </FormLabel>
                          <FormDescription className="text-sm">
                            Allow this location to appear on the public map for event creators to discover
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-primary/10 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-6 px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={isFirstStep ? () => router.back() : handlePrevStep}
                  disabled={isPending}
                  className="h-12 border-2 border-primary/20 hover:bg-muted"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {isFirstStep ? 'Cancel' : 'Previous'}
                </Button>
                {isLastStep ? (
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Location
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    className="h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
