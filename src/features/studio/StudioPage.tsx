import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { folders, findEpisode } from '../../episodes';
import { DEFAULT_FORMAT, FORMATS, isFormatId } from '../../engine/formats';
import { CAPTION_FONT } from '../../engine/captions';
import { recordEpisode } from '../../engine/recorder';
import type { FormatId } from '../../engine/types';
import { parseDebugCamera } from './debugCamera';
import { useStudioSession } from './useStudioSession';
import { usePlayback } from './usePlayback';
import { EpisodeList } from './components/EpisodeList';
import { StudioHeader } from './components/StudioHeader';
import { Transport } from './components/Transport';
import styles from './Studio.module.css';

/** The studio: pick an episode and format, preview it, scrub it, record it to a video file. */
export function StudioPage() {
  const [params, setParams] = useSearchParams();
  const episode = findEpisode(params.get('episode'));
  const formatParam = params.get('format');
  const formatId: FormatId = isFormatId(formatParam) ? formatParam : DEFAULT_FORMAT;
  const debugCamera = parseDebugCamera(params.get('cam'));

  const { containerRef, session } = useStudioSession(episode, FORMATS[formatId], debugCamera);
  const { time, soundOn } = usePlayback(session?.player ?? null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');

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
            disabled={!session || recording}
            onRestart={() => session?.player.restart()}
            onToggleSound={() => void session?.player.setSound(!soundOn)}
            onSeek={t => session?.player.seek(t)}
          />
        </div>
        <p className={styles.status} role="status">
          {status}
        </p>
      </section>
    </div>
  );
}
