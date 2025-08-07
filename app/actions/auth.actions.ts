// app/actions/auth.actions.ts
'use server';

import { auth0 } from '@/lib/auth0';
import { env } from '@/lib/env';

// パスワード変更メールのリクエストアクション
export const requestPasswordChangeAction = async () => {
  const session = await auth0.getSession();
  const email = session?.user.email;

  if (!env.AUTH0_DOMAIN || !env.AUTH0_CLIENT_ID) {
    throw new Error(
      'Auth0のドメインまたはクライアントIDが設定されていません。',
    );
  }
  if (!email) {
    throw new Error('ユーザーのメールアドレスが取得できませんでした。');
  }

  try {
    const response = await fetch(
      `https://${env.AUTH0_DOMAIN}/dbconnections/change_password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.AUTH0_CLIENT_ID,
          email: email,
          connection: 'Username-Password-Authentication',
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('パスワード変更リクエストエラー:', errorData);
      throw new Error('パスワード変更リクエストの送信に失敗しました。');
    }

    return {
      success: true,
      message: 'パスワード変更用のメールを送信しました。',
    };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('予期せぬエラーが発生しました。');
  }
};
