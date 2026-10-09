import { expect, test } from '@playwright/test';
import { REGISTERED } from './episodes';
import { expectPicture, watchErrors } from './helpers';

const PREVIEW = 'section[aria-label="Preview"]';

test('the registry lists every Short in the sidebar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: `Episodes ${REGISTERED.length}` })).toBeVisible();
});

// One test per Short, so they run in parallel and a failure names the Short. Each one plays the start, then seeks
// to the middle and to the end card: a runtime error anywhere in setup() or update(t) fails it.
for (const { id, title } of REGISTERED) {
  test(`${title} renders with no errors`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    await page.goto(`/?episode=${id}`);
    const nav = page.getByRole('navigation', { name: 'Episodes' });
    await expect(nav.locator('[aria-current="page"]')).toContainText(title);
    await expectPicture(page, PREVIEW);

    const timeline = page.getByRole('slider', { name: 'Timeline' });
    await timeline.focus();
    for (let i = 0; i < 15; i++) await page.keyboard.press('PageUp');
    await expectPicture(page, PREVIEW);
    await page.keyboard.press('End');
    await expectPicture(page, PREVIEW);
    expect(errors).toEqual([]);
  });
}

test('pause, restart and the format switch keep a picture', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = watchErrors(page);
  await page.goto('/');
  await expectPicture(page, PREVIEW);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await page.getByRole('radio', { name: /16:9/ }).click();
  await expect(page).toHaveURL(/format=landscape/);
  await expectPicture(page, PREVIEW);
  expect(errors).toEqual([]);
});
