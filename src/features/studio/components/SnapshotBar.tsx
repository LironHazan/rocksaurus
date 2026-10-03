import { Camera } from 'lucide-react';
import { Button, SegmentedControl } from '../../../ui';
import type { SnapshotCrop } from '../../../engine/snapshot';
import { formatTime } from '../../../lib/time';
import styles from '../Studio.module.css';

interface SnapshotBarProps {
  time: number;
  crop: SnapshotCrop;
  captions: boolean;
  disabled: boolean;
  onCropChange: (crop: SnapshotCrop) => void;
  onCaptionsChange: (on: boolean) => void;
  onSave: () => void;
}

/** Save the current frame as a PNG: a 2:3 pin for Pinterest or the whole frame, with or without captions. */
export function SnapshotBar({
  time,
  crop,
  captions,
  disabled,
  onCropChange,
  onCaptionsChange,
  onSave,
}: SnapshotBarProps) {
  return (
    <div className={styles.snapshotBar}>
      <SegmentedControl
        label="Snapshot shape"
        value={crop}
        options={[
          { value: 'pinterest', label: 'Pinterest 2:3' },
          { value: 'full', label: 'Full frame' },
        ]}
        onChange={onCropChange}
        disabled={disabled}
      />
      <SegmentedControl
        label="Snapshot captions"
        value={captions ? 'on' : 'off'}
        options={[
          { value: 'off', label: 'No captions' },
          { value: 'on', label: 'Captions' },
        ]}
        onChange={v => onCaptionsChange(v === 'on')}
        disabled={disabled}
      />
      <Button onClick={onSave} disabled={disabled}>
        <Camera size={16} aria-hidden />
        Save snapshot at {formatTime(time)}
      </Button>
    </div>
  );
}
