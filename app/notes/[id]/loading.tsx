// app/notes/[id]/loading.tsx
import { Loader2 } from 'lucide-react';

const Loading = () => {
  return (
    <div className="flex justify-center items-center mt-20">
      <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
    </div>
  );
};

export default Loading;
