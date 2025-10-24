"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useUpdateProfile } from "@/hooks/user/useUpdateProfile";
import { FileUpload } from "@/components/shared/FileUpload";

const profileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),

  phoneNumber: z.string().min(10, { message: "Phone number is required." }),
  avatarUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url("Must be a valid URL.").nullable().optional()
  ),
  coverUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url("Must be a valid URL.").nullable().optional()
  ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({
  user,
  open,
  onOpenChange,
}: EditProfileModalProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    // @ts-expect-error ignore this error for defaultValues
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl || "",
      coverUrl: user.coverUrl || "",
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile(values, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 grid grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-profile-form"
            /* @ts-expect-error ignore this error for defaultValues */
            onSubmit={form.handleSubmit(onSubmit)}
            className="overflow-y-auto px-6 space-y-6 h-full"
          >
            <FormField
              /* @ts-expect-error ignore this error for defaultValues */
              control={form.control}
              name="avatarUrl"
              render={() => (
                <FormItem>
                  <FormLabel className="font-semibold text-base">
                    Profile Picture
                  </FormLabel>
                    <FileUpload
                      onUploadComplete={(url) => {
                        form.setValue("avatarUrl", url, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />

            <FormField
              /* @ts-expect-error ignore this error for defaultValues */
              control={form.control}
              name="coverUrl"
              render={() => (
                <FormItem>
                  <FormLabel className="font-semibold text-base">
                    Cover Photo
                  </FormLabel>
                  <FileUpload
                    onUploadComplete={(url) => {
                      form.setValue("coverUrl", url, { shouldValidate: true });
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                /* @ts-expect-error ignore this error for defaultValues */
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                /* @ts-expect-error ignore this error for defaultValues */
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              /* @ts-expect-error ignore this error for defaultValues */
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="p-6 bg-white border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-profile-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
