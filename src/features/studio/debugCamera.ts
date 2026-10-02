/** Debug camera from `?cam=x,y,z,lookX,lookY,lookZ` — overrides the episode camera for close-up checks. */
export type DebugCamera = [number, number, number, number, number, number];

export function parseDebugCamera(value: string | null): DebugCamera | null {
  if (!value) return null;
  const nums = value.split(',').map(Number);
  return nums.length === 6 && nums.every(Number.isFinite) ? (nums as DebugCamera) : null;
}
