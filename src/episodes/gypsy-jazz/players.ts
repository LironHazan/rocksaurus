import { createRockerRory } from '../../characters/rocker';
import { idle, resetPose } from '../../characters/rory';
import { armOf } from '../../characters/reach';
import { createDrummer } from '../../band/drummer';
import { createBassist } from '../../band/bassist';
import { guitarHands } from '../../band/guitarist';
import { GYPSY_TONE, playedNotes, vibratoAt, type PlayedNote } from '../../audio/lead-guitar';
import { BEAT, FINAL_CHORD, HEAD, bass, drums, guitar } from './music';
import { barAt, mouthAt } from './timeline';
import { KIT_SPOT, RORY_SPOT, TIKI_SPOT } from '../../world/rehearsal-room';

// The trio, playing along to the notes they play (music.ts), so every pick and every shake lands on the sound.

/** A note keeps the fretting paw where it is this long after it ends (seconds). */
const HOLD_S = 0.3;
/** How quickly the picking paw's dip fades (per second): a heavy pick, but a fast one. */
const PICK = 22;
/** How much the vibrato shakes the fretting paw and his head (per unit of vibratoAt). */
const VIB_PAW = 0.6;
const VIB_HEAD = 0.2;
/** His head bobs on every beat, this far (radians); his foot taps 2 and 4, this high. */
const BOB = 0.07;
const TAP = 0.14;
/** Lulu and Tiki Taka stop playing a beat after the last chord lands; Rory notices them a moment later. */
const AFTER_S = BEAT;
const NOTICE_S = 0.6;

export function createRoryOnGypsy() {
  const rory = createRockerRory();
  rory.root.position.copy(RORY_SPOT.at);
  rory.root.rotation.y = RORY_SPOT.yaw;
  const lead = playedNotes(guitar);
  // his paws follow la pompe where there's no tune to play (the intro), and the tune everywhere else
  const pompe = guitar.chords.flatMap(([at, , len]) => {
    const start = at * guitar.unit;
    const strummed = start < barAt(HEAD) || start >= FINAL_CHORD - BEAT;
    return strummed ? [{ start, end: (at + len) * guitar.unit, midi: 60, touch: {} }] : [];
  });
  const hands = guitarHands(rory, [...lead, ...pompe], PICK);
  const neckPaw = armOf(rory, -1);
  const tapFoot = rory.feet.find(f => f.userData.side > 0)!;

  /** The left hand and the face on a held note: the vibrato shakes the paw, and his head a little with it. */
  function feel(note: PlayedNote | null, t: number) {
    const sounding = note && t <= note.end + HOLD_S ? note : null;
    const shake = sounding ? vibratoAt(sounding, t, GYPSY_TONE) : 0;
    neckPaw.rotation.z += shake * VIB_PAW;
    rory.head.rotation.z = 0.12 + shake * VIB_HEAD;
  }

  return {
    rig: rory,
    update(t: number) {
      resetPose(rory);
      const playing = t >= barAt(1) - BEAT && t < FINAL_CHORD + AFTER_S;
      idle(rory, t, { eyesOpen: playing ? 0.55 : 1 });
      const note = hands(t, playing);
      feel(note, t);
      const sinceBeat = (t / BEAT) % 1;
      rory.head.rotation.x = -0.05 + (playing ? (1 - sinceBeat) ** 3 * BOB : 0);
      const onTwoOrFour = Math.floor(t / BEAT) % 2 === 1;
      tapFoot.position.y = playing && onTwoOrFour ? (1 - sinceBeat) * TAP : 0;
      rory.tail.rotation.y = Math.sin((t * Math.PI) / BEAT) * 0.2;
      rory.setMouth(playing ? 0.15 : Math.max(0.1, mouthAt('Rory', t)));
      if (t >= FINAL_CHORD + NOTICE_S) rory.head.rotation.y = 0.5; // to the others
    },
  };
}

export function createLuluOnDrums() {
  const drummer = createDrummer(drums, {
    beat: BEAT,
    activity: t => (t < FINAL_CHORD + AFTER_S ? 'play' : 'idle'),
  });
  drummer.root.position.copy(KIT_SPOT.at);
  drummer.root.rotation.y = KIT_SPOT.yaw;
  return {
    root: drummer.root,
    rig: drummer.rig,
    update(t: number) {
      drummer.update(t);
      if (t >= FINAL_CHORD) drummer.rig.setMouth(Math.max(0, mouthAt('Lulu', t)));
    },
  };
}

export function createTikiOnBass() {
  const playing = (t: number) => t >= barAt(1) - BEAT && t < FINAL_CHORD + AFTER_S;
  const bassist = createBassist(bass, { beat: BEAT, activity: t => (playing(t) ? 'play' : 'idle') });
  bassist.root.position.copy(TIKI_SPOT.at);
  bassist.root.rotation.y = TIKI_SPOT.yaw;
  return {
    root: bassist.root,
    rig: bassist.rig,
    update(t: number) {
      bassist.update(t);
      bassist.rig.setMouth(Math.max(0, mouthAt('Tiki', t)));
    },
  };
}
