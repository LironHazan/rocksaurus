import { expect, test } from '@playwright/test';
import { PAGE_TEST_TIMEOUT_MS, expectPicture, watchErrors } from './helpers';

// A smoke test of the real app in a real browser. Every Short's setup() and update(t) is covered, much faster, by
// src/episodes/episodes.smoke.test.ts; this checks what only a browser can: the renderer draws, and the UI works.

const PREVIEW = 'section[aria-label="Preview"]';

test('the studio renders the default Short, and pause, restart and the format switch keep a picture', async ({
  page,
}) => {
  test.setTimeout(PAGE_TEST_TIMEOUT_MS);
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Episodes' })).toBeVisible();
  await expectPicture(page, PREVIEW);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await page.getByRole('radio', { name: /16:9/ }).click();
  await expect(page).toHaveURL(/format=landscape/);
  await expectPicture(page, PREVIEW);
  expect(errors).toEqual([]);
});
