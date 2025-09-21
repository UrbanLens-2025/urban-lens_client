"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "@/types";
import { Camera, Pencil, Plus } from "lucide-react";
import Image from "next/image";

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {

  return (
    <div className="bg-white shadow-md px-53">
      <div className="relative h-80 md:h-100 rounded-b-lg bg-gray-200">
        <Image
          height={400}
          width={800}
          src={
            user.coverUrl ||
            "https://images.unsplash.com/photo-1515879218367-8466d910aaa4"
          }
          alt="Cover photo"
          className="w-full h-full object-cover rounded-b-lg"
        />
        <Button
          size="sm"
          className="absolute h-9 bottom-5 right-8 bg-white text-black hover:bg-white/90 cursor-pointer"
        >
          <Camera className="mr-2 h-4 w-4" /> Edit cover photo
        </Button>
      </div>

      <div className="px-8 pb-4">
        <div className="flex flex-col md:flex-row items-center -mt-10">
          <Avatar className="w-44 h-44 border-4 border-white">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>
              {user.firstName?.charAt(0)}
              {user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="md:ml-4 mt-9 text-center md:text-left">
            <h1 className="text-3xl font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-gray-500 font-semibold cursor-pointer hover:underline">
              1,234 friends
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0 md:ml-auto">
            <Button className="hover:bg-[#58c6d7] cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Add Story
            </Button>
            <Button variant="secondary" className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
