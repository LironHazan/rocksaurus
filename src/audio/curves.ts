/** A soft, symmetric tanh clip curve for a WaveShaperNode: `k` is how hard it drives (higher: more saturation),
 * `n` the curve's resolution. Normalised, so a full-scale input comes out at full scale. */
export function softClip(k: number, n = 1024): Float32Array {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return c;
}
