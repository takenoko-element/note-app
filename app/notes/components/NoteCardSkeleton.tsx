// app/notes/components/NoteCardSkeleton.tsx
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';

export const NoteCardSkeleton = () => {
  return (
    <Card className="flex flex-col h-full" data-testid="note-card-skeleton">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
};
