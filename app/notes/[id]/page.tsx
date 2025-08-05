// app/notes/[id]/page.tsx
import { getNoteById } from '@/lib/noteService';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';

import { auth0 } from '@/lib/auth0';
import { Skeleton } from '@/app/components/ui/skeleton';
import AiSummary from '../components/AiSummary';
import { Suspense } from 'react';
import { default as NextImage } from 'next/image';

type detailPageProps = {
  params: {
    id: string;
  };
};

export const generateMetadata = async ({
  params,
}: detailPageProps): Promise<Metadata> => {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (!userId || isNaN(id)) {
    return { title: 'Note App' };
  }

  const note = await getNoteById(id, userId);

  return {
    title: note ? `${note.title} | Note App` : 'ノートが見つかりません',
  };
};

const AiSummarySkeleton = () => {
  return (
    <div className="mt-8 p-4 bg-gray-50 border rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">AIによる要約</h3>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  );
};

const NoteDetailPage = async ({ params }: detailPageProps) => {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (!userId || isNaN(id)) {
    notFound();
  }

  const note = await getNoteById(id, userId);

  if (!note) {
    notFound();
  }

  return (
    <main className="container mx-auto mt-10 max-w-4xl">
      <Link
        href="/"
        className="text-blue-500 hover:underline mb-6 inline-block"
      >
        &larr; ノート一覧に戻る
      </Link>
      {note.imageUrl && (
        <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden border bg-slate-50 p-1">
          <NextImage
            src={note.imageUrl}
            alt={note.title}
            fill
            className="object-contain"
          />
        </div>
      )}
      <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        最終更新日時: {new Date(note.updatedAt).toLocaleString('ja-JP')}
      </p>
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border">
        {/* whitespace-pre-wrapで改行やスペースをそのまま表示 */}
        <p className="whitespace-pre-wrap text-base leading-relaxed">
          {note.content}
        </p>
      </div>
      <Suspense fallback={<AiSummarySkeleton />}>
        <AiSummary content={note.content} />
      </Suspense>
    </main>
  );
};

export default NoteDetailPage;
