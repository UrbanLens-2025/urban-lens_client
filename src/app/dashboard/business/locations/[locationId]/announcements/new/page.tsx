'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SingleFileUpload } from '@/components/shared/SingleFileUpload';
import { DateTimePickerField } from '@/components/shared/DateTimePickerField';
import { useLocationById } from '@/hooks/locations/useLocationById';
import { useCreateAnnouncement } from '@/hooks/announcements/useCreateAnnouncement';
import { Loader2, MapPin } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z
    .string()
    .min(10, 'Description should be at least 10 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  imageUrl: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
  isHidden: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function NewAnnouncementPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const { data: location, isLoading, isError } = useLocationById(locationId);
  const { mutate: createAnnouncement, isPending: isCreating } =
    useCreateAnnouncement();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      imageUrl: '',
      isHidden: false,
    },
  });

  useEffect(() => {
    if (!location && !isLoading && !isError) {
      router.push('/dashboard/business/locations');
    }
  }, [location, isLoading, isError, router]);

  const onSubmit = (values: AnnouncementFormValues) => {
    const isHidden = form.getValues('isHidden');
    createAnnouncement(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        imageUrl: values.imageUrl?.trim() ? values.imageUrl.trim() : undefined,
        isHidden: isHidden ?? false,
        locationId,
      },
      {
        onSuccess: (data) => {
          // Redirect to the detail view of the newly created announcement
          router.push(
            `/dashboard/business/locations/${locationId}/announcements/${data.id}`
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center text-muted-foreground'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-muted-foreground'>
        <p>
          We couldn&apos;t load this location. Please return to your locations
          list.
        </p>
        <Button asChild>
          <Link href='/dashboard/business/locations'>Back to locations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <Card className='border-border/60 shadow-sm'>
        <CardHeader>
          <CardTitle>Create announcement</CardTitle>
          <CardDescription>
            Publish news and updates for {location.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <div className='grid gap-6'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder='Announcement headline' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={6}
                          placeholder='Share the announcement details'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='startDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start at</FormLabel>
                        <FormControl>
                          <DateTimePickerField
                            value={field.value}
                            onChange={field.onChange}
                            error={form.formState.errors.startDate?.message}
                            minDate={new Date()}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='endDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End at</FormLabel>
                        <FormControl>
                          <DateTimePickerField
                            value={field.value}
                            onChange={field.onChange}
                            error={form.formState.errors.endDate?.message}
                            minDate={
                              field.value ? new Date(field.value) : new Date()
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='imageUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image (optional)</FormLabel>
                      <FormControl>
                        <SingleFileUpload
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex items-center justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    router.push(
                      `/dashboard/business/locations/${locationId}/announcements`
                    )
                  }
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isCreating}>
                  {isCreating && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  Create announcement
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
