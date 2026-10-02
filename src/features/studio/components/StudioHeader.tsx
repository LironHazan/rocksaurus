import { Circle, Loader2 } from 'lucide-react';
import { Button, SegmentedControl } from '../../../ui';
import type { Format, FormatId } from '../../../engine/types';
import { formatTime } from '../../../lib/time';
import styles from '../Studio.module.css';

interface StudioHeaderProps {
  title: string;
  duration: number;
  formats: Record<FormatId, Format>;
  formatId: FormatId;
  recording: boolean;
  disabled: boolean;
  onFormatChange: (id: FormatId) => void;
  onRecord: () => void;
}

export function StudioHeader(props: StudioHeaderProps) {
  const { title, duration, formats, formatId, recording, disabled } = props;
  const options = (Object.entries(formats) as [FormatId, Format][]).map(([value, f]) => ({ value, label: f.label }));
  const size = formats[formatId];
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>
          {formatTime(duration)} · {size.width}×{size.height}
        </p>
      </div>
      <div className={styles.headerActions}>
        <SegmentedControl
          label="Format"
          value={formatId}
          options={options}
          onChange={props.onFormatChange}
          disabled={recording}
        />
        <Button variant="danger" onClick={props.onRecord} disabled={disabled || recording}>
          {recording ? (
            <Loader2 size={16} className={styles.spin} aria-hidden />
          ) : (
            <Circle size={12} fill="currentColor" aria-hidden />
          )}
          {recording ? 'Recording…' : 'Record video'}
        </Button>
      </div>
    </header>
  );
}
