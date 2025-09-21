"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

// Dữ liệu bạn bè mẫu
const friends = [
  { name: "John Doe", avatarUrl: "https://i.pravatar.cc/150?u=john" },
  { name: "Jane Smith", avatarUrl: "https://i.pravatar.cc/150?u=jane" },
  { name: "Alex Ray", avatarUrl: "https://i.pravatar.cc/150?u=alex" },
  { name: "Kate Moss", avatarUrl: "https://i.pravatar.cc/150?u=kate" },
  { name: "Chris Bum", avatarUrl: "https://i.pravatar.cc/150?u=chris" },
  { name: "Sarah Day", avatarUrl: "https://i.pravatar.cc/150?u=sarah" },
];

export function FriendsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Friends</CardTitle>
            <p className="text-sm text-gray-500">1,234 friends</p>
          </div>
          <Link href="#" className="text-sm text-blue-500 hover:underline">
            See all friends
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
          {friends.map((friend) => (
            <div key={friend.name}>
              <div className="aspect-square rounded-lg overflow-hidden">
                <Image
                  width={100}
                  height={100}
                  src={friend.avatarUrl}
                  alt={friend.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <Link href="#" className="text-sm font-semibold hover:underline">
                {friend.name}
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
