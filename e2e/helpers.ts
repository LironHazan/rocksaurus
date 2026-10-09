import { expect, type Page } from '@playwright/test';

/** Bytes per pixel in `ImageData`: red, green, blue, alpha. */
const RGBA = 4;
/** Read every 97th pixel: enough to tell a picture from a blank frame, and a prime, so samples don't line up with rows. */
const SAMPLE_EVERY = 97;
/** Brightness variance above which a frame counts as a picture (a blank, one-colour frame is 0). */
const PICTURE_VARIANCE = 50;
/**
 * How long a page may take to show its first picture. CI has no GPU: three.js renders WebGL2 in software, and building
 * a Short's scene and compiling its shaders takes 30 s or more there.
 */
export const FIRST_PICTURE_TIMEOUT_MS = 150_000;
/** A test that loads the app and waits for a picture: the first picture plus time for the rest of the test. */
export const PAGE_TEST_TIMEOUT_MS = FIRST_PICTURE_TIMEOUT_MS + 30_000;

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
    .evaluate((c: HTMLCanvasElement, stride) => {
      const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
      let sum = 0,
        sumOfSquares = 0,
        samples = 0;
      for (let i = 0; i < data.length; i += stride) {
        const brightness = data[i]! + data[i + 1]! + data[i + 2]!;
        sum += brightness;
        sumOfSquares += brightness * brightness;
        samples++;
      }
      return sumOfSquares / samples - (sum / samples) ** 2;
    }, RGBA * SAMPLE_EVERY);
}

/** Waits until the preview shows a picture (not a blank canvas). */
export async function expectPicture(page: Page, scope: string): Promise<void> {
  await expect
    .poll(() => canvasVariance(page, scope), { timeout: FIRST_PICTURE_TIMEOUT_MS })
    .toBeGreaterThan(PICTURE_VARIANCE);
}
