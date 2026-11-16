import * as THREE from 'three';
import type { Episode } from '../../engine/types';
import { cuts, direct, inFrontOf, overShoulder, type Shot } from '../../engine/director';
import { ease, lerp, seg } from '../../engine/math';
import { playSyllables } from '../../audio/babble';
import { phonePov } from '../../props/phone';
import { cornerShots, createArchitectCorner, createYashiAtDesk } from '../../world/architect-corner';
import { hackOver, typedOut } from '../../world/hack-window';
import { keystrokes, linesAt } from '../../world/screen-script';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createFloorCast, createSkaterLulu } from './cast';
import { createCampus } from '../../world/campus';
import { SPOTS, createDevopsFloor } from './sets';
import { SOUND } from './sound';
import {
  CHAT,
  CUE,
  CUTS,
  DURATION,
  HACK_DM,
  LINES,
  SYLLABLES,
  UPPER_MANAGEMENT,
  YASHI_SCRIPT,
  calendarAt,
  mouthAt,
  speaking,
} from './timeline';

// Beat sheet (video seconds; timeline.ts has the cues, the chat and the lines). Slow on purpose: every infra beat
// gets time to land.
//   0–6        Papo Pako Shapeworks, 9 AM: Lulu skates up to the HQ and in through the doors
//   6–11       the DevOps team: Rorit, Amazaurus, Eilon and Eter at their desk, together
//   5–12       an email from Chuks lands on Rorit's monitor: Narnia compliance, papopakoshapeworks.com → .na
//   12–14      "Narnia?!": her phone comes out. From here on, all four are stressed
//   14–28.8    the DevOps group chat: 200 microservices, 200 certs; the domain's hardcoded everywhere; Eter leads
//   28.8–40    Yashinozarus asks upper management on Hack: papopakoshapeworks.na, approved in 24 hours. The easy
//              part. Then grep, in his terminal: 4,812
//   40–46.2    Eter at her desk: the plan, the domain ticked off, the certs and the hardcoded domains not
//   46.2–63    the grind: reissue 200 certs, then test them; "Who hardcoded the domain 4,812 times?!"; the tests
//              hardcoded it too (312 fail); the calendar flying through months
//   63–78      Lulu walks over. "When will we be Narnia compliant?" "Year 20666. No worries." The calendar agrees
//   then the channel's end card (outro.ts)

/** Outside, the cuts (seconds): to the close shot of her on the board, then to her going in. */
const CAMPUS_CUTS = { feet: 1.8, doors: 3.8 } as const;
/** The shot beside her: how far ahead and out to the side the camera is, its height, and how high on her it looks
 * (scene units): the board and all of her in it. */
const FEET_SHOT = { off: 5.2, height: 2.0, look: 2.6 } as const;
/** The entrance shot: the camera, off to the side across the doors (her in profile, the doors behind her), and how
 * high on her it looks (her middle: all of her, and the board). */
const DOORS_CAM = [5, 2.8, -5.6] as const;
const DOORS_LOOK = 2.2;
/** Their avatar colours in Hack. */
const AVATARS = { Yashinozarus: '#7fa38f', [UPPER_MANAGEMENT]: '#8a8f9c' };
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
    const campus = createCampus();
    const skater = createSkaterLulu();
    campus.scene.add(skater.rig.root, skater.board);
    type CampusShot = 'hq' | 'feet' | 'doors';
    const campusShotAt = cuts<CampusShot>([
      [0, 'hq'],
      [CAMPUS_CUTS.feet, 'feet'],
      [CAMPUS_CUTS.doors, 'doors'],
    ]);
    const CAMPUS_SHOTS: Record<CampusShot, () => Shot> = {
      // the HQ and its wordmark, with Lulu rolling in across the plaza
      hq: () => {
        const p = skater.rig.root.position;
        return { cam: [p.x + 6, 4.5, 22], look: [p.x * 0.7 - 0.6, 5.5, p.z * 0.5 - 6] };
      },
      // low, ahead of her and to the side (the open side of the plaza): Lulu on her board, all of her
      feet: () => {
        const p = skater.rig.root.position;
        const yaw = skater.rig.root.rotation.y;
        const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
        const x = p.x + (fx - fz) * FEET_SHOT.off; // ahead, and out to the street side
        const z = p.z + (fz + fx) * FEET_SHOT.off;
        return { cam: [x, FEET_SHOT.height, z], look: [p.x, FEET_SHOT.look, p.z] };
      },
      // across the entrance: all of her on the board, in profile, rolling in through the doors
      doors: () => {
        const p = skater.rig.root.position;
        return { cam: [...DOORS_CAM], look: [p.x, p.y + DOORS_LOOK, p.z] };
      },
    };

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
    // Hack, open on his monitor: his DM with upper management, until he goes to his terminal
    const hack = hackOver(corner.screen.mesh, UPPER_MANAGEMENT, AVATARS);

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
      [landed(1) + 1.2, 'amazaurus'],
      [landed(2) + 1.2, 'eilon'],
      [landed(3) - 0.4, 'pov'], // her "you lead it"
      [landed(3) + 1.2, 'eter'],
      [landed(4) + 0.2, 'pov'], // her answer
      [CUE.board[0], 'desk'],
      [LINES[2]!.from, 'eter'],
      [LINES[2]!.to, 'plan'], // what's left on it
      [CUE.grind[0], 'wide'], // all four of them, flat out
      [CUE.grind[0] + 2.4, 'monitor'], // 4,812 hardcoded domains
      [LINES[3]!.from, 'rorit'],
      [LINES[3]!.to + 0.3, 'amazaurus'],
      [LINES[3]!.to + 2.4, 'eilon'],
      [LINES[3]!.to + 4.4, 'calendar'], // months go by
      [CUE.lulu[0], 'arrive'],
      [LINES[4]!.from, 'eter'],
      [LINES[5]!.from, 'lulu'],
      [CUE.year, 'calendar'],
      [CUE.year + 1.4, 'two'],
    ]);
    const FLOOR_SHOTS: Record<FloorShot, (t: number) => Shot> = {
      wide: t => {
        // the four of them at their desk, together; easing in
        const c = ease(seg(t, CUE.campus[1], CUE.mail));
        return { cam: [0, lerp(6.4, 5.6, c), lerp(19, 16.5, c)], look: [0, 3, 0] };
      },
      monitor: () => overShoulder(at(floor.monitor), normalOf(floor.monitor), 3.6, -0.2, 0.8), // the whole screen (the domain is on it), from the room side of her chair
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
    const atHisDesk = cornerShots(corner, yashi, CUE.yashi[0]);
    const YASHI_SHOTS: Record<YashiShot, (t: number) => Shot> = {
      ...atHisDesk,
      // Hack, while it's up: back far enough for the whole window (the domain's in it)
      screen: () =>
        hack.mesh.visible
          ? overShoulder(at(corner.monitor), normalOf(corner.monitor), 2.1, -0.3, 1.0)
          : atHisDesk.screen(),
    };

    return direct(
      stage,
      {
        campus: {
          scene: campus.scene,
          frame(t) {
            skater.update(t);
            campus.scene.updateMatrixWorld(true);
            return CAMPUS_SHOTS[campusShotAt(t)]();
          },
        },
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
            hack.mesh.visible = t < YASHI_SCRIPT[1]!.at;
            hack.show(typedOut(HACK_DM, t));
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
