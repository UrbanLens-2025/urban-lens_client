import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Home, MapPin } from 'lucide-react';

interface IntroCardProps {
  user: User;
}

export function IntroCard({ user }: IntroCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Intro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.bio && <p className="text-center">{user.bio}</p>}
        <div className="flex items-center gap-2 text-gray-600">
          <Briefcase className="h-5 w-5"/> Works at Google
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Home className="h-5 w-5"/> Lives in {user.address || "Ho Chi Minh City"}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-5 w-5"/> From Binh Dinh
        </div>
      </CardContent>
    </Card>
  );
}