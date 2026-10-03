import type * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';

/** Output video format (see formats.ts). `safe` = vertical caption positions (0..1) clear of YouTube's UI. */
export interface Format {
  label: string;
  width: number;
  height: number;
  fov: number;
  safe: { top: number; bottom: number };
}

export type FormatId = 'shorts' | 'landscape';

/** A timed on-screen caption (meme style). */
export interface Caption {
  from: number;
  to: number;
  text: string;
  at?: 'top' | 'bottom';
  /** Horizontal alignment (default 'center'); 'left' reads like subtitles and keeps the middle clear. */
  align?: 'center' | 'left';
  /** Explicit vertical position 0..1 (overrides `at`). */
  y?: number;
  /** Font size as a fraction of the frame's short side. */
  size?: number;
  color?: string;
}

export type Overlay = (ctx: CanvasRenderingContext2D) => void;

/** Renderer + camera an episode draws into. `scene` may be swapped by an episode to cut between locations. */
export interface Stage {
  format: Format;
  renderer: WebGPURenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** The composited output canvas (3D + overlay) — what is shown and recorded. */
  canvas: HTMLCanvasElement;
  render(overlay?: Overlay): void;
  dispose(): void;
}

/** What an episode's setup() returns: a pure function of time. */
export interface EpisodeScene {
  update(t: number): void;
  dispose?(): void;
}

/** An episode (one video). Everything is a function of time t in seconds, so renders are deterministic. */
export interface Episode {
  id: string;
  title: string;
  /** Seconds. */
  duration: number;
  captions?: Caption[];
  /** Load assets needed for sound (e.g. recorded tracks) before playback with audio. */
  preload?(): Promise<void>;
  setup(stage: Stage): EpisodeScene;
  /** Schedule music + SFX on `bus`, starting at AudioContext time `t0`. */
  audio?(this: Episode, bus: GainNode, t0: number): void;
}
