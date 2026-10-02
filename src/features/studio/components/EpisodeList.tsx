import { Film } from 'lucide-react';
import type { Episode } from '../../../engine/types';
import { formatTime } from '../../../lib/time';
import styles from '../Studio.module.css';

interface EpisodeListProps {
  episodes: readonly Episode[];
  activeId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

/** Sidebar list of episodes; the active one is highlighted. */
export function EpisodeList({ episodes, activeId, disabled, onSelect }: EpisodeListProps) {
  return (
    <nav className={styles.sidebar} aria-label="Episodes">
      <h2 className={styles.sidebarTitle}>
        <Film size={14} aria-hidden /> Episodes <span className={styles.count}>{episodes.length}</span>
      </h2>
      <ul className={styles.episodeList}>
        {episodes.map(e => (
          <li key={e.id}>
            <button
              type="button"
              className={styles.episode}
              aria-current={e.id === activeId ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onSelect(e.id)}
            >
              <span className={styles.episodeTitle}>{e.title}</span>
              <span className={styles.episodeMeta}>{formatTime(e.duration)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
