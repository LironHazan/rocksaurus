import { useSyncExternalStore } from 'react';

/**
 * A phone: a touch screen that is narrow (portrait) or short (landscape). A narrow desktop window has a mouse
 * (`pointer: fine`) and a tablet is wide enough, so neither counts.
 */
export const PHONE_QUERY = '(pointer: coarse) and (max-width: 700px), (pointer: coarse) and (max-height: 500px)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/** Whether this device is a phone; follows rotation and resizing. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE_QUERY).matches);
}
