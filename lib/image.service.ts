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
export const saveImageAndGetPath = async (
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

  return data.path;
};

/**
 * 指定されたファイルパスから署名付きURLを生成します。
 * @param filePath - Supabase Storage内のファイルパス
 * @returns 署名付きURL。ファイルパスがない場合やエラー時はnull。
 */
export const getSignedUrl = async (
  filePath: string | null,
): Promise<string | null> => {
  if (!filePath) {
    return null;
  }

  const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const ONE_DAY_IN_SECONDS = 86400;
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(filePath, ONE_DAY_IN_SECONDS);

  if (error) {
    console.error('署名付きURLの生成エラー:', error);
    return null;
  }

  return data.signedUrl;
};
