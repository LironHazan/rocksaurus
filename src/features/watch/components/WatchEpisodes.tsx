import type { EpisodeFolder } from '../../../episodes';
import { formatTime } from '../../../lib/time';
import styles from '../WatchPage.module.css';

interface WatchEpisodesProps {
  folders: readonly EpisodeFolder[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** Every episode, grouped by folder, as big tappable rows (no collapsing: it's a phone, scrolling is free). */
export function WatchEpisodes({ folders, activeId, onSelect }: WatchEpisodesProps) {
  return (
    <nav className={styles.episodes} aria-label="Episodes">
      {folders.map(folder => (
        <section key={folder.id}>
          <h2 className={styles.folder}>{folder.title}</h2>
          <ul className={styles.list}>
            {folder.episodes.map(e => (
              <li key={e.id}>
                <button
                  type="button"
                  className={styles.row}
                  aria-current={e.id === activeId ? 'page' : undefined}
                  onClick={() => onSelect(e.id)}
                >
                  <span className={styles.rowTitle}>{e.title}</span>
                  <span className={styles.rowMeta}>{formatTime(e.duration)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
