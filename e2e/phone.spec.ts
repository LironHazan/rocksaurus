import { expect, test } from '@playwright/test';
import { expectPicture, watchErrors } from './helpers';

test('a phone is sent from the studio to the watch page, keeping the Short', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await page.goto('/?episode=office-besties&format=landscape');
  await expect(page).toHaveURL(/\/watch\?episode=office-besties$/);
  await expect(page.getByRole('navigation', { name: 'Episodes' })).toBeVisible();
  await expectPicture(page, 'section[aria-label="Video"]');
  expect(errors).toEqual([]);
});
