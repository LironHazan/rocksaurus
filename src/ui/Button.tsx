import type { ButtonHTMLAttributes } from 'react';
import styles from './ui.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  /** Square icon-only button (give it an aria-label). */
  icon?: boolean;
  pressed?: boolean;
}

export function Button({ variant = 'default', icon, pressed, className, type = 'button', ...rest }: ButtonProps) {
  const classes = [
    styles.button,
    variant !== 'default' && styles[variant],
    icon && styles.icon,
    pressed && styles.pressed,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={classes} aria-pressed={pressed} {...rest} />;
}
