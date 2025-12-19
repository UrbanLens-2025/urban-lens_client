'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';

import { useSubmitBusinessOnboarding } from '@/hooks/onboarding/useSubmitBusinessOnboarding';
import { useUser } from '@/hooks/user/useUser';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Trash2,
  Store,
  Building2,
  Contact,
  MapPin,
  FileCheck,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  LogOut,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { LocationAddressPicker } from '../shared/LocationAddressPicker';
import { SingleFileUpload } from '../shared/SingleFileUpload';
import { FileUpload } from '../shared/FileUpload';
import { AcceptedBusinessLicenseTypes } from '@/types';
import { ModeSwitcher } from '../shared/ModeSwitcher';

const businessCategories = [
  'FOOD',
  'RETAIL',
  'SERVICE',
  'ENTERTAINMENT',
  'HEALTH',
  'EDUCATION',
  'TECHNOLOGY',
  'OTHER',
] as const;

const licenseSchema = z.object({
  licenseType: z.nativeEnum(AcceptedBusinessLicenseTypes, {
    message: 'Please select a license type.',
  }),
  documentImageUrls: z
    .array(z.string().url('Invalid image URL'))
    .min(1, 'At least one document image is required.'),
});

const businessSchema = z.object({
  name: z.string().min(2, 'Business name is required.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z
    .string()
    .regex(/^[0-9]{9,10}$/, { message: 'Phone number must be 9-10 digits.' })
    .refine(
      (val) => {
        return (
          /^(0[3|5|7|8|9])[0-9]{8}$/.test(val) ||
          /^[3|5|7|8|9][0-9]{8}$/.test(val)
        );
      },
      { message: 'Invalid Vietnam phone number format.' }
    ),
  avatar: z
    .string()
    .url('Please upload an avatar.')
    .min(1, 'Please upload an avatar.'),
  licenses: z.array(licenseSchema).min(1, 'At least one license is required.'),
  website: z
    .string()
    .url('Must be a valid URL.')
    .min(1, 'Website is required.'),
  category: z.enum(businessCategories, {
    message: 'Please select a category.',
  }),
});

type FormValues = z.infer<typeof businessSchema>;

interface BusinessOnboardingFormProps {
  onLogout: () => void;
}

export function BusinessOnboardingForm({
  onLogout,
}: BusinessOnboardingFormProps) {
  const { mutate: submit, isPending } = useSubmitBusinessOnboarding();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [countryCode, setCountryCode] = useState('+84');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(businessSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      email: '',
      phone: '',
      avatar: '',
      licenses: [],
      website: '',
      category: undefined,
    },
  });

  // Warn user before leaving if form has been modified
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if form is dirty (has been modified) and not currently submitting
      if (form.formState.isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form.formState.isDirty, isSubmitting]);

  function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const phoneWithCode = `${countryCode}${values.phone}`;
    submit({ ...values, phone: phoneWithCode });
  }

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ['name', 'category'],
    2: ['description', 'avatar', 'website'],
    3: ['email', 'phone'],
    4: ['licenses'],
  };

  const handleNext = async () => {
    const fields = stepFields[step];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const progress = Math.round((step / totalSteps) * 100);

  const licenses = form.watch('licenses');

  const addLicense = () => {
    const currentLicenses = form.getValues('licenses') || [];
    form.setValue('licenses', [
      ...currentLicenses,
      {
        licenseType: AcceptedBusinessLicenseTypes.BUSINESS_LICENSE,
        documentImageUrls: [],
      },
    ]);
  };

  const removeLicense = (index: number) => {
    const currentLicenses = form.getValues('licenses') || [];
    form.setValue(
      'licenses',
      currentLicenses.filter((_, i) => i !== index)
    );
  };

  const getLicenseTypeLabel = (type: AcceptedBusinessLicenseTypes) => {
    switch (type) {
      case AcceptedBusinessLicenseTypes.BUSINESS_LICENSE:
        return 'Business License';
      case AcceptedBusinessLicenseTypes.OPERATING_PERMIT:
        return 'Operating Permit';
      case AcceptedBusinessLicenseTypes.TAX_IDENTIFICATION:
        return 'Tax Identification';
      default:
        return type;
    }
  };

  const getStepInfo = () => {
    switch (step) {
      case 1:
        return {
          icon: Building2,
          title: 'Tell us about your business',
          description:
            "Start with the basics - what's your business called and what type of business is it?",
        };
      case 2:
        return {
          icon: Store,
          title: 'Showcase your business',
          description:
            'Add details that help customers learn more about what makes your business special.',
        };
      case 3:
        return {
          icon: Contact,
          title: 'How can customers reach you?',
          description:
            'Provide your contact information so customers can get in touch easily.',
        };
      case 4:
        return {
          icon: FileCheck,
          title: 'Verify your business',
          description:
            'Upload your business licenses and permits to build trust with customers.',
        };
      default:
        return { icon: Store, title: '', description: '' };
    }
  };

  const stepInfo = getStepInfo();
  const StepIcon = stepInfo.icon;

  const getStepColor = () => {
    switch (step) {
      case 0:
        return 'bg-gradient-to-br from-purple-500 to-pink-500';
      case 1:
        return 'bg-gradient-to-br from-blue-500 to-cyan-500';
      case 2:
        return 'bg-gradient-to-br from-green-500 to-emerald-500';
      case 3:
        return 'bg-gradient-to-br from-orange-500 to-amber-500';
      case 4:
        return 'bg-gradient-to-br from-rose-500 to-pink-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <>
      {/* Left Column - Image Section */}
      <div className='hidden lg:block lg:w-1/2 relative overflow-hidden'>
        <img
          src='https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=2187&auto=format&fit=crop'
          alt='Urban business scene'
          className='absolute inset-0 w-full h-full object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-600/80 to-pink-600/90 mix-blend-multiply' />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />

        <div className='relative z-10 h-full flex flex-col justify-between p-12 text-white'>
          <div>
            <div className='inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6'>
              <span className='text-sm font-medium'>
                ✨ Setup takes ~5 minutes
              </span>
            </div>
            <h1 className='text-5xl font-bold mb-4 leading-tight'>
              Welcome to
              <br />
              UrbanLens
            </h1>
            <p className='text-xl text-white/90'>
              Join thousands of businesses connecting with customers
            </p>
          </div>

          <div className='text-sm text-white/70'>
            © 2025 UrbanLens. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column - Form Section */}
      <div className='w-full lg:w-1/2 flex flex-col relative'>
        <div className='absolute top-6 right-6 z-10 flex items-center gap-2'>
          <ModeSwitcher />
          <Button
            variant='ghost'
            size='sm'
            onClick={onLogout}
            className='gap-2 text-muted-foreground hover:text-foreground'
          >
            <LogOut className='h-4 w-4' />
            Logout
          </Button>
        </div>

        <div className='flex-1 flex flex-col justify-center overflow-y-auto'>
          <div className='max-w-xl mx-auto px-6 py-10 lg:px-10 lg:py-12 w-full'>
            <div className='mb-10'>
              <div className='flex items-start gap-4 mb-8'>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${getStepColor()} shadow-lg shrink-0`}
                >
                  <StepIcon className='h-6 w-6 text-white' />
                </div>
                <div className='flex-1 pt-1'>
                  <h3 className='text-2xl font-bold mb-2'>{stepInfo.title}</h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    {stepInfo.description}
                  </p>
                </div>
              </div>
              {/* Step Progress */}
              {step > 0 && (
                <div className='mb-10'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                      Step {step} of {totalSteps}
                    </span>
                    <span className='text-sm font-bold text-primary'>
                      {progress}%
                    </span>
                  </div>
                  <div className='h-2 w-full rounded-full bg-muted/50 overflow-hidden'>
                    <div
                      className='h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out shadow-sm'
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {step === 1 && (
                  <div className='space-y-5'>
                    <FormField
                      name='name'
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base flex items-center gap-2'>
                            <Store className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                            What&apos;s your business name?
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g., Sunrise Coffee Shop'
                              className='text-base'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This is the name customers will see when they
                            discover you
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='category'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base flex items-center gap-2'>
                            <Building2 className='h-4 w-4 text-cyan-600 dark:text-cyan-400' />
                            What type of business do you operate?
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className='text-base'>
                                <SelectValue placeholder='Choose the category that best fits' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0) +
                                    category.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This helps customers find businesses like yours
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className='space-y-5'>
                    <FormField
                      name='description'
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base'>
                            Tell customers about your business
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='What makes your business unique? What products or services do you offer?'
                              className='min-h-[120px] text-base'
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Write at least 10 characters. Be descriptive - this
                            is your chance to stand out!
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name='avatar'
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base'>
                            Upload your business logo or photo
                          </FormLabel>
                          <FormControl>
                            <SingleFileUpload
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Choose a clear, square image that represents your
                            business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name='website'
                      control={form.control}
                      render={({ field, fieldState }) => {
                        const isValidUrl = field.value && !fieldState.error;
                        return (
                          <FormItem>
                            <FormLabel className='text-base'>
                              What&apos;s your business website?
                            </FormLabel>
                            <FormControl>
                              <div className='relative'>
                                <Globe className='absolute left-2.5 top-4 h-4 w-4 text-muted-foreground' />
                                <Input
                                  placeholder='https://www.yourbusiness.com'
                                  className='text-base pl-9 pr-12'
                                  {...field}
                                />
                                {isValidUrl && (
                                  <a
                                    href={field.value}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='absolute right-2 top-1/2 -translate-y-1/2'
                                  >
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='icon'
                                      className='h-7 w-7 hover:bg-primary/10'
                                    >
                                      <ExternalLink className='h-4 w-4 text-primary' />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className='space-y-5'>
                    {user && (user.email || user.phoneNumber) && (
                      <div className='p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex items-start gap-3 flex-1'>
                            <UserCheck className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0' />
                            <div className='flex-1'>
                              <p className='text-sm font-medium text-blue-900 dark:text-blue-100 mb-1'>
                                Use your account information?
                              </p>
                              <p className='text-xs text-blue-700 dark:text-blue-300'>
                                We can auto-fill your business contact details
                                from your account
                              </p>
                            </div>
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              if (user.email) {
                                form.setValue('email', user.email, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }
                              if (user.phoneNumber) {
                                console.log(
                                  'Original phone number:',
                                  user.phoneNumber
                                );

                                // Check if phone number starts with +84
                                if (user.phoneNumber.startsWith('+84')) {
                                  const numberWithoutCode =
                                    user.phoneNumber.substring(3); // Remove +84
                                  console.log(
                                    'Extracted number:',
                                    numberWithoutCode
                                  );
                                  setCountryCode('+84');
                                  form.setValue('phone', numberWithoutCode, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                } else if (user.phoneNumber.startsWith('+')) {
                                  // For other country codes
                                  const match =
                                    user.phoneNumber.match(
                                      /^(\+\d{1,4})(\d+)$/
                                    );
                                  if (match) {
                                    const [, code, number] = match;
                                    console.log(
                                      'Extracted code:',
                                      code,
                                      'number:',
                                      number
                                    );
                                    setCountryCode(code);
                                    form.setValue('phone', number, {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    });
                                  }
                                } else {
                                  // No country code, assume +84
                                  console.log(
                                    'No country code, using phone as is:',
                                    user.phoneNumber
                                  );
                                  setCountryCode('+84');
                                  form.setValue('phone', user.phoneNumber, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                }
                              }
                            }}
                            className='shrink-0 bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                          >
                            <UserCheck className='h-4 w-4 mr-2' />
                            Auto-fill
                          </Button>
                        </div>
                      </div>
                    )}

                    <FormField
                      name='email'
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base'>
                            What&apos;s your business email?
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Mail className='absolute left-2.5 top-4 h-4 w-4 text-muted-foreground' />
                              <Input
                                type='email'
                                placeholder='contact@yourbusiness.com'
                                className='text-base pl-9'
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name='phone'
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base'>
                            What&apos;s your contact phone number?
                          </FormLabel>
                          <FormControl>
                            <div className='flex gap-2'>
                              <Select
                                value={countryCode}
                                onValueChange={setCountryCode}
                              >
                                <SelectTrigger className='w-[110px] h-9'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='+84'>
                                    <div className='flex items-center gap-2'>
                                      <span>+84</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <div className='relative flex-1'>
                                <Phone className='absolute left-2.5 top-4 h-4 w-4 text-muted-foreground' />
                                <Input
                                  type='tel'
                                  placeholder='912345678'
                                  className='text-base pl-9'
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value
                                      .replace(/\D/g, '')
                                      .slice(0, 10);
                                    field.onChange(value);
                                  }}
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 4 && (
                  <>
                    <div className='space-y-4 mb-6'>
                      <div>
                        <h3 className='text-base font-medium mb-2'>
                          Upload your business licenses
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          Verified businesses get more trust from customers.
                          Upload clear photos of your business license,
                          operating permit, or tax identification documents.
                        </p>
                      </div>
                      <div className='flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'>
                        <div className='flex items-start gap-3'>
                          <FileCheck className='h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5' />
                          <div>
                            <p className='text-sm font-medium text-amber-900 dark:text-amber-100'>
                              Need at least one license
                            </p>
                            <p className='text-xs text-amber-700 dark:text-amber-200 mt-0.5'>
                              Click &quot;Add License&quot; to get started
                            </p>
                          </div>
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={addLicense}
                          className='shrink-0'
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Add License
                        </Button>
                      </div>
                    </div>

                    {licenses && licenses.length > 0 ? (
                      <div className='space-y-4'>
                        {licenses.map((license, index) => (
                          <Card
                            key={index}
                            className='relative border-2 shadow-sm hover:shadow-md transition-shadow'
                          >
                            <CardContent className='pt-6'>
                              <div className='flex items-start justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                  <div className='rounded-full p-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20'>
                                    <FileCheck className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                                  </div>
                                  <div>
                                    <h4 className='font-semibold text-base'>
                                      License {index + 1}
                                    </h4>
                                    <p className='text-xs text-muted-foreground mt-0.5'>
                                      {license.documentImageUrls?.length || 0}{' '}
                                      document
                                      {license.documentImageUrls?.length !== 1
                                        ? 's'
                                        : ''}{' '}
                                      uploaded
                                    </p>
                                  </div>
                                </div>
                                {licenses.length > 1 && (
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => removeLicense(index)}
                                    className='text-destructive hover:text-destructive hover:bg-destructive/10'
                                  >
                                    <Trash2 className='h-4 w-4 mr-2' />
                                    Remove
                                  </Button>
                                )}
                              </div>

                              <div className='space-y-5'>
                                <FormField
                                  control={form.control}
                                  name={`licenses.${index}.licenseType`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-base font-medium'>
                                        What type of license is this?
                                      </FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger className='h-10'>
                                            <SelectValue placeholder='Choose license type...' />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {Object.values(
                                            AcceptedBusinessLicenseTypes
                                          ).map((type) => (
                                            <SelectItem key={type} value={type}>
                                              <div className='flex items-center gap-2'>
                                                <FileCheck className='h-4 w-4 text-muted-foreground' />
                                                {getLicenseTypeLabel(type)}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`licenses.${index}.documentImageUrls`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className='text-base font-medium'>
                                        Upload document images
                                      </FormLabel>
                                      <FormControl>
                                        <FileUpload
                                          value={field.value || []}
                                          onChange={field.onChange}
                                        />
                                      </FormControl>
                                      <FormDescription className='flex items-start gap-2'>
                                        <span className='text-xs'>💡</span>
                                        <span>
                                          Upload clear photos of your{' '}
                                          {license.licenseType
                                            ? getLicenseTypeLabel(
                                                license.licenseType
                                              ).toLowerCase()
                                            : 'license document'}
                                          . Multiple images are supported for
                                          front/back or multi-page documents.
                                        </span>
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8 border-2 border-dashed rounded-lg'>
                        <p className='text-sm text-muted-foreground mb-4'>
                          No licenses added yet. Click &quot;Add License&quot;
                          to get started.
                        </p>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={addLicense}
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Add Your First License
                        </Button>
                      </div>
                    )}

                    {form.formState.errors.licenses && (
                      <p className='text-sm font-medium text-destructive mt-2'>
                        {form.formState.errors.licenses.message}
                      </p>
                    )}
                  </>
                )}

                {/* Navigation Buttons */}
                <div className='flex items-center justify-between gap-4 pt-8'>
                  {step > 1 && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleBack}
                      disabled={isPending}
                      className='px-6'
                    >
                      Back
                    </Button>
                  )}
                  {step === 1 && <div />}
                  {step < totalSteps ? (
                    <Button
                      type='button'
                      onClick={handleNext}
                      disabled={isPending}
                      className='px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all'
                    >
                      Continue
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  ) : (
                    <Button
                      type='button'
                      disabled={isPending}
                      className='px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all'
                      onClick={(e) => {
                        e.preventDefault();
                        setShowConfirmDialog(true);
                      }}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Setting Up...
                        </>
                      ) : (
                        <>
                          <Sparkles className='mr-2 h-4 w-4' />
                          Complete Setup
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary' />
              Ready to Launch Your Business Profile?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='space-y-3 pt-2'>
                <p>
                  You&apos;re about to submit your business profile for review.
                  Once submitted:
                </p>
                <ul className='list-disc list-inside space-y-1 text-sm'>
                  <li>Your business will be reviewed by our team</li>
                  <li>You&apos;ll receive a notification once approved</li>
                  <li>You can edit your profile anytime from your dashboard</li>
                </ul>
                <p className='font-medium text-foreground pt-2'>
                  Are you ready to continue?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Go Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit)();
              }}
              className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            >
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Yes, Submit Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
