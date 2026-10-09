import { expect, test } from '@playwright/test';
import { PAGE_TEST_TIMEOUT_MS, expectPicture, watchErrors } from './helpers';

test('a phone is sent from the studio to the watch page, keeping the Short', async ({ page }) => {
  test.setTimeout(PAGE_TEST_TIMEOUT_MS);
  const errors = watchErrors(page);
  await page.goto('/?episode=office-besties&format=landscape');
  await expect(page).toHaveURL(/\/watch\?episode=office-besties$/);
  await expect(page.getByRole('navigation', { name: 'Episodes' })).toBeVisible();
  await expectPicture(page, 'section[aria-label="Video"]');
  expect(errors).toEqual([]);
});
