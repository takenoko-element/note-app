// e2e/auth.setup.ts
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number; // Unixタイムスタンプ (秒)
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
};

type StorageState = {
  cookies: Cookie[];
  origins: {
    origin: string;
    localStorage: { name: string; value: string }[];
  }[];
};

const authFile = 'auth.json';
const authFilePath = path.join(process.cwd(), authFile);

async function globalSetup() {
  if (fs.existsSync(authFilePath)) {
    const state = JSON.parse(
      fs.readFileSync(authFilePath, 'utf-8'),
    ) as StorageState;
    const now = Date.now() / 1000; // 秒単位
    const hasValidCookie = state.cookies.some(
      (cookie) => !cookie.expires || cookie.expires > now,
    );

    if (hasValidCookie) {
      console.log('✅ Cookie が有効なのでログイン処理をスキップします');
      return;
    } else {
      console.log('⚠️ Cookie が期限切れなので再ログインします');
    }
  }

  // headless: false を追加して、ブラウザが画面に表示されるようにする
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // ログインページに移動
  await page.goto('http://localhost:3000/auth/login');

  // トップページにリダイレクトされるまで待機
  await page.waitForURL('http://localhost:3000/');

  // 現在のページの認証状態（Cookieなど）をファイルに保存
  await page.context().storageState({ path: authFile });

  // ブラウザを閉じる
  await browser.close();
}

export default globalSetup;
