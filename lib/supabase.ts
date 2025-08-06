// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// .env.localからSupabaseプロジェクトのURLとanonキーを読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabaseクライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
