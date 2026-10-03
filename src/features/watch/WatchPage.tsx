import { useSearchParams } from 'react-router';
import { Play } from 'lucide-react';
import { folders, findEpisode } from '../../episodes';
import { formatTime } from '../../lib/time';
import { useStudioSession } from '../studio/useStudioSession';
import { usePlayback } from '../studio/usePlayback';
import { WatchControls } from './components/WatchControls';
import { WatchEpisodes } from './components/WatchEpisodes';
import { WATCH_FORMAT } from './watchFormat';
import styles from './WatchPage.module.css';

/**
 * A watch-only version of the studio for phones: the video, simple controls and the episode list.
 * No recording, snapshots or format switching. Link to one episode with `/watch?episode=<id>`.
 */
export function WatchPage() {
  const [params, setParams] = useSearchParams();
  const episode = findEpisode(params.get('episode'));
  const { containerRef, session } = useStudioSession(episode, WATCH_FORMAT, null);
  const { time, soundOn, paused } = usePlayback(session?.player ?? null);
  const player = session?.player;

  const select = (id: string) => {
    setParams({ episode: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <span aria-hidden>🦖</span>
        <span className={styles.brand}>Rocksaurus</span>
      </header>

      <section className={styles.player} aria-label="Video">
        <div className={styles.box}>
          <div ref={containerRef} className={styles.stage} />
          {!soundOn && !paused && (
            <button
              type="button"
              className={styles.overlay}
              aria-label="Play with sound"
              disabled={!player}
              onClick={() => void player?.setSound(true)}
            >
              <span className={styles.playCircle}>
                <Play size={34} fill="currentColor" aria-hidden />
              </span>
              Tap to play with sound
            </button>
          )}
        </div>
        <WatchControls
          time={time}
          duration={episode.duration}
          soundOn={soundOn}
          paused={paused}
          disabled={!player}
          onTogglePause={() => (paused ? player?.resume() : player?.pause())}
          onToggleSound={() => void player?.setSound(!soundOn)}
          onSeek={t => player?.seek(t)}
        />
      </section>

      <div className={styles.now}>
        <h1 className={styles.title}>{episode.title}</h1>
        <p className={styles.meta}>{formatTime(episode.duration)}</p>
      </div>

      <WatchEpisodes folders={folders} activeId={episode.id} onSelect={select} />
    </div>
  );
}
