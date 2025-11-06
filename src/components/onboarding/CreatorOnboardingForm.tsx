"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitCreatorOnboarding } from "@/hooks/onboarding/useSubmitCreatorOnboarding";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { SingleFileUpload } from "../shared/SingleFileUpload";

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Required"),
  url: z.string().url("Must be a valid URL."),
  isMain: z.boolean(),
});

const creatorSchema = z.object({
  displayName: z.string().min(2, "Display name is required."),
  description: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().min(10, "Phone number is required."),
  avatarUrl: z.string(),
  coverUrl: z.string(),
  type: z.enum(["INDIVIDUAL", "ORGANIZATION"]),
  social: z.array(socialLinkSchema),
});

const types = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "ORGANIZATION", label: "Organization" },
];

type FormValues = z.infer<typeof creatorSchema>;

export function CreatorOnboardingForm() {
  const { mutate: submit, isPending } = useSubmitCreatorOnboarding();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<FormValues>({
    resolver: zodResolver(creatorSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      displayName: "",
      description: "",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
      coverUrl: "",
      type: "INDIVIDUAL",
      social: [{ platform: "", url: "", isMain: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social",
  });

  function onSubmit(values: FormValues) {
    submit(values);
  }

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ["displayName", "type", "avatarUrl", "coverUrl"],
    2: ["email", "phoneNumber"],
    3: [],
  };

  const handleNext = async () => {
    const fields = stepFields[step];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const progress = Math.round((step / totalSteps) * 100);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Your Creator Profile</CardTitle>
        <CardDescription>
          Tell us more about you or your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
            <span className="text-xs font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded bg-muted">
            <div
              className="h-2 rounded bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <FormField
                  name="displayName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your creator or org name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {types.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar</FormLabel>
                      <FormControl>
                        <SingleFileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>Square image works best</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover</FormLabel>
                      <FormControl>
                        <SingleFileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>Use a wide image for best look</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="phoneNumber"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="e.g., +84 901 234 567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Introduce yourself, your events, style..." {...field} />
                      </FormControl>
                      <FormDescription>Optional but recommended</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Social Links</FormLabel>
                  <FormDescription>Add at least one link so fans can find you</FormDescription>
                  <div className="space-y-3 mt-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-2">
                        <FormField
                          name={`social.${index}.platform`}
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Platform (e.g., Instagram)"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          name={`social.${index}.url`}
                          control={form.control}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="https://..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="mt-2 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        append({ platform: "", url: "", isMain: false })
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Link
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || isPending}>
                Back
              </Button>
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext} disabled={isPending}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isPending} className="min-w-[160px]">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
