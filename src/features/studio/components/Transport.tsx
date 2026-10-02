import { useState } from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button, Slider, Tooltip } from '../../../ui';
import { formatTime } from '../../../lib/time';
import styles from '../Studio.module.css';

interface TransportProps {
  time: number;
  duration: number;
  soundOn: boolean;
  disabled: boolean;
  onRestart: () => void;
  onToggleSound: () => void;
  onSeek: (t: number) => void;
}

/** Restart, sound, and the timeline scrubber under the preview. */
export function Transport({ time, duration, soundOn, disabled, onRestart, onToggleSound, onSeek }: TransportProps) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? time;
  return (
    <div className={styles.transport}>
      <Tooltip label="Restart">
        <Button icon variant="ghost" aria-label="Restart" disabled={disabled} onClick={onRestart}>
          <RotateCcw size={18} />
        </Button>
      </Tooltip>
      <Tooltip label={soundOn ? 'Mute' : 'Play with sound'}>
        <Button icon variant="ghost" aria-label="Sound" pressed={soundOn} disabled={disabled} onClick={onToggleSound}>
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </Button>
      </Tooltip>
      <Slider
        label="Timeline"
        value={shown}
        max={duration}
        onChange={t => {
          setDragValue(t);
          onSeek(t);
        }}
        onCommit={() => setDragValue(null)}
      />
      <span className={styles.clock}>
        {formatTime(shown)} <span className={styles.clockTotal}>/ {formatTime(duration)}</span>
      </span>
    </div>
  );
}
