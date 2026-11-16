import * as THREE from 'three';
import type { Episode } from '../../engine/types';
import { cuts, direct, inFrontOf, overShoulder, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { playSyllables } from '../../audio/babble';
import { phonePov } from '../../props/phone';
import { cornerShots, createArchitectCorner, createYashiAtDesk } from '../../world/architect-corner';
import { keystrokes, linesAt } from '../../world/screen-script';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createFloorCast } from './cast';
import { SPOTS, createDevopsFloor } from './sets';
import { SOUND } from './sound';
import { CHAT, CUE, CUTS, DURATION, LINES, SYLLABLES, YASHI_SCRIPT, calendarAt, mouthAt, speaking } from './timeline';

// Beat sheet (video seconds; timeline.ts has the cues, the chat and the lines)
//   0–3.6      the DevOps floor, 9 AM: Rorit, Amazaurus, Eilon and Eter at their desk, together
//   3.6–8.6    an email from Chuks lands on Rorit's monitor: Narnia compliance, a new domain name for everything
//   8.6–10     "Narnia?!": her phone comes out. From here on, all four are stressed
//   10–20.6    the DevOps group chat: 200 microservices, 200 certs; the domain's hardcoded everywhere; Eter leads
//   20.6–28.6  Yashinozarus: upper management approves the name in 24 hours. The easy part. grep: 4,812
//   28.6–33    Eter at her desk: the plan, the name ticked off, the certs and the hardcoded domains not
//   33–45      the grind: all four typing flat out, Rorit's terminal, "Who hardcoded the domain 4,812 times?!", the
//              calendar flying through months
//   45–56      Lulu walks over. "When will we be Narnia compliant?" "Year 20666. No worries." The calendar agrees
//   then the channel's end card (outro.ts)

/** The screen shows its last lines: as many as fit. */
const SCREEN_LINES = 8;
/** How far the close-ups stand off. */
const CLOSE = { face: 4.4, lulu: 5.6 } as const;
/** Minutes the wall clock races through in the grind: three days, round and round. */
const GRIND_MINUTES = 3 * 24 * 60;

const landed = (i: number) => CHAT[i]!.at;

const episode: Episode = {
  id: 'narnia-domain',
  title: 'Narnia Compliance 🦁',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const floor = createDevopsFloor();
    const cast = createFloorCast();
    floor.scene.add(...Object.values(cast.rigs).map(r => r.root), ...Object.values(cast.phones).map(p => p.group));
    floor.scene.add(cast.lulu.root);
    // Rorit's monitor turns to her face
    cast.update(0);
    floor.scene.updateMatrixWorld(true);
    const roritHead = cast.rigs.Rorit.head.getWorldPosition(new THREE.Vector3());
    floor.monitor.lookAt(roritHead.x, floor.monitor.position.y, roritHead.z); // turned to her, upright

    const corner = createArchitectCorner();
    const yashi = createYashiAtDesk(
      keystrokes(YASHI_SCRIPT),
      t => mouthAt('Yashinozarus', t),
      t => speaking('Yashinozarus', t),
    );
    corner.scene.add(yashi.rig.root);

    const at = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
    const normalOf = (o: THREE.Object3D) => new THREE.Vector3(0, 0, 1).applyQuaternion(o.quaternion);
    const face = (rig: { head: THREE.Object3D; root: THREE.Object3D }, side = 0.3) =>
      inFrontOf(rig.head, rig.root, CLOSE.face, side, 0.2);

    type FloorShot =
      | 'wide'
      | 'monitor'
      | 'rorit'
      | 'pov'
      | 'amazaurus'
      | 'eilon'
      | 'eter'
      | 'desk'
      | 'plan'
      | 'calendar'
      | 'arrive'
      | 'lulu'
      | 'two';
    const floorShotAt = cuts<FloorShot>([
      [0, 'wide'],
      [CUE.mail, 'monitor'],
      [CUE.gasp, 'rorit'],
      [CUE.chat[0], 'pov'],
      [landed(1) + 0.2, 'amazaurus'],
      [landed(2) + 0.2, 'eilon'],
      [landed(3) - 0.4, 'pov'], // her "you lead it"
      [landed(3) + 0.8, 'eter'],
      [landed(4) + 0.2, 'pov'], // her answer
      [CUE.board[0], 'desk'],
      [LINES[2]!.from, 'eter'],
      [LINES[2]!.to, 'plan'], // what's left on it
      [CUE.grind[0], 'wide'], // all four of them, flat out
      [CUE.grind[0] + 1.6, 'monitor'], // 4,812 hardcoded domains
      [LINES[3]!.from, 'rorit'],
      [LINES[3]!.to + 0.2, 'amazaurus'],
      [LINES[3]!.to + 1.6, 'eilon'],
      [LINES[3]!.to + 3.0, 'calendar'], // months go by
      [CUE.lulu[0], 'arrive'],
      [LINES[4]!.from, 'eter'],
      [LINES[5]!.from, 'lulu'],
      [CUE.year, 'calendar'],
      [CUE.year + 1.0, 'two'],
    ]);
    const FLOOR_SHOTS: Record<FloorShot, (t: number) => Shot> = {
      wide: t => {
        // the four of them at their desk, together; easing in
        const c = ease(seg(t, 0, CUE.mail));
        return { cam: [0, lerp(6.4, 5.6, c), lerp(19, 16.5, c)], look: [0, 3, 0] };
      },
      monitor: () => overShoulder(at(floor.monitor), normalOf(floor.monitor), 2.0, -0.2, 0.55),
      rorit: () => face(cast.rigs.Rorit, 0.5), // from her left: her monitor is on her right
      pov: () => phonePov(cast.phones.Rorit, stage.camera),
      amazaurus: () => inFrontOf(cast.rigs.Amazaurus.head, cast.rigs.Amazaurus.root, CLOSE.face, 0.1, 0.7), // over the desk: he's short
      eilon: () => face(cast.rigs.Eilon),
      eter: () => face(cast.rigs.Eter, 0.35),
      // Eter at her desk, the plan on the wall behind her, the calendar beside her
      desk: () => ({ cam: [SPOTS.Eter.x + 2.2, 5.2, 11], look: [SPOTS.Eter.x, 4.4, -1] }),
      plan: () => ({ cam: [SPOTS.Eter.x - 1.0, 6.6, 3.6], look: [SPOTS.Eter.x, 6.0, -4] }),
      calendar: () => {
        const p = floor.calendar.localToWorld(new THREE.Vector3(0, 0.3, 0));
        return { cam: [p.x + 0.4, p.y + 0.6, p.z + 2.2], look: [p.x, p.y, p.z] };
      },
      arrive: () => ({ cam: [4.2, 5.2, 15], look: [5.4, 3, 0.8] }),
      lulu: () => inFrontOf(cast.lulu.head, cast.lulu.root, CLOSE.lulu, 0.4, -0.2),
      two: () => ({ cam: [5.1, 5, 10.5], look: [5.1, 3.4, 0.6] }),
    };

    type YashiShot = 'desk' | 'screen' | 'face';
    const yashiShotAt = cuts<YashiShot>([
      [0, 'desk'],
      [CUE.yashi[0] + 1.6, 'screen'],
      [LINES[2]!.from, 'face'],
      [LINES[2]!.to + 0.2, 'screen'],
    ]);
    const YASHI_SHOTS: Record<YashiShot, (t: number) => Shot> = cornerShots(corner, yashi, CUE.yashi[0]);

    return direct(
      stage,
      {
        floor: {
          scene: floor.scene,
          frame(t) {
            cast.update(t);
            floor.showMail(t < CUE.mail ? 'inbox' : t < CUE.open ? 'new' : t < CUE.grind[0] ? 'open' : 'grind');
            floor.showDay(calendarAt(t));
            floor.clock.set(9, t / 2 + ease(seg(t, CUE.grind[0], CUE.grind[1])) * GRIND_MINUTES);
            const shot = floorShotAt(t);
            cast.hideRoritHead(shot === 'pov');
            floor.scene.updateMatrixWorld(true);
            return FLOOR_SHOTS[shot](t);
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
