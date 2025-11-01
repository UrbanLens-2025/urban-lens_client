"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useUpdateProfile } from "@/hooks/user/useUpdateProfile";
import { useChangePassword } from "@/hooks/auth/useChangePassword";
import { FileUpload } from "@/components/shared/FileUpload";

// --- Schema cho Tab 1: Edit Profile ---
const profileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  phoneNumber: z.string().min(10, { message: "Phone number is required." }),
  avatarUrl: z.string().url("Must be a valid URL.").nullable().optional(),
  coverUrl: z.string().url("Must be a valid URL.").nullable().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

// --- Schema cho Tab 2: Change Password ---
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface UserSettingsModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettingsModal({
  user,
  open,
  onOpenChange,
}: UserSettingsModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfile();
  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangePassword();

  // --- Form 1: Profile ---
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      avatarUrl: user.avatarUrl || null,
      coverUrl: user.coverUrl || null,
    },
  });

  // --- Form 2: Password ---
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Submit cho Form 1
  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfile(values, {
      onSuccess: () => onOpenChange(false),
    });
  };

  // Submit cho Form 2
  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePassword(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          passwordForm.reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 grid grid-rows-[auto_1fr] max-h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">
            Account Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
          <TabsList className="mx-6">
            <TabsTrigger value="profile">Edit Profile</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          {/* --- Tab 1: Edit Profile Content --- */}
          <TabsContent value="profile" className="overflow-y-auto mt-0 h-full">
            <Form {...profileForm}>
              <form
                id="edit-profile-form"
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="px-6 py-2 space-y-2"
              >
                {/* FileUpload cho avatarUrl */}
                <FormField
                  control={profileForm.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar</FormLabel>
                      <FileUpload
                        value={field.value ? [field.value] : []}
                        onChange={(urls) => field.onChange(urls[0] || null)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* FileUpload cho coverUrl */}
                <FormField
                  control={profileForm.control}
                  name="coverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Photo</FormLabel>
                      <FileUpload
                        value={field.value ? [field.value] : []}
                        onChange={(urls) => field.onChange(urls[0] || null)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Các trường firstName, lastName, phoneNumber */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="firstName"
                    control={profileForm.control}
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
                    name="lastName"
                    control={profileForm.control}
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
                  name="phoneNumber"
                  control={profileForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nút Submit cho Form 1 */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    form="edit-profile-form"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Profile
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* --- Tab 2: Change Password Content --- */}
          <TabsContent value="password" className="overflow-y-auto mt-0 h-full">
            <Form {...passwordForm}>
              <form
                id="change-password-form"
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="px-6 py-4 space-y-4"
              >
                <FormField
                  name="currentPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="newPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="confirmPassword"
                  control={passwordForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nút Submit cho Form 2 */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    form="change-password-form"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Password
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
