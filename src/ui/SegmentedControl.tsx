import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { ReactNode } from 'react';
import styles from './ui.module.css';

export interface Segment<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly Segment<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

/** A single-choice pill switch (e.g. Shorts / 16:9). */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      className={styles.segmented}
      value={value}
      disabled={disabled}
      onValueChange={v => v && onChange(v as T)}
    >
      {options.map(o => (
        <ToggleGroup.Item key={o.value} value={o.value} className={styles.segment}>
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
