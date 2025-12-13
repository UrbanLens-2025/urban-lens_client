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
import {
  Loader2,
  CheckCircle2,
  MapPin,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  Tag as TagIcon,
  Eye,
  Info,
} from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LocationAddressPicker } from '@/components/shared/LocationAddressPicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocationTagsSelector } from '@/components/locations/LocationTagsSelector';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

const publicLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  latitude: z
    .number({ error: 'Please select a location on the map.' })
    .optional(),
  longitude: z
    .number({ error: 'Please select a location on the map.' })
    .optional(),
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

// Helper function to count characters
const countCharacters = (text: string): number => {
  return text.length;
};

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
  const descriptionValue = form.watch('description');
  const selectedTagIds = watchedValues.tagIds || [];
  const hasLocationType = selectedTagIds.length > 0;

  const currentStepData = steps[currentStep];

  const handleNextStep = async () => {
    const fields = steps[currentStep].fields;
    if (fields) {
      // Additional validation for tagIds in step 1
      if (
        currentStep === 0 &&
        Array.isArray(fields) &&
        fields.includes('tagIds' as any)
      ) {
        if (!hasLocationType) {
          form.setError('tagIds', {
            type: 'manual',
            message:
              'At least one tag category is required. Please select at least one tag category.',
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
        message:
          'At least one tag category is required. Please select at least one tag category.',
      });
      await form.trigger('tagIds', { shouldFocus: true });
      return;
    }

    createLocation(values as any, {
      onSuccess: () => {
        toast.success('Location created successfully!');
        router.push('/admin/locations');
      },
    });
  }

  return (
    <div className='space-y-8 max-w-5xl mx-auto px-4 py-6'>
      {/* Header */}
      <div className='flex items-start gap-4 pb-6 border-b-2 border-primary/20'>
        <div className='p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md'>
          <Building2 className='h-6 w-6' />
        </div>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <h1 className='text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text'>
              Public new Location
            </h1>
          </div>
          <p className='text-base text-muted-foreground'>
            {currentStepData.description}
          </p>
          <div className='mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
            <span className='text-sm text-blue-700 dark:text-blue-300 font-medium'>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>
      </div>

      {/* Step Progress Navigation */}
      <div className='space-y-6'>
        {/* Step Indicators */}
        <div className='flex items-center justify-between relative'>
          {/* Progress Line Background */}
          <div className='absolute top-7 left-0 right-0 h-0.5 bg-muted/50 z-0' />

          {/* Progress Line Fill */}
          <div
            className='absolute top-7 left-0 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60 z-0 transition-all duration-500 ease-out'
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div
                key={step.id}
                className='flex items-center flex-1 relative z-10'
              >
                <div className='flex flex-col items-center flex-1'>
                  <div className='relative flex items-center justify-center w-full mb-3'>
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg relative z-10',
                        isCompleted &&
                          'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary shadow-primary/30',
                        isActive &&
                          'bg-gradient-to-br from-primary via-primary/95 to-primary text-primary-foreground border-primary scale-110 shadow-xl shadow-primary/40 ring-4 ring-primary/20',
                        !isActive &&
                          !isCompleted &&
                          'bg-background border-muted-foreground/20 text-muted-foreground hover:border-primary/30 hover:scale-105'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className='h-5 w-5' />
                      ) : (
                        <Icon
                          className={cn(
                            'h-5 w-5 transition-all',
                            isActive && 'scale-110'
                          )}
                        />
                      )}
                    </div>
                  </div>
                  <div className='text-center space-y-1'>
                    <div
                      className={cn(
                        'text-sm font-semibold transition-colors',
                        isActive && 'text-primary',
                        isCompleted && 'text-primary/80',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </div>
                    <div
                      className={cn(
                        'text-xs transition-colors',
                        isActive && 'text-primary/70',
                        !isActive && 'text-muted-foreground/70'
                      )}
                    >
                      {step.description}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6'
          id='location-form'
        >
          {/* === STEP 1: Basic Information === */}
          <div
            className={cn(
              'space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500',
              currentStep !== 0 && 'hidden'
            )}
          >
            {/* Card 1: Location Name & Description */}
            <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden'>
              <CardHeader className='pb-4 border-b border-primary/10'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10'>
                    <Building2 className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <CardTitle className='text-xl font-bold'>
                      Basic Information
                    </CardTitle>
                    <CardDescription className='text-sm mt-1'>
                      Provide essential details about your location
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className=''>
                <div className='grid grid-cols-1 gap-6'>
                  <FormField
                    name='name'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className='flex items-center gap-2 mb-2'>
                          <FormLabel className='flex items-center gap-2 text-base font-semibold'>
                            <div className='p-1 rounded-md bg-primary/10'>
                              <Building2 className='h-4 w-4 text-primary' />
                            </div>
                            Location Name
                            <span className='text-destructive'>*</span>
                          </FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className='h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='max-w-xs'>
                                Choose a clear, descriptive name that helps
                                event creators identify your location. This will
                                be visible in search results and location
                                listings.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <FormControl>
                          <Input
                            placeholder='e.g., Downtown Event Hall'
                            className={cn(
                              'h-12 border-2 transition-all text-base',
                              fieldState.error
                                ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                                : 'border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name='description'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className='flex items-center gap-2 mb-2'>
                          <FormLabel className='flex items-center gap-2 text-base font-semibold'>
                            <div className='p-1 rounded-md bg-primary/10'>
                              <FileText className='h-4 w-4 text-primary' />
                            </div>
                            Description
                            <span className='text-destructive'>*</span>
                          </FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className='h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='max-w-xs'>
                                Provide detailed information about your location
                                including amenities, capacity, unique features,
                                and what makes it suitable for events. This
                                helps creators make informed decisions.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <FormControl>
                          <div className='space-y-2'>
                            <Textarea
                              placeholder='Describe your location, amenities, capacity, and what makes it special...'
                              rows={6}
                              className={cn(
                                'resize-none border-2 transition-all text-base min-h-[120px]',
                                fieldState.error
                                  ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20'
                                  : 'border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
                              )}
                              {...field}
                            />
                            <div className='flex justify-between items-center'>
                              <FormMessage />
                              <span className='text-xs text-muted-foreground'>
                                {countCharacters(descriptionValue || '')}{' '}
                                characters
                              </span>
                            </div>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name='tagIds'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className='flex items-center gap-2 mb-2'>
                          <FormLabel className='flex items-center gap-2 text-base font-semibold'>
                            <div className='p-1 rounded-md bg-primary/10'>
                              <TagIcon className='h-4 w-4 text-primary' />
                            </div>
                            Location Categories
                            <span className='text-destructive'>*</span>
                          </FormLabel>
                        </div>
                        <FormControl>
                          <LocationTagsSelector
                            value={field.value}
                            onChange={(ids) =>
                              form.setValue('tagIds', ids, {
                                shouldValidate: true,
                              })
                            }
                            error={form.formState.errors.tagIds?.message}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* === STEP 2: Address & Map === */}
          <div
            className={cn(
              'space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500',
              currentStep !== 1 && 'hidden'
            )}
          >
            <Alert className='bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-sm'>
              <MapPin className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              <AlertDescription className='text-sm text-blue-900 dark:text-blue-200 ml-2'>
                <strong className='font-semibold'>Tip:</strong> You can search
                for an address, click on the map to select a location, or
                manually fill in location details below.
              </AlertDescription>
            </Alert>

            <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden'>
              <CardHeader className='pb-4 border-b border-primary/10'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10'>
                    <MapPin className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <CardTitle className='text-xl font-bold'>
                      Location & Address
                    </CardTitle>
                    <CardDescription className='text-sm mt-1'>
                      Set your location on the map and provide address details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-6'>
                <div className='space-y-6'>
                  <LocationAddressPicker />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* === STEP 3: Images & Settings === */}
          <div
            className={cn(
              'space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500',
              currentStep !== 2 && 'hidden'
            )}
          >
            {/* Location Photos Card */}
            <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden'>
              <CardHeader className='pb-4 border-b border-primary/10'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10'>
                    <ImageIcon className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <CardTitle className='text-xl font-bold'>
                      Location Photos
                    </CardTitle>
                    <CardDescription className='text-sm mt-1'>
                      Showcase your location with high-quality images
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-6'>
                <FormField
                  name='imageUrl'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className='flex items-center gap-2 mb-2'>
                        <FormLabel className='flex items-center gap-2 text-base font-semibold'>
                          <div className='p-1 rounded-md bg-primary/10'>
                            <ImageIcon className='h-4 w-4 text-primary' />
                          </div>
                          Location Photos
                          <span className='text-destructive'>*</span>
                        </FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className='h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors' />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className='max-w-xs'>
                              Upload clear, high-quality photos of your
                              location. Multiple angles help event creators
                              visualize the space better.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <div className='flex justify-between items-center mt-2'>
                        <FormMessage />
                        <FormDescription className='text-xs text-muted-foreground'>
                          At least 1 photo required. Multiple angles
                          recommended.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Visibility Settings Card */}
            <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden'>
              <CardHeader className='pb-4 border-b border-primary/10'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10'>
                    <Eye className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <CardTitle className='text-xl font-bold'>
                      Visibility Settings
                    </CardTitle>
                    <CardDescription className='text-sm mt-1'>
                      Configure how your location appears to event creators
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-6'>
                <FormField
                  name='isVisibleOnMap'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between space-y-0 rounded-lg border-2 border-primary/10 p-4 bg-gradient-to-r from-muted/50 to-transparent hover:border-primary/20 transition-all'>
                      <div className='space-y-1 flex-1 pr-4'>
                        <FormLabel className='flex items-center gap-2 text-base font-semibold cursor-pointer'>
                          <Eye className='h-4 w-4 text-primary' />
                          Visible on Map
                        </FormLabel>
                        <FormDescription className='text-sm'>
                          Allow this location to appear on the public map for
                          event creators to discover and book
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className='data-[state=checked]:bg-primary'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Navigation Footer */}
          <div className='px-4 py-3 mt-6'>
            <div className='flex justify-between items-center max-w-5xl mx-auto'>
              <Button
                type='button'
                variant='outline'
                onClick={handlePrevStep}
                disabled={currentStep === 0 || isPending}
                className={cn(
                  'h-10 px-4 border transition-all',
                  currentStep === 0 && 'invisible',
                  'border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                <ArrowLeft className='mr-2 h-3.5 w-3.5' />
                Previous
              </Button>

              {currentStep < steps.length - 1 && (
                <Button
                  type='button'
                  onClick={handleNextStep}
                  disabled={isPending}
                  className='h-10 px-6 text-sm font-semibold  hover:from-primary/90 hover:to-primary shadow-md transition-all'
                >
                  Next Step
                  <ArrowRight className='ml-2 h-3.5 w-3.5' />
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button
                  type='submit'
                  disabled={isPending}
                  className='h-10 px-6 text-sm font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md transition-all'
                >
                  {isPending ? (
                    <>
                      <Loader2 className='mr-2 h-3.5 w-3.5 animate-spin' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className='mr-2 h-3.5 w-3.5' />
                      Create Location
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
