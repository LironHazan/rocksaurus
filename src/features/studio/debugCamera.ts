/** Debug camera from `?cam=x,y,z,lookX,lookY,lookZ` — overrides the episode camera for close-up checks. */
export type DebugCamera = [number, number, number, number, number, number];

/** x, y, z of the camera, then x, y, z of the point it looks at. */
const CAMERA_NUMBERS = 6;

const isDebugCamera = (nums: readonly number[]): nums is DebugCamera =>
  nums.length === CAMERA_NUMBERS && nums.every(Number.isFinite);

export function parseDebugCamera(value: string | null): DebugCamera | null {
  if (!value) return null;
  const nums = value.split(',').map(Number);
  return isDebugCamera(nums) ? nums : null;
}
