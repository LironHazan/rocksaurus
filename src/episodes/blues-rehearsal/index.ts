import * as THREE from 'three';
import type { Episode } from '../../engine/types';
import { cuts, direct, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { playBluesGuitar } from '../../audio/blues-guitar';
import { playDrums } from '../../audio/drums';
import { playBass } from '../../audio/bass';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { bass, drums, guitar } from './music';
import { createLuluOnDrums, createRoryOnBlues, createTikiOnBass } from './players';
import { createRehearsalRoom } from './sets';
import { soundtrack } from './sound';
import { CUE, DURATION, LINES, barAt, chorusBar, secondBar } from './timeline';

// Beat sheet (video seconds; music.ts has the song, timeline.ts the cues)
//   0–13.7     Rory alone, eyes closed: four bars of slow blues in A. Bends, vibrato, space
//   ~7–12.9    Lulu comes in behind him, tiptoes to the kit, sits, sticks up
//   12.9       the pickup: a snare triplet on the last beat, and she's in
//   13.7–54.9  the first 12-bar chorus together: a slow 12/8 shuffle under his lead; she fills into bar 12
//   ~41–53     Tiki Taka slips in along the back wall, bass on, and takes his spot
//   54.9–96    the second chorus: Tiki walks the bass, Lulu opens up the shuffle, Rory climbs to bar 9's climax
//   96         B♭9 → A9, ringing. He opens his eyes: "…How long have you two been there?" "Since bar four." "I
//              caught the turnaround."
//   then the channel's end card (outro.ts)

/** How far the close-ups stand off (scene units), in front of what they frame. */
const CLOSE = { neck: 4.6, face: 4.6, lulu: 6.4, tiki: 6.8 } as const;

const episode: Episode = {
  id: 'blues-rehearsal',
  title: 'Slow Blues in A 🎸',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const room = createRehearsalRoom();
    const rory = createRoryOnBlues();
    const lulu = createLuluOnDrums();
    const tiki = createTikiOnBass();
    room.scene.add(rory.rig.root, lulu.root, tiki.root);
    const at = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());

    /** In front of whatever `o` is, the way `root` faces, `dist` back, a little to the side and above. */
    function inFrontOf(o: THREE.Object3D, root: THREE.Object3D, dist: number, side = 0.4, rise = 0.2): Shot {
      const p = at(o);
      const yaw = root.rotation.y + side;
      return { cam: [p.x + Math.sin(yaw) * dist, p.y + rise, p.z + Math.cos(yaw) * dist], look: [p.x, p.y, p.z] };
    }

    type Framing = 'wide' | 'neck' | 'face' | 'pick' | 'sneak' | 'two' | 'lulu' | 'kit' | 'tikiIn' | 'three' | 'tiki';
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
      [chorusBar(9), 'tikiIn'], // the V, and behind them, Tiki Taka slipping in
      [chorusBar(11), 'face'], // the turnaround lick
      [chorusBar(12), 'kit'], // her fill
      [secondBar(1), 'three'], // the second chorus: a band
      [secondBar(3), 'tiki'],
      [secondBar(5), 'face'], // the big bend
      [secondBar(6), 'neck'],
      [secondBar(7), 'lulu'],
      [secondBar(8), 'pick'], // the run up
      [secondBar(9), 'face'], // the climax
      [secondBar(10), 'tiki'],
      [secondBar(11), 'neck'], // the turnaround
      [secondBar(12), 'kit'],
      [CUE.final, 'three'],
      [LINES[0]!.from, 'face'],
      [LINES[1]!.from, 'lulu'],
      [LINES[2]!.from, 'tiki'],
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
      lulu: () => inFrontOf(lulu.rig.neck[1]!, lulu.root, CLOSE.lulu, 0.25, 0.4), // her face, paws and sticks on the kit
      tikiIn: t => {
        const c = seg(t, chorusBar(9), CUE.tiki[1]);
        // following him along the back wall, behind Rory, to his spot
        return {
          cam: [lerp(-4.6, -1.2, c), 4.6, lerp(9.5, 11.5, c)],
          look: [lerp(-6.2, 0.2, c), 2.8, lerp(-2.6, -1.6, c)],
        };
      },
      three: t => {
        const c = ease(seg(t, secondBar(1), secondBar(3)));
        return { cam: [0.4, lerp(5.0, 4.6, c), lerp(14, 12.8, c)], look: [0.3, 2.6, -0.6] };
      },
      tiki: () => inFrontOf(tiki.rig.head, tiki.root, CLOSE.tiki, 0.25, -0.5), // his face, and the bass
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
            tiki.update(t);
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
    playBass(bus, t0, bass);
    soundtrack(bus, t0);
  },
};

export default withOutro(episode);
