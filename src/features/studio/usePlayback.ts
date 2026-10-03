import { useSyncExternalStore } from 'react';
import type { Player, PlayerSnapshot } from '../../engine/player';

const IDLE: PlayerSnapshot = { time: 0, soundOn: false, paused: false };
const noopSubscribe = () => () => {};
const idleSnapshot = () => IDLE;

/** Current playback time and sound state, updated ~10×/s (not every frame). */
export function usePlayback(player: Player | null): PlayerSnapshot {
  return useSyncExternalStore(player?.subscribe ?? noopSubscribe, player?.getSnapshot ?? idleSnapshot);
}
