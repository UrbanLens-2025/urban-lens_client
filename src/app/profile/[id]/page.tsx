"use client";

import { useUser } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";
import { ProfileHeader } from "../components/profile-header";
import { ProfileTabs } from "../components/profile-tabs";
import { IntroCard } from "../components/intro-card";
import { PhotosCard } from "../components/photos-card";
import { FriendsCard } from "../components/friends-card";
import { PostComposer } from "../components/post-composer";
import { PostCard } from "../components/post-card";

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
      <ProfileTabs />
      <div className="px-61 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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
  );
}
