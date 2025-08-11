// lib/image.service.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const bucketName = env.SUPABASE_BUCKET_NAME;

/**
 * 画像ファイルをSupabase Storageに保存し、署名付きURLを取得します。
 * @param file - 保存する画像ファイル
 * @returns 署名付きURL。ファイルがない場合はundefined。
 */
export const saveImageAndGetUrl = async (
  file: File | null,
): Promise<string | undefined> => {
  if (!file || file.size === 0) {
    return undefined;
  }

  const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const filePath = `images/${Date.now()}_${file.name}`;

  // Supabase Storageに管理者権限でアップロード
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) {
    console.error('Supabase Storageへのアップロードエラー:', error);
    throw new Error('画像のアップロードに失敗しました。');
  }

  // アップロードした画像の署名付きURLを取得
  const ONE_WEEK_IN_SECONDS = 604800;
  const { data: signedUrlData, error: signedUrlError } =
    await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(data.path, ONE_WEEK_IN_SECONDS);

  if (signedUrlError) {
    console.error('署名付きURLの生成エラー:', signedUrlError);
    throw new Error('画像URLの生成に失敗しました。');
  }

  return signedUrlData.signedUrl;
};
