import type * as THREE from 'three';

/** What a band member is doing at a moment of the song. */
export type Activity = 'idle' | 'play' | 'pose';

/**
 * A band member with their instrument, ready to place on a stage. Everything is driven by the song's notes,
 * so `update(t)` is a pure function of time like the rest of the engine.
 */
export interface Performer {
  /** Character + instrument; position/rotate this group to stage them. */
  root: THREE.Group;
  update(t: number): void;
}

/** Shared timing info for a song. */
export interface SongClock {
  /** Seconds per beat. */
  beat: number;
  /** What everyone (or this member) is doing at time t. */
  activity(t: number): Activity;
}
