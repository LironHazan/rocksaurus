import * as THREE from 'three';
import type { Episode } from '../../engine/types';
import { cuts, direct, inFrontOf, overShoulder, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { linesAt } from '../../world/screen-script';
import { createOffice } from '../../world/lulu-office';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createAskers, createLuluAtDesk, createYashiAtDesk } from './cast';
import { createArchitectCorner, createSign } from './sets';
import { SOUND } from './sound';
import { playSyllables } from '../../audio/babble';
import { LULU_SCRIPT, YASHI_SCRIPT } from './terminal';
import { ASKERS, CUE, CUTS, DURATION, LINES, SYLLABLES } from './timeline';

// Beat sheet (video seconds; timeline.ts has the cues and lines)
//   0–3.4      Lulu at her desk, typing to her agent
//   3.4–25     Rorit, Silvi and Omli, one after another, the same question: "what's an AI agent?" By the third, a sign
//   25–30      finally: focus mode
//   30–36      meanwhile, Yashinozarus: npm audit, critical, "Hm. Critical. Again"
//   36–40.6    his message lands on Lulu's screen: upgrade Node.js, no fixes for deprecated versions
//   40.6–46.4  she's on the latest since three weeks ago: one patch, 1,284 tests green, all environments patched
//   46.4–50    her reply on his screen. "Impressive"
//   50–56      Rorit is back: "Sorry, one more: what's an AGENT?" Her head goes down on the desk
//   then the channel's end card (outro.ts)

/** The screen shows its last lines: as many as fit. */
const SCREEN_LINES = 8;
/** How far the close-ups stand off. */
const CLOSE = { lulu: 5.6, asker: 5.0, big: 7.0, yashi: 4.4 } as const;
/** The sign's place on her monitor: taped to its back, facing whoever comes to her desk (in the monitor's space). */
const SIGN_ON_MONITOR = [0, -0.5, -0.13] as const;

const episode: Episode = {
  id: 'node-cve',
  title: 'Another Day, Another Node.js CVE 🚨',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const office = createOffice();
    const corner = createArchitectCorner();
    const lulu = createLuluAtDesk();
    const askers = createAskers();
    const yashi = createYashiAtDesk();
    office.scene.add(lulu.rig.root, ...Object.values(askers.rigs).map(r => r.root));
    corner.scene.add(yashi.rig.root);
    const sign = createSign();
    sign.position.set(...SIGN_ON_MONITOR);
    sign.rotation.y = Math.PI; // facing out the back
    office.monitor.add(sign);
    const screenNormal = new THREE.Vector3();
    const screenAt = (m: THREE.Object3D) => m.getWorldPosition(new THREE.Vector3());
    const normalOf = (m: THREE.Object3D) => screenNormal.set(0, 0, 1).applyQuaternion(m.quaternion);

    type LuluShot = 'wide' | 'asker' | 'lulu' | 'screen' | 'sign';
    const luluShotAt = cuts<LuluShot>([
      [0, 'wide'],
      [LINES[0]!.from, 'asker'],
      [LINES[1]!.from, 'lulu'],
      [ASKERS[0].leave[0], 'wide'],
      [LINES[2]!.from, 'asker'],
      [LINES[3]!.from, 'lulu'],
      [CUE.sign - 0.4, 'sign'],
      [ASKERS[2].walk[0], 'wide'],
      [LINES[4]!.from, 'asker'],
      [LINES[5]!.from, 'lulu'],
      [ASKERS[2].leave[0], 'wide'],
      [CUE.focus[0], 'screen'],
      [CUE.focus[0] + 2.6, 'lulu'],
      [CUE.ping, 'screen'],
      [CUE.ping + 2.2, 'lulu'],
      [CUE.patch[0], 'screen'],
      [CUE.patch[0] + 4.0, 'lulu'],
      [ASKERS[3].walk[0], 'wide'],
      [LINES[8]!.from, 'asker'],
      [LINES[8]!.to, 'lulu'],
    ]);
    const LULU_SHOTS: Record<LuluShot, (t: number) => Shot> = {
      wide: t => {
        const c = ease(seg(t, 0, ASKERS[0].walk[0]));
        // from her left, so her monitor is side-on and whoever walks up to her desk is in the shot
        return { cam: [lerp(-4.2, -3.4, c), 5.0, lerp(12.5, 11, c)], look: [1.6, 3.2, 0.6] };
      },
      asker: t => {
        const a = askers.at(t) ?? ASKERS[0];
        const rig = askers.rigs[a.who];
        return inFrontOf(rig.head, rig.root, a.who === 'Omli' ? CLOSE.big : CLOSE.asker, 0.4, 0.1); // from her far side, clear of her head
      },
      lulu: () => inFrontOf(lulu.rig.head, lulu.rig.root, CLOSE.lulu, -0.5, -0.2), // from her left: her monitor is on her right
      // close and from the side: her head is right in front of it
      screen: () => overShoulder(screenAt(office.monitor), normalOf(office.monitor), 1.85, -0.45, -0.55),
      sign: () =>
        overShoulder(sign.getWorldPosition(new THREE.Vector3()), normalOf(office.monitor).negate(), 1.8, 0, 0.1),
    };

    type YashiShot = 'desk' | 'screen' | 'face';
    const yashiShotAt = cuts<YashiShot>([
      [0, 'desk'],
      [CUE.yashi[0] + 1.4, 'screen'],
      [LINES[6]!.from, 'face'],
      [CUE.reply[0], 'screen'],
      [LINES[7]!.from, 'face'],
    ]);
    const YASHI_SHOTS: Record<YashiShot, (t: number) => Shot> = {
      desk: t => {
        const c = ease(seg(t, CUE.yashi[0], CUE.yashi[0] + 1.4));
        return { cam: [lerp(3.6, 2.8, c), 3.4, lerp(8.6, 7.4, c)], look: [-0.2, 2.4, 0.6] };
      },
      screen: () => overShoulder(screenAt(corner.monitor), normalOf(corner.monitor), 1.4, -0.3, 0.6), // past his head
      face: () => inFrontOf(yashi.rig.head, yashi.rig.root, CLOSE.yashi, 0.2, 0.1),
    };

    return direct(
      stage,
      {
        lulu: {
          scene: office.scene,
          frame(t) {
            sign.visible = t >= CUE.sign;
            office.clock.set(10, 40 + t / 2);
            askers.update(t);
            lulu.update(t, sign, askers.at(t) !== null);
            office.screen.show(linesAt(LULU_SCRIPT, t).slice(-SCREEN_LINES), true);
            office.scene.updateMatrixWorld(true);
            return LULU_SHOTS[luluShotAt(t)](t);
          },
        },
        yashi: {
          scene: corner.scene,
          frame(t) {
            yashi.update(t);
            corner.screen.show(linesAt(YASHI_SCRIPT, t).slice(-SCREEN_LINES), true);
            corner.scene.updateMatrixWorld(true);
            return YASHI_SHOTS[yashiShotAt(t)](t);
          },
        },
      },
      cuts(CUTS),
    );
  },

  audio(bus, t0) {
    SOUND.play(bus, t0);
    playSyllables(bus, t0, SYLLABLES);
  },
};

export default withOutro(episode);
