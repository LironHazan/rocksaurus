import { cueSheet, every, quieter, type Cue, type Player } from '../../audio/cue-sheet';
import { playSyllables } from '../../audio/babble';
import { boop, chatPop, thump } from '../../audio/sfx';
import { sing } from '../../audio/voice';
import * as fx from '../../audio/foley';
import { CUE, DURATION, SYLLABLES } from './timeline';

// Natural sound, no music: birds on the campus; in the meeting room, the room's hush, his keys, each post landing
// (and the laptops it pings), Dchozaurus's yelp and his chair, the bug's scuttle, the door, Ogozaurus's big steps,
// and Lulu's "huh?".

type Kind = 'bird' | 'key' | 'post' | 'ping' | 'sigh' | 'yelp' | 'chair' | 'scuttle' | 'door' | 'stomp' | 'huh';

/** Ogozaurus's steps in (one per walk-cycle step, seconds). */
const STEP = 0.4;

function cues(): Cue<Kind>[] {
  const out: Cue<Kind>[] = [
    ...[0.6, 1.7, 2.9, 3.6].map(at => ({ at, kind: 'bird' as const })),
    ...CUE.posts.flatMap(at => [
      { at, kind: 'post' as const },
      { at: at + 0.2, kind: 'ping' as const }, // a tag: "Hack" pings on their laptops
    ]),
    { at: CUE.tagged[0] + 0.3, kind: 'sigh' },
    { at: CUE.bug, kind: 'yelp' },
    { at: CUE.bug + 0.45, kind: 'chair' },
    { at: CUE.door, kind: 'door' },
    { at: CUE.confused[0] + 0.3, kind: 'huh' },
  ];
  // his keys, between the posts
  for (const at of every(CUE.room + 0.4, CUE.posts[4]!, 0.14)) out.push({ at, kind: 'key' });
  for (const at of every(CUE.bug + 0.6, CUE.floor[1], 0.5)) out.push({ at, kind: 'scuttle' });
  for (const at of every(CUE.door + 0.4, CUE.inside, STEP)) out.push({ at, kind: 'stomp' });
  return out;
}

const PLAYERS: Record<Kind, Player> = {
  bird: (b, w) => fx.bird(b, w, 0.95),
  key: (b, w) => fx.keyTap(quieter(b, 0.5), w),
  post: chatPop,
  ping: (b, w) => {
    boop(b, w, 988, 988, 0.07, 0.04); // a two-note chat ping
    boop(b, w + 0.09, 1319, 1319, 0.1, 0.04);
  },
  sigh: (b, w) => fx.sigh(b, w, 1.2),
  yelp: (b, w) => ['C5', 'E5', 'G5'].forEach((n, i) => sing(b, w + i * 0.07, n, 'a', 0.35, 0.12)),
  chair: thump,
  scuttle: (b, w) => {
    for (let i = 0; i < 6; i++) fx.tick(quieter(b, 0.6), w + i * 0.04);
  },
  door: (b, w) => {
    boop(b, w, 220, 330, 0.5, 0.05); // the hinge's creak
    fx.rattle(b, w + 0.1);
  },
  stomp: (b, w) => fx.stomp(b, w),
  huh: (b, w) => {
    sing(b, w, 'F3', 'u', 0.3, 0.2);
    sing(b, w + 0.22, 'C4', 'u', 0.3, 0.3); // rising: "huh?"
  },
};

export const SOUND = cueSheet({
  duration: DURATION,
  players: PLAYERS,
  cues: cues(),
  beds: [
    { from: 0, to: CUE.room, kind: 'fountain' },
    { from: CUE.room, to: DURATION, kind: 'room' },
  ],
});

export function soundtrack(bus: AudioNode, t0: number): void {
  SOUND.play(bus, t0);
  playSyllables(bus, t0, SYLLABLES);
}
