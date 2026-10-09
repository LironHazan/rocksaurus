/** Debug camera from `?cam=x,y,z,lookX,lookY,lookZ` — overrides the episode camera for close-up checks. */
export type DebugCamera = [number, number, number, number, number, number];

const isDebugCamera = (nums: readonly number[]): nums is DebugCamera =>
  nums.length === 6 && nums.every(Number.isFinite);

export function parseDebugCamera(value: string | null): DebugCamera | null {
  if (!value) return null;
  const nums = value.split(',').map(Number);
  return isDebugCamera(nums) ? nums : null;
}
