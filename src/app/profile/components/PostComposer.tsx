import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PostComposerProps {
  user: User;
}

export function PostComposer({ user }: PostComposerProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.firstName.charAt(0)}</AvatarFallback>
          </Avatar>
          <Input 
            placeholder={`What's on your mind, ${user.firstName}?`}
            className="rounded-full bg-gray-100 border-none hover:bg-gray-200 cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
}