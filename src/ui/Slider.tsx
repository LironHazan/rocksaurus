import * as RadixSlider from '@radix-ui/react-slider';
import styles from './ui.module.css';

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
}

export function Slider({ label, value, min = 0, max, step = 0.1, onChange, onCommit }: SliderProps) {
  return (
    <RadixSlider.Root
      className={styles.slider}
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => v !== undefined && onChange(v)}
      onValueCommit={([v]) => v !== undefined && onCommit?.(v)}
    >
      <RadixSlider.Track className={styles.track}>
        <RadixSlider.Range className={styles.range} />
      </RadixSlider.Track>
      <RadixSlider.Thumb className={styles.thumb} aria-label={label} />
    </RadixSlider.Root>
  );
}
