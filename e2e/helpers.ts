import { expect, type Page } from '@playwright/test';

/** Collects console errors and uncaught exceptions from the moment it is called. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}

/** How varied the preview's pixels are: 0 for a blank (one-colour) frame. */
export async function canvasVariance(page: Page, scope: string): Promise<number> {
  return page
    .locator(`${scope} canvas`)
    .first()
    .evaluate((c: HTMLCanvasElement) => {
      const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
      let sum = 0,
        sq = 0,
        n = 0;
      for (let i = 0; i < data.length; i += 4 * 97) {
        const l = data[i]! + data[i + 1]! + data[i + 2]!;
        sum += l;
        sq += l * l;
        n++;
      }
      return sq / n - (sum / n) ** 2;
    });
}

/** Waits until the preview shows a picture (not a blank canvas). Software WebGL compiles shaders slowly, so the first
 * picture of a Short can take a while. */
export async function expectPicture(page: Page, scope: string): Promise<void> {
  await expect.poll(() => canvasVariance(page, scope), { timeout: 150_000 }).toBeGreaterThan(50);
}
