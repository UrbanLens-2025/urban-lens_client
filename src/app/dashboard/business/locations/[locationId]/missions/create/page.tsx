'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

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
} from '@/components/ui/form';
import { Loader2, CalendarIcon, Rocket } from 'lucide-react';
import { useLocationById } from '@/hooks/locations/useLocationById';
import { FileUpload } from '@/components/shared/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateLocationMission } from '@/hooks/missions/useCreateLocationMission';
import { Calendar } from '@/components/ui/calendar';
import { use } from 'react';

const missionSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    target: z.number().min(1, 'Target must be at least 1'),
    reward: z.number().min(1, 'Reward must be at least 1'),
    startDate: z.date({
      required_error: 'Start date is required.',
      invalid_type_error: 'Start date is required.',
    }),
    endDate: z.date({
      required_error: 'End date is required.',
      invalid_type_error: 'End date is required.',
    }),
    imageUrls: z
      .array(z.string().url())
      .min(1, 'At least one image is required.'),
  })
  .refine(
    (data) => {
      const today = startOfDay(new Date());
      return data.startDate >= today;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const today = startOfDay(new Date());
      return data.endDate >= today;
    },
    {
      message: 'End date cannot be in the past',
      path: ['endDate'],
    }
  )
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
type FormValues = z.infer<typeof missionSchema>;

export default function CreateMissionPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const { mutate: createMission, isPending } =
    useCreateLocationMission(locationId);
  const { data: location, isLoading: isLoadingLocation } =
    useLocationById(locationId);

  const form = useForm<FormValues>({
    resolver: zodResolver(missionSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      target: 1,
      reward: 0,
      imageUrls: [],
    },
  });

  const startDate = form.watch('startDate');

  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    createMission(payload);
  }

  if (isLoadingLocation) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className=' max-w-4xl mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h1 className='text-3xl font-bold'>Create a Mission</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Add a new mission for{' '}
            <span className='font-semibold text-primary'>
              {location?.name || 'Location Name'}
            </span>
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardContent className='space-y-6'>
              <FormField
                name='title'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='e.g., Check-in 5 times'
                        className='h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='description'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='Describe what this mission includes...'
                        rows={4}
                        className='resize-none'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  name='target'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          {...field}
                          value={
                            field.value != null && !isNaN(field.value)
                              ? field.value
                              : ''
                          }
                          onChange={(e) => {
                            const value = e.target.valueAsNumber;
                            field.onChange(isNaN(value) ? undefined : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='reward'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward (Points)</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          {...field}
                          value={
                            field.value != null && !isNaN(field.value)
                              ? field.value
                              : ''
                          }
                          onChange={(e) => {
                            const value = e.target.valueAsNumber;
                            field.onChange(isNaN(value) ? undefined : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  name='startDate'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = startOfDay(new Date());
                              return date < today;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name='endDate'
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = startOfDay(new Date());
                              const minDate = startDate
                                ? startOfDay(startDate)
                                : today;
                              return date < minDate;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                name='imageUrls'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Images</FormLabel>
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

          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type='submit' size='lg' disabled={isPending}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Create Mission
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
