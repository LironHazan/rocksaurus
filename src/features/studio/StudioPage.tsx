import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { folders, findEpisode } from '../../episodes';
import { DEFAULT_FORMAT, FORMATS, isFormatId } from '../../engine/formats';
import { CAPTION_FONT } from '../../engine/captions';
import { recordEpisode } from '../../engine/recorder';
import { saveSnapshot, snapshotCanvas, snapshotName, type SnapshotCrop } from '../../engine/snapshot';
import type { FormatId } from '../../engine/types';
import { parseDebugCamera } from './debugCamera';
import { useStudioSession } from './useStudioSession';
import { usePlayback } from './usePlayback';
import { EpisodeList } from './components/EpisodeList';
import { StudioHeader } from './components/StudioHeader';
import { SnapshotBar } from './components/SnapshotBar';
import { Transport } from './components/Transport';
import styles from './Studio.module.css';

/** The studio: pick an episode and format, preview it, scrub it, record it to a video or save a frame as an image. */
export function StudioPage() {
  const [params, setParams] = useSearchParams();
  const episode = findEpisode(params.get('episode'));
  const formatParam = params.get('format');
  const formatId: FormatId = isFormatId(formatParam) ? formatParam : DEFAULT_FORMAT;
  const debugCamera = parseDebugCamera(params.get('cam'));

  const { containerRef, session } = useStudioSession(episode, FORMATS[formatId], debugCamera);
  const { time, soundOn, paused } = usePlayback(session?.player ?? null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [crop, setCrop] = useState<SnapshotCrop>('pinterest');
  const [snapshotCaptions, setSnapshotCaptions] = useState(false);

  const updateParam = (key: string, value: string) =>
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    });

  async function record() {
    if (!session) return;
    setRecording(true);
    setStatus('Recording one full pass with sound — keep this tab visible.');
    try {
      await document.fonts.load(`700 80px ${CAPTION_FONT}`); // never record fallback fonts
      await document.fonts.ready;
      const file = await recordEpisode(session.player, session.stage.canvas, { name: `${episode.id}-${formatId}` });
      setStatus(`Saved ${file}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setRecording(false);
    }
  }

  async function snapshot() {
    if (!session) return;
    try {
      await document.fonts.load(`700 80px ${CAPTION_FONT}`); // captions must not fall back to another font
      const t = session.player.time();
      const canvas = snapshotCanvas(session.player.renderAt(t, snapshotCaptions), crop);
      setStatus(`Saved ${await saveSnapshot(canvas, snapshotName(episode.id, t, crop))}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className={styles.layout}>
      <EpisodeList
        folders={folders}
        activeId={episode.id}
        disabled={recording}
        onSelect={id => updateParam('episode', id)}
      />
      <section className={styles.workspace} aria-label="Preview">
        <StudioHeader
          title={episode.title}
          duration={episode.duration}
          formats={FORMATS}
          formatId={formatId}
          recording={recording}
          disabled={!session}
          onFormatChange={id => updateParam('format', id)}
          onRecord={() => void record()}
        />
        <div className={styles.previewCard}>
          <div className={styles.viewport}>
            <div ref={containerRef} className={styles.stage} data-format={formatId} />
          </div>
          <Transport
            time={time}
            duration={episode.duration}
            soundOn={soundOn}
            paused={paused}
            disabled={!session || recording}
            onTogglePause={() => (paused ? session?.player.resume() : session?.player.pause())}
            onRestart={() => session?.player.restart()}
            onToggleSound={() => void session?.player.setSound(!soundOn)}
            onSeek={t => session?.player.seek(t)}
          />
          <SnapshotBar
            time={time}
            crop={crop}
            captions={snapshotCaptions}
            disabled={!session || recording}
            onCropChange={setCrop}
            onCaptionsChange={setSnapshotCaptions}
            onSave={() => void snapshot()}
          />
        </div>
        <p className={styles.status} role="status">
          {status}
        </p>
      </section>
    </div>
  );
}
