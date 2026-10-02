import { audio } from '../audio/context';
import type { Player } from './player';

const TYPES = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm'];

export interface RecordOptions {
  fps?: number;
  /** File name without extension. */
  name?: string;
}

/** Triggers a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Records one full pass of the episode (picture + sound) and downloads it. Resolves with the filename. */
export async function recordEpisode(
  player: Player,
  canvas: HTMLCanvasElement,
  { fps = 30, name = 'episode' }: RecordOptions = {},
): Promise<string> {
  const mimeType = TYPES.find(m => MediaRecorder.isTypeSupported(m));
  if (!mimeType) throw new Error('Recording is not supported in this browser.');

  await player.setSound(true); // restarts the timeline with music scheduled from 0
  const stream = canvas.captureStream(fps);
  audio.recordStream.getAudioTracks().forEach(track => stream.addTrack(track));
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000, audioBitsPerSecond: 192_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = e => {
    if (e.data.size) chunks.push(e.data);
  };

  return new Promise(resolve => {
    rec.onstop = () => {
      const filename = `${name}.${mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'}`;
      downloadBlob(new Blob(chunks, { type: mimeType }), filename);
      resolve(filename);
    };
    rec.start();
    player.onceLoopEnd(() => rec.stop());
  });
}
