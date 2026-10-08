import { mouthOf, speakerOf, syllables, type SpokenLine, type Voice } from '../../audio/babble';
import type { ScriptLine } from '../../world/screen-script';

// 3 AM: the production certificates have expired ("Invalid Date"). Sagish is on call; he calls Rorit, the mighty
// DinOps manager, who calls in the seniors, Taluzarus and Amazaurus. By morning prod is back; then Eilon, the tech
// lead, walks in smiling: "Was something wrong?" Times are video seconds. No music: natural sound.

export const DURATION = 55; // then the end card, see ../outro.ts

export const CUE = {
  campus: [0, 3.5], // the campus at night
  bedroom: [3.5, 9.5], // Sagish asleep; the pager
  alert: 4.6,
  sitUp: 5.4,
  laptop: [9.5, 15.5], // the terminal
  callRorit: [15.5, 22.0], // Sagish calls Rorit
  roritAnswers: 18.0, // cut to Rorit, the phone ringing
  callSeniors: [22.0, 26.0], // Rorit calls the seniors
  taluzarus: 22.0,
  amazaurus: 24.0,
  warRoom: [26.0, 41.0], // the war room
  fixed: 38.4, // prod is back
  timelapse: [41.0, 44.0], // the sun comes up; they fall asleep
  morning: [44.0, 55.0],
  eilon: 44.2, // walks in
  ask: 48.2, // "Morning! Was something wrong?"
} as const;

export const CAST = ['Sagish', 'Rorit', 'Taluzarus', 'Amazaurus', 'Eilon'] as const;
export type Who = (typeof CAST)[number];

/** Who says what (the captions show it; the voices babble it). */
export const LINES: readonly SpokenLine<Who>[] = [
  { from: 15.8, to: 17.8, who: 'Sagish', text: 'Prod is down! The certs expired!' },
  { from: 18.9, to: 20.4, who: 'Rorit', text: 'On it.' },
  { from: 20.5, to: 21.8, who: 'Sagish', text: 'Sorry it’s 3 AM 😭' },
  { from: 22.2, to: 23.6, who: 'Taluzarus', text: 'OMW!!! ⚡' },
  { from: 24.3, to: 25.7, who: 'Amazaurus', text: 'Mm. Okay.' },
  { from: 34.0, to: 38.0, who: 'Amazaurus', text: 'Relax. It’s just a date.' },
  { from: 48.2, to: 51.0, who: 'Eilon', text: 'Morning! Was something wrong?' },
  { from: 52.2, to: 54.6, who: 'Amazaurus', text: 'Nope. All good.' },
];

/** Voices, low to high: Amazaurus slow and low, Eilon cheerful, Sagish young, Taluzarus fast. */
export const VOICES: Record<Who, Voice> = {
  Amazaurus: { notes: ['D3', 'E3', 'F3', 'G3'], rate: 0.22 },
  Eilon: { notes: ['C4', 'E4', 'G4', 'A4'], rate: 0.14 },
  Sagish: { notes: ['G3', 'A3', 'C4', 'D4'], rate: 0.11 },
  Rorit: { notes: ['F4', 'G4', 'A4', 'C5'], rate: 0.12 },
  Taluzarus: { notes: ['A3', 'C4', 'D4', 'E4'], rate: 0.08 },
};

export const SYLLABLES = syllables(LINES, VOICES, 41);
export const mouthAt = (who: Who, t: number) => mouthOf(SYLLABLES, who, t);
export const speakerAt = (t: number): Who | null => speakerOf(LINES, t);

/** Sagish's laptop at 3 AM. */
export const LAPTOP_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'sagish@oncall ~ 03:02 $', kind: 'title' },
  { at: 10.0, text: '$ curl https://api.papopako.io', kind: 'prompt', cps: 24 },
  { at: 11.3, text: 'SSL: certificate has expired', kind: 'err' },
  { at: 12.1, text: '$ openssl x509 -enddate -noout', kind: 'prompt', cps: 26 },
  { at: 13.3, text: 'notAfter=Invalid Date', kind: 'err' },
  { at: 14.1, text: '😱😱😱', kind: 'err' },
];

/** The status wall in the war room: red all night, then green. */
export const STATUS_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'PROD · STATUS', kind: 'title' },
  { at: 0, text: '✖ api          TLS EXPIRED', kind: 'err' },
  { at: 0, text: '✖ checkout     TLS EXPIRED', kind: 'err' },
  { at: 0, text: '✖ login        TLS EXPIRED', kind: 'err' },
];
export const STATUS_FIXED: readonly ScriptLine[] = [
  { at: 0, text: 'PROD · STATUS', kind: 'title' },
  { at: 0, text: '✔ api          healthy', kind: 'ok' },
  { at: 0, text: '✔ checkout     healthy', kind: 'ok' },
  { at: 0, text: '✔ login        healthy', kind: 'ok' },
  { at: 0, text: '  certs valid until 2027 🎉', kind: 'dim' },
];

/** Amazaurus's terminal in the war room. */
export const FIX_SCRIPT: readonly ScriptLine[] = [
  { at: 0, text: 'amazaurus@warroom ~ $', kind: 'title' },
  { at: 28.5, text: '$ dinops certs status --env prod', kind: 'prompt', cps: 14 },
  { at: 31.2, text: '  expired: 3   valid: 0', kind: 'err' },
  { at: 32.0, text: '$ dinops certs renew --all', kind: 'prompt', cps: 14 },
  { at: 34.5, text: '  renewing… ▓▓▓▓▓▓▓▓▓▓', kind: 'agent' },
  { at: 36.6, text: '$ dinops deploy --env prod', kind: 'prompt', cps: 14 },
  { at: 38.4, text: '✔ prod: healthy', kind: 'ok' },
];

/** The wall clock: 3:21 in the war room, 5:40 when it's fixed, 8:58 when Eilon walks in. */
export function clockAt(t: number): [number, number] {
  const k = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const minutes =
    t < CUE.timelapse[0]
      ? 3 * 60 + 21 + k(CUE.warRoom[0], CUE.timelapse[0]) * (2 * 60 + 19)
      : 5 * 60 + 40 + k(CUE.timelapse[0], CUE.timelapse[1]) * (3 * 60 + 18);
  return [Math.floor(minutes / 60), Math.floor(minutes % 60)];
}
