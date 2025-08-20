// lib/validators.ts
import { z } from 'zod';

// ノート作成・編集フォーム用のバリデーションスキーマ
export const noteSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'タイトルは必須です。' })
    .max(30, { message: 'タイトルは30文字以内で入力してください。' }),

  content: z
    .string()
    .min(1, { message: '内容は必須です。' })
    .max(300, { message: '内容は1000文字以内で入力してください。' }),
});

export type NoteFormInput = z.infer<typeof noteSchema>;
