import type { Episode } from '../../engine/types';
import { cuts, direct, inFrontOf, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { GYPSY_TONE, playLeadGuitar } from '../../audio/lead-guitar';
import { playDrums } from '../../audio/drums';
import { playBass } from '../../audio/bass';
import { playSyllables } from '../../audio/babble';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { FINAL_CHORD, HEAD, bass, drums, guitar } from './music';
import { createLuluOnDrums, createRoryOnGypsy, createTikiOnBass } from './players';
import { createRehearsalRoom } from '../../world/rehearsal-room';
import { SOUND } from './sound';
import { DURATION, LINES, SYLLABLES, barAt, headBar, outBar, soloBar } from './timeline';

// Beat sheet (video seconds; music.ts has the song, timeline.ts the bars)
//   0–1.4      the rehearsal room, after the blues; Lulu counts it in on her sticks
//   1.4–6.8    la pompe: Rory alone on the rhythm, Tiki Taka in two, Lulu's hat and feathered kick
//   6.8–28.6   the head: 16 bars, the A and the bridge (C6 → Cm6), a fill into…
//   28.6–50.4  …the solo: swept arpeggios, the diminished run, octaves, tremolo, the chromatic run; Tiki walks
//   50.4–61.4  the head out, and the ending: up the G6/9, A♭9 → G6/9, ringing
//   then three lines, and the channel's end card (outro.ts)

/** How far the close-ups stand off (scene units), in front of what they frame. */
const CLOSE = { neck: 4.4, face: 4.6, lulu: 6.4, tiki: 6.6, kit: 7.2 } as const;

const episode: Episode = {
  id: 'gypsy-jazz',
  title: 'Gypsy Jazz in G 🎸',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const room = createRehearsalRoom();
    const rory = createRoryOnGypsy();
    const lulu = createLuluOnDrums();
    const tiki = createTikiOnBass();
    room.scene.add(rory.rig.root, lulu.root, tiki.root);

    type Framing = 'room' | 'neck' | 'pick' | 'face' | 'three' | 'side' | 'lulu' | 'tiki' | 'kit';
    const framingAt = cuts<Framing>([
      [0, 'room'], // the room, the count-in, la pompe starting
      [barAt(3), 'neck'], // la pompe, up close
      [barAt(HEAD), 'three'], // the head
      [headBar(3), 'face'],
      [headBar(6), 'neck'], // the diminished run
      [headBar(9), 'tiki'], // the bridge
      [headBar(11), 'face'], // C6 → Cm6
      [headBar(13), 'lulu'],
      [headBar(16), 'kit'], // her fill into the solo
      [soloBar(1), 'pick'], // the sweep
      [soloBar(3), 'tiki'], // walking
      [soloBar(5), 'neck'], // octaves
      [soloBar(7), 'face'],
      [soloBar(9), 'neck'], // tremolo
      [soloBar(11), 'lulu'],
      [soloBar(13), 'neck'], // the chromatic run
      [soloBar(15), 'three'],
      [outBar(1), 'side'], // the head out, from the side
      [outBar(4), 'face'],
      [outBar(6), 'lulu'],
      [outBar(8), 'neck'], // the run up into the last chord
      [FINAL_CHORD, 'three'],
      [LINES[0]!.from, 'face'],
      [LINES[1]!.from, 'lulu'],
      [LINES[2]!.from, 'tiki'],
    ]);
    const FRAMINGS: Record<Framing, (t: number) => Shot> = {
      room: t => {
        // from the door, pushing in on the three of them
        const c = ease(seg(t, 0, barAt(3)));
        return { cam: [lerp(3.6, 1.0, c), lerp(5.4, 4.4, c), lerp(14.5, 11.5, c)], look: [0.2, 2.5, -0.5] };
      },
      neck: () => inFrontOf(rory.rig.guitar, rory.rig.root, CLOSE.neck, -0.45, 0.6), // both paws on the guitar
      pick: () => inFrontOf(rory.rig.guitar, rory.rig.root, CLOSE.neck, 0.35, 0.2),
      face: () => inFrontOf(rory.rig.head, rory.rig.root, CLOSE.face, 0.35, 0.25),
      three: t => {
        const c = ease(seg(t, barAt(HEAD), headBar(3)));
        return { cam: [0.6, lerp(5.2, 4.8, c), lerp(14.5, 13, c)], look: [0.5, 2.6, -0.8] };
      },
      side: t => {
        // low from the left, past Rory's shoulder to the other two, drifting round
        const c = seg(t, outBar(1), outBar(4));
        return { cam: [lerp(-7.2, -6.2, c), 3.2, lerp(6.4, 7.6, c)], look: [0.8, 2.6, -0.8] };
      },
      lulu: () => inFrontOf(lulu.rig.neck[1]!, lulu.root, CLOSE.lulu, 0.25, 0.4),
      tiki: () => inFrontOf(tiki.rig.head, tiki.root, CLOSE.tiki, 0.25, -0.5),
      kit: () => inFrontOf(lulu.rig.head, lulu.root, CLOSE.kit, -0.25, -0.4),
    };

    return direct(
      stage,
      {
        room: {
          scene: room.scene,
          frame(t) {
            rory.update(t);
            lulu.update(t);
            tiki.update(t);
            room.scene.updateMatrixWorld(true);
            return FRAMINGS[framingAt(t)](t);
          },
        },
      },
      cuts([[0, 'room']]),
    );
  },

  audio(bus, t0) {
    playLeadGuitar(bus, t0, guitar, GYPSY_TONE);
    playDrums(bus, t0, drums, { smooth: true });
    playBass(bus, t0, bass, 'upright');
    SOUND.play(bus, t0);
    playSyllables(bus, t0, SYLLABLES);
  },
};

export default withOutro(episode);
