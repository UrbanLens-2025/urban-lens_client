"use client";

import Link from "next/link";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, MoreHorizontal, Share2, ThumbsUp } from "lucide-react";
import Image from "next/image";

interface PostCardProps {
  user: User;
  time: string;
  caption?: string;
  imageUrl?: string;
  likes: number;
  comments: number;
}

export function PostCard({
  user,
  time,
  caption,
  imageUrl,
  likes,
  comments,
}: PostCardProps) {
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <Card>
      {/* PHẦN HEADER: Thông tin người đăng */}
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar>
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>
                  {user.firstName?.charAt(0)}
                  {user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${user.id}`}>
                <p className="font-semibold hover:underline">{fullName}</p>
              </Link>
              <p className="text-xs text-muted-foreground">{time}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal />
          </Button>
        </div>
      </CardHeader>

      {/* PHẦN CONTENT: Nội dung bài viết */}
      <CardContent className="px-4 pb-2">
        {caption && <p className="mb-4">{caption}</p>}
        {imageUrl && (
          <div className="rounded-lg overflow-hidden border">
            <Image
              width={600}
              height={400}
              src={imageUrl}
              alt="Post content"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </CardContent>

      {/* PHẦN FOOTER: Thống kê và Nút hành động */}
      <CardFooter className="flex flex-col items-start p-4 pt-0">
        {/* Thống kê likes, comments */}
        <div className="flex justify-between w-full text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-blue-500" />
            <span>{likes.toLocaleString()}</span>
          </div>
          <span>{comments.toLocaleString()} comments</span>
        </div>

        <Separator />

        {/* Các nút hành động */}
        <div className="grid grid-cols-3 w-full mt-2">
          <Button variant="ghost" className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" /> Like
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Comment
          </Button>
          <Button variant="ghost" className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
