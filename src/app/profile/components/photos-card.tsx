"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const photoUrls = [
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=300",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300",
  "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=300",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
];

export function PhotosCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Photos</CardTitle>
          <Link href="#" className="text-sm text-blue-500 hover:underline">
            See all photos
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 rounded-lg overflow-hidden">
          {photoUrls.map((url, index) => (
            <div key={index} className="aspect-square">
              <Image
                width={100}
                height={100}
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}