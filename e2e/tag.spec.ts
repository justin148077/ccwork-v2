import { test, expect, type Page } from '@playwright/test';

// 새 노트 생성(createNote)은 title/content만 받고 tags를 받지 않는다
// (docs/features/tag/issues.md의 구조적 제약) — 그래서 태그를 붙이려면
// 먼저 저장해 기존 노트로 만든 뒤 다시 그 노트를 선택해서 열어야 한다.
// App.tsx는 생성 완료 후 selectedNoteId를 세팅하지 않으므로(onDone만 호출),
// 저장 버튼이 그대로 남아있길 기다리는 대신 목록에 새 노트가 나타나는 것으로
// 저장 완료를 판단한다.
async function createAndOpenNote(page: Page, title: string, content: string) {
  await page.getByRole('button', { name: '+ 새 노트', exact: true }).click();
  await page.getByPlaceholder('제목').fill(title);
  await page.getByPlaceholder('내용을 입력하세요...').fill(content);
  await page.getByRole('button', { name: '저장', exact: true }).click();

  const heading = page.getByRole('heading', { name: title, exact: true });
  await expect(heading).toBeVisible();
  await heading.click();
}

async function deleteNote(page: Page, title: string) {
  const noteRow = page.getByRole('heading', { name: title, exact: true }).locator('xpath=..');
  await noteRow.getByRole('button', { name: '삭제', exact: true }).click();
}

test.describe('US-1 + US-3: 노트에 태그 붙이고 다시 확인하기', () => {
  test('should keep the tag chip visible after saving and reloading the page', async ({ page }) => {
    const title = `E2E 태그 추가 ${Date.now()}`;

    await test.step('기존 노트를 준비해서 연다', async () => {
      await page.goto('/');
      await createAndOpenNote(page, title, 'E2E 태그 추가 테스트용 노트');
    });

    await test.step('태그를 추가하고 저장한다', async () => {
      const tagInput = page.getByPlaceholder('태그 추가');
      await tagInput.fill('react');
      await tagInput.press('Enter');
      await expect(page.getByRole('button', { name: 'react 삭제', exact: true })).toBeVisible();

      await page.getByRole('button', { name: '저장', exact: true }).click();
      await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
    });

    await test.step('새로고침 후 다시 열어도 태그가 그대로 보인다', async () => {
      await page.reload();
      await page.getByRole('heading', { name: title, exact: true }).click();
      await expect(page.getByRole('button', { name: 'react 삭제', exact: true })).toBeVisible();
    });

    await test.step('정리: 테스트에 쓴 노트를 삭제한다', async () => {
      await deleteNote(page, title);
      await expect(page.getByRole('heading', { name: title, exact: true })).not.toBeVisible();
    });
  });
});

test.describe('US-2: 붙인 태그 떼기', () => {
  test('should remove the tag chip after deleting it, saving, and reloading', async ({ page }) => {
    const title = `E2E 태그 삭제 ${Date.now()}`;

    await test.step('태그가 이미 붙은 노트를 준비한다', async () => {
      await page.goto('/');
      await createAndOpenNote(page, title, 'E2E 태그 삭제 테스트용 노트');

      const tagInput = page.getByPlaceholder('태그 추가');
      await tagInput.fill('react');
      await tagInput.press('Enter');
      await page.getByRole('button', { name: '저장', exact: true }).click();
      await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
    });

    await test.step('태그를 삭제하고 저장한다', async () => {
      await page.getByRole('button', { name: 'react 삭제', exact: true }).click();
      await expect(page.getByRole('button', { name: 'react 삭제', exact: true })).not.toBeVisible();

      await page.getByRole('button', { name: '저장', exact: true }).click();
      await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
    });

    await test.step('새로고침 후 다시 열어도 태그가 사라진 채로 유지된다', async () => {
      await page.reload();
      await page.getByRole('heading', { name: title, exact: true }).click();
      await expect(page.getByRole('button', { name: 'react 삭제', exact: true })).not.toBeVisible();
    });

    await test.step('정리: 테스트에 쓴 노트를 삭제한다', async () => {
      await deleteNote(page, title);
      await expect(page.getByRole('heading', { name: title, exact: true })).not.toBeVisible();
    });
  });
});
