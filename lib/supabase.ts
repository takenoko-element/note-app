// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// .env.localからSupabaseプロジェクトのURLとanonキーを読み込む
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabaseクライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
