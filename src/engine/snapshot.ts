import { downloadBlob } from './recorder';

/** `pinterest` = a centered 2:3 crop at 1000×1500 (Pinterest's favorite pin shape); `full` = the whole frame. */
export type SnapshotCrop = 'pinterest' | 'full';

export const PIN_SIZE = { width: 1000, height: 1500 } as const;

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** The largest centered rectangle of the given aspect ratio (width / height) inside a width × height frame. */
export function cropRect(width: number, height: number, aspect: number): CropRect {
  const sw = Math.min(width, height * aspect);
  const sh = sw / aspect;
  return { sx: (width - sw) / 2, sy: (height - sh) / 2, sw, sh };
}

/** A copy of the canvas, optionally cropped to a Pinterest pin. */
export function snapshotCanvas(source: HTMLCanvasElement, crop: SnapshotCrop): HTMLCanvasElement {
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not supported in this browser.');
  if (crop === 'full') {
    out.width = source.width;
    out.height = source.height;
    ctx.drawImage(source, 0, 0);
    return out;
  }
  const { sx, sy, sw, sh } = cropRect(source.width, source.height, PIN_SIZE.width / PIN_SIZE.height);
  out.width = PIN_SIZE.width;
  out.height = PIN_SIZE.height;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return out;
}

/** e.g. `meet-steggy-4.2s-pin.png`. */
export function snapshotName(episodeId: string, time: number, crop: SnapshotCrop): string {
  return `${episodeId}-${time.toFixed(1)}s-${crop === 'pinterest' ? 'pin' : 'frame'}.png`;
}

/** Downloads the canvas as a PNG. Resolves with the file name. */
export function saveSnapshot(canvas: HTMLCanvasElement, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Could not create the image.'));
      downloadBlob(blob, filename);
      resolve(filename);
    }, 'image/png');
  });
}
