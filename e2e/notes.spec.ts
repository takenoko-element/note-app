// e2e/notes.spec.ts
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('ノート機能のE2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    execSync('npm run db:test:reset', { stdio: 'inherit' });
    await page.goto('/');
  });

  // --- 1. 新規作成シナリオ ---
  test('新しいノートを作成すると、一覧に正しく表示される', async ({ page }) => {
    const newNoteTitle = `E2Eテストノート ${Date.now()}`;
    const newNoteContent = 'これはPlaywrightによるテストで作成されました。';

    // フォームに入力
    await page.getByPlaceholder('タイトル').fill(newNoteTitle);
    await page.getByPlaceholder('内容').fill(newNoteContent);
    await page.getByRole('button', { name: '作成' }).click();

    // 検証：作成したノートがカードとして表示されるのを待つ
    const newNoteCard = page.locator('[data-slot="card"]', {
      hasText: newNoteTitle,
    });
    await expect(newNoteCard).toBeVisible();
    await expect(newNoteCard.getByText(newNoteContent)).toBeVisible();
  });

  // --- 2. 編集シナリオ ---
  test('既存のノートを編集すると、変更が一覧に反映される', async ({ page }) => {
    // --- 準備：まずテスト用のノートを1件作成する ---
    const originalTitle = '編集前のタイトル';
    await page.getByPlaceholder('タイトル').fill(originalTitle);
    await page.getByPlaceholder('内容').fill('編集前の内容');
    await page.getByRole('button', { name: '作成' }).click();
    const noteCard = page.locator('[data-slot="card"]', {
      hasText: originalTitle,
    });
    await expect(noteCard).toBeVisible();

    // --- 実行：編集操作 ---
    const updatedTitle = '編集後のタイトル';
    // 編集ボタンをクリックして、編集フォームを表示
    await noteCard.getByRole('button', { name: '編集' }).click();

    const editForm = page.locator('form:has-text("保存")');

    // 編集フォームの入力欄を新しい内容で埋める
    await editForm.locator('input[name="title"]').fill(updatedTitle);
    await editForm.locator('textarea[name="content"]').fill('編集後の内容');

    // 保存ボタンをクリック
    await editForm.getByRole('button', { name: '保存' }).click();

    // --- 検証 ---
    // 古いタイトルのカードが消えていること
    await expect(
      page.locator('[data-slot="card"]', { hasText: originalTitle }),
    ).not.toBeVisible();
    // 新しいタイトルのカードが表示されていること
    await expect(
      page.locator('[data-slot="card"]', { hasText: updatedTitle }),
    ).toBeVisible();
  });

  // --- 3. 削除シナリオ ---
  test('ノートを削除すると、一覧から消える', async ({ page }) => {
    // --- 準備：テスト用のノートを1件作成する ---
    const titleToDelete = '削除されるノート';
    await page.getByPlaceholder('タイトル').fill(titleToDelete);
    await page.getByPlaceholder('内容').fill('このノートは削除されます');
    await page.getByRole('button', { name: '作成' }).click();
    const noteCard = page.locator('[data-slot="card"]', {
      hasText: titleToDelete,
    });
    await expect(noteCard).toBeVisible();

    // --- 実行：削除操作 ---
    await noteCard.getByRole('button', { name: '削除' }).click();

    // --- 検証 ---
    // 削除したノートのカードが表示されていないことを確認
    await expect(noteCard).not.toBeVisible();
  });

  // --- 4. 閲覧シナリオ ---
  test('ノートのタイトルをクリックすると、詳細ページに遷移する', async ({
    page,
  }) => {
    // --- 準備：テスト用のノートを1件作成する ---
    const noteTitle = '詳細ページへ遷移するノート';
    await page.getByPlaceholder('タイトル').fill(noteTitle);
    await page.getByPlaceholder('内容').fill('クリックして詳細を見る');
    await page.getByRole('button', { name: '作成' }).click();
    const noteCard = page.locator('[data-slot="card"]', { hasText: noteTitle });

    // --- 実行：タイトルリンクをクリック ---
    await noteCard.getByRole('link', { name: noteTitle }).click();

    // --- 検証 ---
    // URLが詳細ページのものに変わっていることを確認 (例: /notes/1)
    await expect(page).toHaveURL(/.*\/notes\/\d+/);
    // 詳細ページにノートのタイトルと内容が表示されていることを確認
    await expect(page.getByRole('heading', { name: noteTitle })).toBeVisible();
    await expect(page.getByText('クリックして詳細を見る')).toBeVisible();
  });
});

// --- 画像付きノートのシナリオ ---
test.describe('画像付きノートのCRUDシナリオ', () => {
  const imageNoteTitle = `画像付きテストノート ${Date.now()}`;
  const firstImagePath = './e2e/test_image.png';
  const editImagePath = './e2e/edit_image.png';

  test.beforeEach(async ({ page }) => {
    execSync('npm run db:test:reset', { stdio: 'inherit' });
    await page.goto('/');
  });

  // 5. 画像付きの新規作成シナリオ
  test('画像付きで新しいノートを作成すると、画像が正しく表示される', async ({
    page,
  }) => {
    // --- 実行 ---
    // フォームに入力
    await page.getByPlaceholder('タイトル').fill(imageNoteTitle);
    await page.getByPlaceholder('内容').fill('画像アップロードのテストです。');

    // ファイル選択: setInputFilesでinput要素にファイルをセット
    await page.getByTestId('dropzone-input').setInputFiles(firstImagePath);

    // 画像のプレビューが表示されるのを待つ
    await expect(page.locator('img[alt="プレビュー"]')).toBeVisible();

    // 作成ボタンをクリック
    await page.getByRole('button', { name: '作成' }).click();

    // --- 検証 ---
    // 作成したノートのカードを探す
    const newNoteCard = page.locator('[data-slot="card"]', {
      hasText: imageNoteTitle,
    });
    await expect(newNoteCard).toBeVisible();

    // カード内に画像が表示されていることを確認 (alt属性で特定)
    const imageInCard = newNoteCard.getByRole('img', { name: imageNoteTitle });
    await expect(imageInCard).toBeVisible();
    // src属性にSupabaseのURLが含まれていることを確認
    await expect(imageInCard).toHaveAttribute('src', /supabase/);
  });

  // 6. 画像の変更シナリオ
  test('既存のノートの画像を編集（追加）できる', async ({ page }) => {
    // --- 準備：まず画像なしのノートを作成 ---
    const noteTitle = '画像を追加するノート';
    await page.getByPlaceholder('タイトル').fill(noteTitle);
    await page.getByPlaceholder('内容').fill('ここに画像が追加されます。');
    await page.getByRole('button', { name: '作成' }).click();
    const noteCard = page.locator('[data-slot="card"]', { hasText: noteTitle });
    await expect(noteCard).toBeVisible();
    // 作成直後は画像がないことを確認
    await expect(noteCard.getByRole('img')).not.toBeVisible();

    // --- 実行 ---
    // 編集ボタンをクリック
    await noteCard.getByRole('button', { name: '編集' }).click();

    // 編集フォームのinput要素にファイルをセット
    const editForm = page.locator('form:has-text("保存")');
    await editForm.locator('input[name="image"]').setInputFiles(editImagePath);

    // プレビューが表示されるのを待つ
    await expect(editForm.locator('img[alt="プレビュー"]')).toBeVisible();

    // 保存ボタンをクリック
    await editForm.getByRole('button', { name: '保存' }).click();

    // --- 検証 ---
    // 更新後のカードに画像が表示されていることを確認
    const updatedCard = page.locator('[data-slot="card"]', {
      hasText: noteTitle,
    });
    const imageInCard = updatedCard.getByRole('img', { name: noteTitle });
    await expect(imageInCard).toBeVisible();
    await expect(imageInCard).toHaveAttribute('src', /supabase/);
  });

  // 7. 画像の削除シナリオ
  test('既存のノートの画像を削除できる', async ({ page }) => {
    // --- 準備：まず画像ありのノートを作成 ---
    const noteTitle = '画像を削除するノート';
    await page.getByPlaceholder('タイトル').fill(noteTitle);
    await page
      .getByPlaceholder('内容')
      .fill('このノートの画像が削除されます。');
    await page.getByTestId('dropzone-input').setInputFiles(firstImagePath);
    await page.getByRole('button', { name: '作成' }).click();
    const noteCard = page.locator('[data-slot="card"]', { hasText: noteTitle });
    await expect(noteCard.getByRole('img', { name: noteTitle })).toBeVisible();

    // --- 実行 ---
    // 編集ボタンをクリック
    await noteCard.getByRole('button', { name: '編集' }).click();

    // 編集フォームの「画像をクリア」ボタンをクリック
    const editForm = page.locator('form:has-text("保存")');
    await editForm.getByRole('button', { name: '画像をクリア' }).click();

    // プレビューが消えたことを確認
    await expect(editForm.locator('img[alt="プレビュー"]')).not.toBeVisible();

    // 保存ボタンをクリック
    await editForm.getByRole('button', { name: '保存' }).click();

    // --- 検証 ---
    // 更新後のカードに画像が表示されていないことを確認
    const updatedCard = page.locator('[data-slot="card"]', {
      hasText: noteTitle,
    });
    await expect(
      updatedCard.getByRole('img', { name: noteTitle }),
    ).not.toBeVisible();
  });
});

test.describe('認証フローのE2Eテスト', () => {
  // --- 8. ログアウトシナリオ ---
  test('ログアウトリンクをクリックすると、未ログイン状態に戻る', async ({
    page,
  }) => {
    // 準備：まずトップページにいることを確認
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'パスワード変更' }),
    ).toBeVisible();

    // 実行：ヘッダーのログアウトリンクをクリック
    await page.getByRole('link', { name: 'ログアウト' }).click();

    // 検証：ログアウトが完了し、ログインボタンが表示されるのを待つ
    // ログアウト後はトップページにリダイレクトされるはず
    const mainPage = page.getByRole('main');
    await expect(
      mainPage.getByRole('heading', { name: 'Note Appへようこそ' }),
    ).toBeVisible();
    await expect(
      mainPage.getByRole('link', { name: 'ログイン' }),
    ).toBeVisible();
  });
});
