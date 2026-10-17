import * as THREE from 'three';
import type { Episode } from '../../engine/types';
import { cuts, direct, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { playBluesGuitar } from '../../audio/blues-guitar';
import { playDrums } from '../../audio/drums';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { drums, guitar } from './music';
import { createLuluOnDrums, createRoryOnBlues } from './players';
import { createRehearsalRoom } from './sets';
import { soundtrack } from './sound';
import { CUE, DURATION, LINES, barAt, chorusBar } from './timeline';

// Beat sheet (video seconds; music.ts has the song, timeline.ts the cues)
//   0–13.7     Rory alone, eyes closed: four bars of slow blues in A. Bends, vibrato, space
//   ~7–12.9    Lulu comes in behind him, tiptoes to the kit, sits, sticks up
//   12.9       the pickup: a snare triplet on the last beat, and she's in
//   13.7–54.9  one 12-bar chorus together: a slow 12/8 shuffle under his lead; she fills into bar 12
//   54.9       B♭9 → A9, ringing. He opens his eyes: "…How long have you been there?" "Since bar four."
//   then the channel's end card (outro.ts)

/** How far the close-ups stand off (scene units), in front of what they frame. */
const CLOSE = { neck: 4.6, face: 4.6, lulu: 4.8 } as const;

const episode: Episode = {
  id: 'blues-rehearsal',
  title: 'Slow Blues in A 🎸',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const room = createRehearsalRoom();
    const rory = createRoryOnBlues();
    const lulu = createLuluOnDrums();
    room.scene.add(rory.rig.root, lulu.root);
    const at = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());

    /** In front of whatever `o` is, the way `root` faces, `dist` back, a little to the side and above. */
    function inFrontOf(o: THREE.Object3D, root: THREE.Object3D, dist: number, side = 0.4, rise = 0.2): Shot {
      const p = at(o);
      const yaw = root.rotation.y + side;
      return { cam: [p.x + Math.sin(yaw) * dist, p.y + rise, p.z + Math.cos(yaw) * dist], look: [p.x, p.y, p.z] };
    }

    type Framing = 'wide' | 'neck' | 'face' | 'pick' | 'sneak' | 'two' | 'lulu' | 'low' | 'kit';
    const framingAt = cuts<Framing>([
      [0, 'wide'],
      [barAt(1), 'neck'], // the first bend, B to C♯, up close
      [barAt(2), 'face'], // the Albert bend: his face
      [CUE.sneak[0], 'sneak'], // behind him, Lulu sneaks in
      [chorusBar(1), 'two'], // and they're playing
      [chorusBar(3), 'lulu'],
      [chorusBar(5), 'face'], // bar 5: Albert again
      [chorusBar(6), 'neck'],
      [chorusBar(7), 'pick'],
      [chorusBar(9), 'low'], // the V
      [chorusBar(10), 'lulu'],
      [chorusBar(11), 'face'], // the turnaround lick
      [chorusBar(12), 'kit'], // her fill
      [CUE.final, 'two'],
      [LINES[0]!.from, 'face'],
      [LINES[1]!.from, 'lulu'],
    ]);
    const FRAMINGS: Record<Framing, (t: number) => Shot> = {
      wide: t => {
        const c = ease(seg(t, 0, barAt(1)));
        return { cam: [lerp(2.6, 1.0, c), lerp(4.8, 4.0, c), lerp(13, 10.5, c)], look: [-0.4, 2.4, -0.4] };
      },
      neck: () => inFrontOf(rory.rig.guitar, rory.rig.root, CLOSE.neck, -0.45, 0.6), // the guitar: both paws, the bend
      pick: () => inFrontOf(rory.rig.guitar, rory.rig.root, CLOSE.neck, 0.3, 0.2), // the guitar, from his other side
      face: () => inFrontOf(rory.rig.head, rory.rig.root, CLOSE.face, 0.35, 0.25),
      sneak: t => {
        const c = ease(seg(t, CUE.sneak[0], chorusBar(1)));
        return { cam: [lerp(-4.2, -3.4, c), 4.2, lerp(10.5, 9.5, c)], look: [lerp(2.4, 2.0, c), 2.3, 0.2] };
      },
      two: t => {
        const c = ease(seg(t, chorusBar(1), chorusBar(3)));
        return { cam: [0.6, lerp(4.6, 4.2, c), lerp(12.5, 11.5, c)], look: [0.3, 2.5, -0.3] };
      },
      lulu: () => inFrontOf(lulu.rig.head, lulu.root, CLOSE.lulu, 0.2, 0.3),
      low: () => ({ cam: [0.4, 1.3, 8.4], look: [0.2, 3.0, -1] }),
      kit: () => inFrontOf(lulu.rig.head, lulu.root, 7.2, -0.25, -0.4), // her and the whole kit, for the fill
    };

    const scene = direct(
      stage,
      {
        room: {
          scene: room.scene,
          frame(t) {
            rory.update(t);
            lulu.update(t);
            room.scene.updateMatrixWorld(true);
            return FRAMINGS[framingAt(t)](t);
          },
        },
      },
      cuts([[0, 'room']]),
    );
    return scene;
  },

  audio(bus, t0) {
    playBluesGuitar(bus, t0, guitar);
    playDrums(bus, t0, drums, { smooth: true });
    soundtrack(bus, t0);
  },
};

export default withOutro(episode);
