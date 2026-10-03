import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button, Slider } from '../../../ui';
import { formatTime } from '../../../lib/time';
import styles from '../WatchPage.module.css';

interface WatchControlsProps {
  time: number;
  duration: number;
  soundOn: boolean;
  paused: boolean;
  disabled: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onSeek: (t: number) => void;
}

/** Play/pause, sound and a scrubber, sized for thumbs. */
export function WatchControls({
  time,
  duration,
  soundOn,
  paused,
  disabled,
  onTogglePause,
  onToggleSound,
  onSeek,
}: WatchControlsProps) {
  return (
    <div className={styles.controls}>
      <Button
        icon
        variant="ghost"
        className={styles.big}
        aria-label={paused ? 'Play' : 'Pause'}
        disabled={disabled}
        onClick={onTogglePause}
      >
        {paused ? <Play size={22} /> : <Pause size={22} />}
      </Button>
      <Button
        icon
        variant="ghost"
        className={styles.big}
        aria-label="Sound"
        pressed={soundOn}
        disabled={disabled}
        onClick={onToggleSound}
      >
        {soundOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
      </Button>
      <div className={styles.scrubber}>
        <Slider label="Timeline" value={time} max={duration} onChange={onSeek} />
      </div>
      <span className={styles.clock}>
        {formatTime(time)} <span className={styles.clockTotal}>/ {formatTime(duration)}</span>
      </span>
    </div>
  );
}
