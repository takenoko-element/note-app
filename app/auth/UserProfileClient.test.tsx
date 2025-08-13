// app/auth/UserProfileClient.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';

import { UserProfileClient } from './UserProfileClient';
import * as authActions from '@/app/actions/auth.actions';
import { ComponentProps } from 'react';

// --- モジュールのモック設定 ---
// Server Actionをモック化
vi.mock('@/app/actions/auth.actions');
// sonnerのtoastをモック化
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Next.jsのImageを従来のimgにモック
vi.mock('next/image', () => ({
  default: (props: ComponentProps<'img'> & { fill?: boolean }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, ...rest } = props;
    // next/image に渡されるすべてのプロパティ（src, altなど）を
    // そのまま通常のimgタグに流し込む
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={props.alt} />;
  },
}));

// env.tsのモック
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'dummy-service-role-key',
    SUPABASE_BUCKET_NAME: 'dummy-bucket',
    AUTH0_SECRET: 'dummy-auth0-secret',
    AUTH0_DOMAIN: 'dummy.auth0.com',
    AUTH0_CLIENT_ID: 'dummy-client-id',
    AUTH0_CLIENT_SECRET: 'dummy-client-secret',
  },
}));

// --- テストデータ ---
const mockUser = {
  name: 'テストユーザー',
  picture: 'http://example.com/avatar.png',
};

// --- テスト本体 ---
describe('UserProfileClient Component', () => {
  const user = userEvent.setup();
  const mockedRequestPasswordChange = vi.mocked(
    authActions.requestPasswordChangeAction,
  );
  const mockedToastSuccess = vi.mocked(toast.success);
  const mockedToastError = vi.mocked(toast.error);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. 初期表示のテスト
  it('ユーザー情報とボタンが正しく表示されること', () => {
    render(<UserProfileClient user={mockUser} />);
    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    expect(screen.getByAltText('テストユーザー')).toHaveAttribute(
      'src',
      mockUser.picture,
    );
    expect(
      screen.getByRole('button', { name: 'パスワード変更' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /ログアウト/i }),
    ).toBeInTheDocument();
  });

  // 2. パスワード変更の成功シナリオ
  it('パスワード変更に成功すると、成功トーストが表示されダイアログが閉じること', async () => {
    // 準備: Actionが成功したときの振る舞いを設定
    // 送信中挙動の確認のためのウェイト
    mockedRequestPasswordChange.mockImplementation(() => {
      return new Promise((resolve) => {
        // 500ミリ秒といった短い時間の後で、Promiseを成功させる
        setTimeout(() => {
          resolve({ success: true, message: '成功メッセージ' });
        }, 500);
      });
    });

    render(<UserProfileClient user={mockUser} />);

    // --- ユーザー操作 & 検証---
    // A. ダイアログが開く前にダイアログ内文言がないことを確認
    expect(
      screen.queryByRole('button', { name: '送信する' }),
    ).not.toBeInTheDocument();
    // 1. 「パスワード変更」ボタンをクリックしてダイアログを開く
    await user.click(screen.getByRole('button', { name: 'パスワード変更' }));

    // B. ダイアログの文言の確認
    expect(screen.getByText('パスワード変更の確認')).toBeInTheDocument();
    expect(
      screen.getByText(
        '登録されているメールアドレスにパスワード変更用のリンクを送信します。よろしいですか？',
      ),
    ).toBeInTheDocument();
    // 2. ダイアログ内の「送信する」ボタンを探してクリックする
    const submitButton = screen.getByRole('button', { name: '送信する' });
    await user.click(submitButton);

    // C. isPending状態のUIを検証
    await waitFor(() => {
      // ボタンが無効化され、テキストが「送信中...」に変わることを確認
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('送信中...')).toBeInTheDocument();
    });

    // D. 最終結果の検証
    await waitFor(() => {
      // Actionが呼び出されたか
      expect(mockedRequestPasswordChange).toHaveBeenCalledTimes(1);
      // 成功トーストが表示されたか
      expect(mockedToastSuccess).toHaveBeenCalledWith('成功メッセージ');
      // ダイアログが閉じていること（ダイアログのタイトルが存在しないこと）を確認
      expect(
        screen.queryByRole('dialog', { name: /パスワード変更の確認/i }),
      ).not.toBeInTheDocument();
    });
  });

  // 3. パスワード変更の失敗シナリオ(想定エラー)
  it('パスワード変更に失敗すると、エラートーストが表示されること', async () => {
    const error = new Error('サーバーエラー');
    // 準備: Actionが失敗したときの振る舞いを設定
    mockedRequestPasswordChange.mockRejectedValue(error);

    render(<UserProfileClient user={mockUser} />);

    // --- ユーザー操作 ---
    await user.click(screen.getByRole('button', { name: 'パスワード変更' }));
    await user.click(screen.getByRole('button', { name: '送信する' }));

    // --- 検証 ---
    await waitFor(() => {
      // エラートーストが表示されたか
      expect(mockedToastError).toHaveBeenCalledWith(error.message);
      // ボタンの無効化が解除され、テキストが元に戻っているか
      expect(
        screen.getByRole('button', { name: '送信する' }),
      ).not.toBeDisabled();
    });
  });

  // 4. パスワード変更の失敗シナリオ(想定外エラー)
  it('パスワード変更に失敗すると、予期しないエラーと表示されること', async () => {
    const error = 'Errorインスタンスではないエラー';
    mockedRequestPasswordChange.mockRejectedValue(error);

    render(<UserProfileClient user={mockUser} />);

    // --- ユーザー操作 ---
    await user.click(screen.getByRole('button', { name: 'パスワード変更' }));
    await user.click(screen.getByRole('button', { name: '送信する' }));

    // --- 検証 ---
    await waitFor(() => {
      // エラートーストが表示されたか
      expect(mockedToastError).toHaveBeenCalledWith(
        '予期せぬエラーが発生しました。',
      );
      // ボタンの無効化が解除され、テキストが元に戻っているか
      expect(
        screen.getByRole('button', { name: '送信する' }),
      ).not.toBeDisabled();
    });
  });

  // 5. ログアウトリンクのテスト
  it('ログアウトリンクが正しいURLで表示されていること', () => {
    render(<UserProfileClient user={mockUser} />);

    // 1. "ログアウト" というアクセシブルネームを持つ「リンク」を探す
    const logoutLink = screen.getByRole('link', { name: /ログアウト/i });

    // 2. リンクがドキュメント内に存在することを検証
    expect(logoutLink).toBeInTheDocument();

    // 3. リンクが正しいhref属性を持っていることを検証
    expect(logoutLink).toHaveAttribute('href', '/auth/logout');
  });

  // 6. ダイアログのキャンセル操作のテスト
  it('ユーザーがキャンセルボタンをクリックすると、ダイアログが閉じること', async () => {
    render(<UserProfileClient user={mockUser} />);

    // --- ユーザー操作 ---
    // 1. 「パスワード変更」ボタンをクリックしてダイアログを開く
    await user.click(screen.getByRole('button', { name: 'パスワード変更' }));

    // 2. ダイアログが表示されていることを確認
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
    expect(cancelButton).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: /パスワード変更の確認/i }),
    ).toBeInTheDocument();

    // 3. キャンセルボタンをクリックする
    await user.click(cancelButton);

    // --- 検証 ---
    // ダイアログが閉じていること（ダイアログのタイトルが存在しないこと）を確認
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /パスワード変更の確認/i }),
      ).not.toBeInTheDocument();
    });

    // パスワード変更アクションは呼び出されていないことを確認
    expect(mockedRequestPasswordChange).not.toHaveBeenCalled();
  });
});
