"use client";

import { useState } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

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

  const [formData, setFormData] = useState({
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    phoneNumber: user.phoneNumber || null,
    avatarUrl: user.avatarUrl || null,
    coverUrl: user.coverUrl || null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = () => {
    const processedData = { ...formData };

    for (const key in processedData) {
      if (processedData[key as keyof typeof processedData] === "") {
        processedData[key as keyof typeof processedData] = null;
      }
    }
    
    const payloadToSend = {
      firstName: processedData.firstName,
      lastName: processedData.lastName,
      phoneNumber: processedData.phoneNumber,
      avatarUrl: processedData.avatarUrl,
      coverUrl: processedData.coverUrl,
    };
    
    updateProfile(payloadToSend, {
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
          <Separator />
        </DialogHeader>

        <div className="overflow-y-auto px-6 space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Profile Picture</h3>
            <div className="flex items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={formData.avatarUrl} />
                <AvatarFallback>
                  {formData.firstName?.charAt(0)}
                  {formData.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="w-full space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Cover Photo</h3>
            <div>
              <Input
                id="coverUrl"
                value={formData.coverUrl}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
          </div>
          <Separator />

          {/* --- Bio --- */}
          <div className="space-y-2">
            <h3 className="font-semibold">Bio</h3>
            <Textarea
              id="bio"
              onChange={handleInputChange}
              placeholder="Describe who you are..."
            />
          </div>
          <Separator />

          {/* --- Details --- */}
          <div className="space-y-4">
            <h3 className="font-semibold">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-white border-t">
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSaveChanges} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
