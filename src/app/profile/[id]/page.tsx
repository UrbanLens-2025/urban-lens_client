"use client";

import { useUser } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";
import { ProfileHeader } from "../components/profileHeader";
import { ProfileTabs } from "../components/profileTabs";
import { IntroCard } from "../components/introCard";
import { PhotosCard } from "../components/photosCard";
import { FriendsCard } from "../components/friendsCard";
import { PostComposer } from "../components/postComposer";
import { PostCard } from "../components/postCard";

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <ProfileHeader user={user} />
      <div className="mx-6 lg:mx-61">
        <ProfileTabs />
        <div className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-8">
            <div className="col-span-2 space-y-4">
              <IntroCard user={user} />
              <PhotosCard />
              <FriendsCard />
            </div>

            <div className="col-span-3 space-y-4">
              <PostComposer user={user} />
              <PostCard
                user={user}
                time="1 hour ago"
                caption="Thật tuyệt vời khi xây dựng giao diện này với Next.js và Tailwind!"
                imageUrl="https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80"
                likes={205}
                comments={18}
              />
              <PostCard
                user={user}
                time="1 day ago"
                caption="Chỉ là một status không có ảnh thôi."
                likes={150}
                comments={12}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
