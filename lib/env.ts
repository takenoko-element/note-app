// lib/env.ts
import { z } from 'zod';
// import validator from 'validator';

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  // クライアントサイド(ブラウザ)で利用する環境変数
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // サーバーサイドのみで利用する環境変数
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_BUCKET_NAME: z.string().min(1),

  // Auth0関連
  AUTH0_SECRET: z.string().min(1),
  //   APP_BASE_URL: z.string().refine(validator.isURL, {
  //     message: 'Invalid URL format for AUTH0_BASE_URL',
  //   }),
  AUTH0_DOMAIN: z.string().min(1),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(1),
  //   AUTH0_SCOPE: z.string().min(1),
  //   AUTH0_AUDIENCE: z.string().refine(validator.isURL, {
  //     message: 'Invalid URL format for AUTH0_AUDIENCE',
  //   }),
});

/**
 * 環境変数の検証と型付け
 *
 * .parse() は、検証に失敗した場合にエラーをスローしてプロセスを停止させる。
 * これにより、環境変数が不足したままアプリケーションが起動するのを防ぐ。
 */
export const env = envSchema.parse(process.env);
