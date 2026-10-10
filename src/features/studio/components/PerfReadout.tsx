import type { FrameStats } from '../frameStats';
import styles from '../Studio.module.css';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** One line of numbers under the preview: what the current frame costs. For tuning scenes; shown in dev only. */
export function PerfReadout({ stats }: { stats: FrameStats | null }) {
  if (!stats) return null;
  return (
    <p className={styles.perf} aria-label="Performance">
      {stats.drawCalls} draw calls · {compact.format(stats.triangles)} triangles · {Math.round(stats.fps)} fps
    </p>
  );
}
