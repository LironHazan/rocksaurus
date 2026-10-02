import { audio } from '../audio/context.js';

const TYPES = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm'];

/** Records one full pass of the episode (picture + sound) and downloads it. Resolves with the filename. */
export async function recordEpisode(player, canvas, { fps = 30, name = 'episode' } = {}) {
  const mimeType = TYPES.find(m => MediaRecorder.isTypeSupported(m));
  if (!mimeType) throw new Error('Recording is not supported in this browser.');

  await player.setSound(true); // restarts the timeline with music scheduled from 0
  const stream = canvas.captureStream(fps);
  audio.recordStream.getAudioTracks().forEach(track => stream.addTrack(track));
  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000, audioBitsPerSecond: 192_000 });
  const chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);

  return new Promise(resolve => {
    rec.onstop = () => {
      const filename = `${name}.${mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'}`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
      a.download = filename;
      a.click();
      resolve(filename);
    };
    rec.start();
    player.onceLoopEnd(() => rec.stop());
  });
}
