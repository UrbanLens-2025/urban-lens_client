"use client";

import { EditProfileModal } from "@/components/profile/EditModal";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "@/types";
import {
  Camera,
  Edit,
  MessageCircle,
  PlusCircle,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link, { useRouter } from "next/navigation";
import { useState } from "react";

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  isGuest: boolean;
}

export function ProfileHeader({
  user,
  isOwnProfile,
  isGuest,
}: ProfileHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const route = useRouter();

  return (
    <div className="min-w-screen justify-self-center bg-white shadow-md">
      <div className="mx-6">
        <div className="relative h-80 md:h-100 rounded-b-lg bg-gray-200">
          <Image
            height={400}
            width={800}
            src={user.coverUrl || "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"}
            alt="Cover photo"
            className="w-full h-full object-cover rounded-b-lg"
          />
        </div>

        <div className="px-8 pb-4">
          <div className="flex flex-col md:flex-row items-center -mt-10">
            <Avatar className="w-44 h-44 border-4 border-white">
              <AvatarImage src={user.avatarUrl || "/default-avatar.svg"} />
            </Avatar>
            <div className="md:ml-4 mt-9 text-center md:text-left">
              <h1 className="text-3xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-500 font-semibold cursor-pointer hover:underline">
                1,234 friends
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0 md:ml-auto">
              {!isGuest &&
                (isOwnProfile ? (
                  <>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add to story
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" /> Follow
                    </Button>
                    <Button variant="secondary">
                      <MessageCircle className="mr-2 h-4 w-4" /> Message
                    </Button>
                  </>
                ))}
              {isGuest && (
                <Button
                  onClick={() => {
                    route.push("/login");
                  }}
                >
                  Log in to interact
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <EditProfileModal
        user={user}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
