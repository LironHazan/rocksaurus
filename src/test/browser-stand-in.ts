/**
 * jsdom has no Web Audio and no 2D canvas, but importing the audio code builds the audio graph, and sets paint canvas
 * textures. In tests every such object is this stand-in: each property, call and `new` returns the stand-in again, and
 * it reads as 0 in arithmetic. Tests check the logic around these objects, never their output.
 */
const handler: ProxyHandler<() => void> = {
  get: (_target, key) => (key === Symbol.toPrimitive ? () => 0 : key === 'then' ? undefined : browserStandIn),
  apply: () => browserStandIn,
  construct: () => browserStandIn,
  set: () => true,
};

// SAFETY: the Proxy answers every property, call and construction with itself, so it fits whatever type it replaces.
// (A plain function, not an arrow: only a constructible target lets the Proxy answer `new`.)
export const browserStandIn = new Proxy(function standIn() {}, handler) as never;

/** The Web Audio classes the audio code constructs (directly, or through `new AudioContext()`). */
const WEB_AUDIO = [
  'AudioContext',
  'AudioBufferSourceNode',
  'BiquadFilterNode',
  'ConvolverNode',
  'DelayNode',
  'DynamicsCompressorNode',
  'GainNode',
  'OscillatorNode',
  'StereoPannerNode',
  'WaveShaperNode',
];

export function installBrowserStandIns(): void {
  for (const name of WEB_AUDIO) vi.stubGlobal(name, browserStandIn);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(browserStandIn);
  Object.defineProperty(document, 'fonts', { value: { load: () => Promise.resolve([]) }, configurable: true });
}
