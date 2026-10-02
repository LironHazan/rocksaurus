import { useState } from 'react';
import { ChevronRight, Film, Folder, FolderOpen } from 'lucide-react';
import type { EpisodeFolder } from '../../../episodes';
import { formatTime } from '../../../lib/time';
import styles from '../Studio.module.css';

interface EpisodeListProps {
  folders: readonly EpisodeFolder[];
  activeId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

const folderOf = (folders: readonly EpisodeFolder[], episodeId: string) =>
  folders.find(f => f.episodes.some(e => e.id === episodeId))?.id;

/** Sidebar of episodes grouped into collapsible folders; the active episode is highlighted and its folder kept open. */
export function EpisodeList({ folders, activeId, disabled, onSelect }: EpisodeListProps) {
  const activeFolder = folderOf(folders, activeId);
  const [open, setOpen] = useState(() => new Set(activeFolder ? [activeFolder] : []));
  const [shownFolder, setShownFolder] = useState(activeFolder);
  if (activeFolder !== shownFolder) {
    // the active episode moved (e.g. via the URL): reveal its folder
    setShownFolder(activeFolder);
    if (activeFolder && !open.has(activeFolder)) setOpen(new Set(open).add(activeFolder));
  }

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const total = folders.reduce((n, f) => n + f.episodes.length, 0);

  return (
    <nav className={styles.sidebar} aria-label="Episodes">
      <h2 className={styles.sidebarTitle}>
        <Film size={14} aria-hidden /> Episodes <span className={styles.count}>{total}</span>
      </h2>
      <ul className={styles.folderList}>
        {folders.map(folder => {
          const isOpen = open.has(folder.id);
          const listId = `folder-${folder.id}`;
          const Icon = isOpen ? FolderOpen : Folder;
          return (
            <li key={folder.id}>
              <button
                type="button"
                className={styles.folder}
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => toggle(folder.id)}
              >
                <ChevronRight size={14} className={styles.chevron} aria-hidden />
                <Icon size={14} aria-hidden />
                <span className={styles.episodeTitle}>{folder.title}</span>
                <span className={styles.episodeMeta}>{folder.episodes.length}</span>
              </button>
              {isOpen && (
                <ul id={listId} className={styles.episodeList}>
                  {folder.episodes.map(e => (
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
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
