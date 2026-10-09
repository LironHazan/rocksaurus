import * as THREE from 'three';
import { seg, ease, lerp } from '../../engine/math';
import { atPace } from '../../engine/subtitles';
import type { Episode } from '../../engine/types';
import { direct, overShoulder, type Shot } from '../../engine/director';
import { createStegosaurus, STEGGY_COLORS } from '../../characters/stegosaurus';
import { createRory, idle, resetPose } from '../../characters/rory';
import { reachArm, armOf } from '../../characters/reach';
import type { CharacterRig } from '../../characters/types';
import { addBandTee } from '../../props/band-tee';
import { addShortHair } from '../../props/short-hair';
import { addGlasses } from '../../props/glasses';
import { addApron } from '../../props/apron';
import { addMohawk } from '../../props/mohawk';
import { addTattoo } from '../../props/tattoo';
import { ball, plush } from '../../characters/materials';
import { recentHit } from '../../band/timing';
import { linesAt, keystrokes } from '../../world/screen-script';
import { CUE, DURATION, PACE, SCENES, sceneAt, type SceneSpan } from './timeline';
import { CAPTIONS } from './captions';
import { ROOM_DOC } from './documents';
import { soundtrack, SCORE_NOTES } from './music';
import { warmGrand } from '../../audio/grand-piano';
import { createSteggyRoom, DESK_TOP } from './sets/room';
import { createCafe, TABLE_TOP, RORY_SEAT, RORY_BAR, STEGGY_SEAT, DOOR_SPOT } from './sets/cafe';

// Beat sheet (exact cues in timeline.ts, story text in captions.ts)
//   0–19   Steggy's room at his dad's place: a wall of CDs, his keyboard, he starts his article
//   19–31  his baby sister nudges him until his focus is gone; he grabs the laptop and leaves
//   31–43.5 the coffee shop: Rory brings two matcha and sits with him; cheers, a sip, and a happy "ahh"

const scene = (id: SceneSpan['id']) => SCENES.find(s => s.id === id)!;
const ROOM_KEYS = keystrokes(ROOM_DOC).filter(k => k < scene('sister').from);
/** The ballad's beats while they talk prog: what they nod along to. */

const SISTER_COLORS = {
  ...STEGGY_COLORS,
  body: 0xffb3d1,
  belly: 0xffe6f0,
  plates: 0xc77dff,
  plateTips: 0xe0b0ff,
  eyes: 0x3d8ef0,
  mustache: null,
};

function lastIndex(times: readonly number[], t: number): number {
  let i = -1;
  while (i + 1 < times.length && times[i + 1]! <= t) i++;
  return i;
}

const episode: Episode = {
  id: 'steggy-matcha',
  title: 'Steggy & the Matcha Theory 🍵',
  duration: DURATION,
  captions: atPace(CAPTIONS, PACE),

  // render the piano's notes before playback so nothing stutters
  async preload() {
    warmGrand(SCORE_NOTES);
  },

  setup(stage) {
    const room = createSteggyRoom();
    const cafe = createCafe();

    const steggy = createStegosaurus();
    addBandTee(steggy, { text: 'DREAM THEATER' });
    addShortHair(steggy);
    addGlasses(steggy.head, { eyeX: 0.22, eyeY: 0.1, eyeZ: 0.52, rim: 0.14 });

    const sister = createStegosaurus(SISTER_COLORS);
    sister.root.scale.setScalar(0.45);
    const bow = new THREE.Group();
    for (const s of [-1, 1]) bow.add(ball(0.13, plush(0xff3fa4), [s * 0.13, 0, 0], [1, 0.7, 0.6]));
    bow.add(ball(0.07, plush(0xff3fa4), [0, 0, 0.02]));
    bow.position.set(0, 0.46, 0.05);
    sister.head.add(bow);
    room.scene.add(sister.root);

    const rory = createRory();
    addMohawk(rory);
    addTattoo(rory);
    addApron(rory.torso);
    cafe.scene.add(rory.root);

    const v = new THREE.Vector3(),
      n = new THREE.Vector3(),
      w = new THREE.Vector3(),
      tmp = new THREE.Vector3();

    /** How far a paw reaches from the shoulder with a straight arm (torso units); further than this, the elbow bends. */
    const ARM_REACH = 0.55;
    /** Puts a paw on a world-space point; bends the elbow outward when the point is out of reach. */
    function paw(rig: CharacterRig, side: -1 | 1, world: THREE.Vector3) {
      rig.root.updateMatrixWorld(true);
      const pivot = armOf(rig, side);
      const target = rig.torso.worldToLocal(world.clone());
      const shoulder = pivot.position;
      const reach = ARM_REACH;
      const d = target.distanceTo(shoulder);
      if (d <= reach * 1.1) return reachArm(pivot, target);
      const elbow = shoulder.clone().lerp(target, 0.5);
      elbow.x += side * 0.22;
      elbow.y -= 0.18;
      reachArm(pivot, target, elbow);
    }
    /** Arms hanging relaxed (still driven by reachArm so stretched parts reset). */
    function restArms(rig: CharacterRig) {
      rig.root.updateMatrixWorld(true);
      for (const side of [-1, 1] as const) {
        const pivot = armOf(rig, side);
        rig.torso.localToWorld(w.copy(pivot.position).add(tmp.set(side * 0.08, -0.42, 0.12)));
        paw(rig, side, w);
      }
    }

    function screenOf(laptop: typeof room.laptop) {
      laptop.group.updateMatrixWorld(true);
      laptop.screen.mesh.getWorldPosition(v);
      laptop.screen.mesh.getWorldDirection(n);
    }

    /** Typing: the paw whose turn it is comes down on each keystroke. */
    function typeOn(rig: CharacterRig, laptop: typeof room.laptop, keys: readonly number[], t: number) {
      const i = lastIndex(keys, t);
      for (const side of [-1, 1] as const) {
        const mine = i >= 0 && (i % 2 === 0) === side < 0;
        const hit = mine ? Math.exp(-(t - keys[i]!) * 16) : 0;
        const k = i >= 0 ? (i * 7 + (side + 1) * 3) % 5 : 2;
        laptop.key(side * (0.35 + (k % 3) * 0.12), (k % 2) - 0.3, w);
        w.y += 0.1 * (1 - hit);
        laptop.group.localToWorld(w);
        paw(rig, side, w);
      }
    }

    /** Walk cycle: bob, alternating feet, a little sway. */
    function walk(rig: CharacterRig, phase: number) {
      const p = Math.PI * phase;
      rig.root.position.y += Math.abs(Math.sin(p)) * 0.1;
      for (const f of rig.feet) f.position.y = Math.max(0, Math.sin(p + (f.userData.side > 0 ? 0 : Math.PI))) * 0.2;
      rig.torso.rotation.z = Math.sin(p) * 0.05;
      rig.tail.rotation.y = Math.sin(p) * 0.3;
    }

    /** Holds the laptop shut in front of the chest with both paws. */
    function carryLaptop(rig: CharacterRig, laptop: typeof room.laptop) {
      rig.root.updateMatrixWorld(true);
      laptop.lid.rotation.x = 0;
      rig.torso.localToWorld(laptop.group.position.set(0, 1.25, 1.15));
      laptop.group.quaternion.copy(rig.root.quaternion);
      for (const side of [-1, 1] as const) {
        laptop.group.localToWorld(w.set(side * 0.72, 0.03, 0.1));
        paw(rig, side, w);
      }
    }

    function resetAll(t: number) {
      resetPose(steggy);
      steggy.plates.forEach(p => p.scale.set(1, 1, 1));
      idle(steggy, t, { eyesOpen: 1 });
    }

    // ── Room ────────────────────────────────────────────────────
    const SEAT = new THREE.Vector3(0, 0.25, -0.1);
    function roomScene(t: number): Shot {
      steggy.root.position.copy(SEAT);
      room.door.rotation.y = 0;
      room.laptop.group.position.set(0, DESK_TOP, 1.65);
      room.laptop.group.rotation.set(0, Math.PI, 0);
      room.laptop.lid.rotation.x = -1.85;
      sister.root.visible = false;
      steggy.head.rotation.x += 0.12; // eyes on the screen
      if (t >= CUE.typeFrom) typeOn(steggy, room.laptop, ROOM_KEYS, t);
      else typeOn(steggy, room.laptop, [], t);
      if (t >= CUE.typeFrom + 5) steggy.eyes.forEach(e => (e.scale.y *= 0.75)); // deep focus
      room.laptop.screen.show(linesAt(ROOM_DOC, t), Math.floor(t * 2.5) % 2 === 0);

      if (t < 1.5) return { cam: [0, 4.3, 12.5], look: [-0.5, 2.6, -1] };
      if (t < CUE.cds[0]) return { cam: [1.6, 3.1, 5.6], look: [0, 2.0, 0.4] };
      if (t < CUE.cds[1]) {
        const x = lerp(-5.4, -2.6, ease(seg(t, CUE.cds[0], CUE.cds[1])));
        return { cam: [x, 2.7, 0.4], look: [x, 2.2, -3.6] }; // slowly along the CD wall
      }
      if (t < CUE.typeFrom) return { cam: [1.6, 3.1, 5.6], look: [0, 2.0, 0.4] };
      if (t < CUE.typeFrom + 5) {
        screenOf(room.laptop);
        return overShoulder(v, n, 1.9, 0.8, -0.6);
      }
      return { cam: [1.7, 2.6, 5.4], look: [0, 1.9, 0.6] };
    }

    // ── Sister ──────────────────────────────────────────────────
    const SISTER_SPOT = new THREE.Vector3(1.5, 0, 0.35); // at his side, not behind the desk
    const DOORWAY = new THREE.Vector3(5.6, 0, -3.1);
    function sisterScene(t: number): Shot {
      room.door.rotation.y = -1.4 * ease(seg(t, CUE.sisterIn - 0.2, CUE.sisterIn + 0.4));
      room.laptop.screen.show(linesAt(ROOM_DOC, t), false);

      // the sister walks in, then nudges
      sister.root.visible = true;
      resetPose(sister);
      idle(sister, t * 1.3, { eyesOpen: 1 });
      const inK = seg(t, CUE.sisterIn, CUE.sisterArrive);
      sister.root.position.lerpVectors(DOORWAY, SISTER_SPOT, inK);
      if (inK > 0 && inK < 1) {
        walk(sister, (t - CUE.sisterIn) / 0.22);
        sister.root.rotation.y = Math.atan2(SISTER_SPOT.x - DOORWAY.x, SISTER_SPOT.z - DOORWAY.z);
      } else sister.root.rotation.y = inK >= 1 ? 0.15 : 0; // facing the camera, Steggy on her right
      const nudge = CUE.nudges.reduce((m, c) => Math.max(m, Math.sin(Math.PI * seg(t, c - 0.15, c + 0.25))), 0);
      sister.root.position.x -= nudge * 0.3;
      sister.setMouth(inK >= 1 ? 0.3 + nudge * 0.5 : 0);
      if (inK >= 1 && t < CUE.closeLid) {
        // poke his side (only while he's sitting there: once he gets up, she lets go)
        steggy.root.position.copy(SEAT);
        steggy.root.updateMatrixWorld(true);
        steggy.torso.localToWorld(w.set(0.95, 1.1, 0.25));
        paw(sister, -1, w); // poke!
        paw(sister, 1, sister.torso.localToWorld(tmp.set(0.62, 1.0, 0.75)));
      } else if (inK >= 1) {
        // bye bye! a little wave as he leaves
        restArms(sister);
        paw(sister, 1, sister.torso.localToWorld(tmp.set(0.85, 2.0 + Math.sin(t * 14) * 0.15, 0.6)));
        sister.setMouth(0.5);
      } else restArms(sister);

      // Steggy: typing → interrupted → closes the laptop → leaves with it
      const hit = recentHit(t, CUE.nudges, 5);
      steggy.root.position.copy(SEAT);
      steggy.torso.rotation.z = hit * 0.15;
      steggy.head.rotation.y = hit * 0.6;
      steggy.setFrown(t > CUE.nudges[1]! && hit > 0.25);
      if (t < CUE.closeLid) {
        room.laptop.group.position.set(0, DESK_TOP, 1.65);
        room.laptop.group.rotation.set(0, Math.PI, 0);
        room.laptop.lid.rotation.x = -1.85;
        typeOn(steggy, room.laptop, t < CUE.nudges[0]! ? ROOM_KEYS : [], t);
        for (const e of steggy.eyes) e.scale.y *= 1 + hit * 0.3;
      } else if (t < CUE.leave) {
        room.laptop.group.position.set(0, DESK_TOP, 1.65);
        room.laptop.group.rotation.set(0, Math.PI, 0);
        room.laptop.lid.rotation.x = -1.85 * (1 - ease(seg(t, CUE.closeLid, CUE.closeLid + 0.5)));
        if (t < CUE.closeLid + 0.6) {
          room.laptop.lid.updateMatrixWorld(true);
          room.laptop.group.localToWorld(w.set(0, 0.9 * (1 - seg(t, CUE.closeLid, CUE.closeLid + 0.5)), -0.3));
          paw(steggy, 1, w);
          paw(steggy, -1, w.clone().add(tmp.set(0.4, 0, 0)));
        } else carryLaptop(steggy, room.laptop);
        steggy.setMouth(0.3); // sigh
      } else {
        const k = seg(t, CUE.leave, CUE.exit);
        steggy.root.position.lerpVectors(SEAT, DOORWAY, k);
        steggy.root.position.y = lerp(SEAT.y, 0, Math.min(1, k * 4));
        steggy.root.rotation.y = Math.atan2(DOORWAY.x - SEAT.x, DOORWAY.z - SEAT.z) * ease(Math.min(1, k * 5));
        walk(steggy, (t - CUE.leave) / 0.3);
        carryLaptop(steggy, room.laptop);
        steggy.root.visible = k < 0.98;
      }

      if (t < CUE.sisterArrive) return { cam: [0.5, 4.3, 12], look: [1.5, 2, -1] };
      if (t < CUE.nudges[2]) return { cam: [4.2, 2.3, 3.6], look: [0.8, 1.3, 0.2] }; // from the side, clear of the desk
      if (t < CUE.nudges[3] + 0.3) {
        screenOf(room.laptop);
        return overShoulder(v, n, 1.9, 0.8, -0.6);
      }
      if (t < CUE.closeLid) return { cam: [3.4, 1.9, 2.6], look: [0.9, 1.3, 0.2] };
      return { cam: [1.5, 4.0, 11.5], look: [2.5, 1.8, -1] };
    }

    // ── Café ────────────────────────────────────────────────────
    const STEGGY_YAW = -Math.PI / 2 + 0.5;
    const RORY_YAW = Math.PI / 2 - 0.5;
    const CUP_STEGGY = new THREE.Vector3(0.5, TABLE_TOP, 0.05);
    const CUP_RORY = new THREE.Vector3(-0.5, TABLE_TOP, 0.9);
    const LAPTOP_SPOT = new THREE.Vector3(0.5, TABLE_TOP, 0.75);
    /** Where Rory stands to set the cups down: behind the table, facing the camera. */
    const SERVE_SPOT = new THREE.Vector3(-0.3, 0, -1.0);

    /** Brings a cup to a character's mouth, held by both paws. */
    function sip(
      rig: CharacterRig,
      cup: THREE.Object3D,
      mouth: THREE.Vector3,
      yaw: number,
      k: number,
      home: THREE.Vector3,
    ) {
      const fwd = tmp.set(Math.sin(yaw), 0, Math.cos(yaw));
      const up = new THREE.Vector3(0, 1, 0).addScaledVector(fwd, 0.7 * k).normalize();
      const atMouth = mouth.clone().addScaledVector(fwd, 0.22).addScaledVector(up, -0.3);
      cup.position.lerpVectors(home, atMouth, k);
      cup.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, up);
      cup.rotation.y += yaw; // handle to the side
      const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      for (const s of [-1, 1] as const)
        paw(
          rig,
          s,
          cup.position
            .clone()
            .addScaledVector(up, 0.16)
            .addScaledVector(side, -s * 0.24),
        );
    }
    const mouthOf = (rig: CharacterRig, at: THREE.Vector3, out: THREE.Vector3) => {
      rig.root.updateMatrixWorld(true);
      return rig.head.localToWorld(out.copy(at));
    };

    /** Rory: at the bar → carries both cups to the table → sets them down → hops onto his stool. */
    function roryServes(t: number, cupS: THREE.Object3D, cupR: THREE.Object3D): boolean {
      const [from, to] = CUE.serve;
      for (const c of [cupS, cupR]) c.quaternion.identity();
      if (t < from) {
        rory.root.position.copy(RORY_BAR);
        rory.root.rotation.y = 0.5;
        for (const c of [cupS, cupR]) c.visible = false;
        return false;
      }
      for (const c of [cupS, cupR]) c.visible = true;
      if (t < CUE.placeCups) {
        // walking over with a cup in each paw
        const k = seg(t, from, to);
        rory.root.position.lerpVectors(RORY_BAR, SERVE_SPOT, ease(k));
        rory.root.rotation.y = k < 1 ? Math.atan2(SERVE_SPOT.x - RORY_BAR.x, SERVE_SPOT.z - RORY_BAR.z) : 0;
        if (k < 1) walk(rory, (t - from) / 0.3);
        rory.root.updateMatrixWorld(true);
        rory.torso.localToWorld(cupR.position.set(-0.45, 1.45, 1.0));
        rory.torso.localToWorld(cupS.position.set(0.45, 1.45, 1.0));
        paw(rory, -1, cupR.localToWorld(w.set(0, 0.16, 0)));
        paw(rory, 1, cupS.localToWorld(w.set(0, 0.16, 0)));
        rory.setMouth(0.3);
        return true;
      }
      // cups on the table; Rory takes his seat
      cupS.position.copy(CUP_STEGGY);
      cupR.position.copy(CUP_RORY);
      const k = seg(t, CUE.placeCups, CUE.roryTakesSeat);
      rory.root.position.lerpVectors(SERVE_SPOT, RORY_SEAT, ease(k));
      rory.root.position.y = RORY_SEAT.y * k + Math.sin(Math.PI * k) * 0.6;
      rory.root.rotation.y = lerp(0, RORY_YAW, ease(k));
      return k < 1;
    }

    function cafeScene(t: number): Shot {
      resetPose(rory);
      idle(rory, t, { eyesOpen: 1 });
      const [cupS, cupR] = [cafe.cups[0]!, cafe.cups[1]!];

      // Steggy: in through the door, up on his stool
      const inK = seg(t, CUE.enter, CUE.sit);
      if (inK < 1) {
        steggy.root.position.lerpVectors(DOOR_SPOT, STEGGY_SEAT, inK);
        steggy.root.position.y =
          Math.sin(Math.PI * seg(t, CUE.sit - 0.5, CUE.sit)) * 0.7 + STEGGY_SEAT.y * seg(t, CUE.sit - 0.5, CUE.sit);
        steggy.root.rotation.y =
          inK < 0.85 ? Math.atan2(STEGGY_SEAT.x - DOOR_SPOT.x, STEGGY_SEAT.z - DOOR_SPOT.z) : STEGGY_YAW;
        if (inK < 0.8) walk(steggy, (t - CUE.enter) / 0.3);
        carryLaptop(steggy, cafe.laptop);
      } else {
        steggy.root.position.copy(STEGGY_SEAT);
        steggy.root.rotation.y = STEGGY_YAW;
        cafe.laptop.group.position.copy(LAPTOP_SPOT);
        cafe.laptop.group.rotation.set(0, Math.PI / 2, 0);
        cafe.laptop.lid.rotation.x = 0; // work can wait: matcha first
      }

      const serving = roryServes(t, cupS, cupR);
      if (t >= CUE.roryTakesSeat) {
        rory.root.position.copy(RORY_SEAT);
        rory.root.rotation.y = RORY_YAW;
      }

      // cheers! both cups meet over the table, then they sip together
      const cheers = Math.sin(Math.PI * seg(t, CUE.cheers - 0.5, CUE.cheers + 0.5));
      const sipK = Math.max(...CUE.sips.map(c => ease(seg(t, c - 0.6, c - 0.1)) * (1 - ease(seg(t, c + 0.5, c + 1)))));
      if (cheers > 0) {
        for (const [rig, cup, home, toward] of [
          [steggy, cupS, CUP_STEGGY, -1],
          [rory, cupR, CUP_RORY, 1],
        ] as const) {
          cup.position.lerpVectors(home, tmp.set(toward * 0.22, TABLE_TOP + 0.9, 0.5), cheers);
          for (const side of [-1, 1] as const) paw(rig, side, cup.localToWorld(w.set(side * 0.22, 0.16, 0)));
        }
      } else if (sipK > 0) {
        sip(steggy, cupS, mouthOf(steggy, v.set(0, -0.24, 0.62), v), STEGGY_YAW, sipK, CUP_STEGGY);
        sip(rory, cupR, mouthOf(rory, v.set(0, -0.45, 1.2), v), RORY_YAW, sipK, CUP_RORY);
      } else {
        if (inK >= 1) restArms(steggy);
        if (!serving) restArms(rory);
      }

      // ahh: eyes closed, big smiles, plates relaxed and happy
      const ahh = ease(seg(t, CUE.enjoy, CUE.enjoy + 0.6));
      if (ahh > 0) {
        for (const rig of [steggy, rory]) {
          for (const e of rig.eyes) e.scale.y *= 1 - 0.85 * ahh;
          rig.head.rotation.x -= 0.15 * ahh;
          rig.setMouth(0.35 * ahh);
        }
        steggy.plates.forEach((p, i) => p.scale.set(1, 1 + 0.12 * ahh * Math.max(0, Math.sin(t * 4 - i * 0.5)), 1));
      }

      if (t < CUE.sit) return { cam: [1.5, 4.2, 12.5], look: [0.5, 2.2, -1] };
      if (t < CUE.roryTakesSeat) return { cam: [0.4, 3.8, 9.5], look: [-0.6, 2.0, 0.2] }; // Rory brings the matcha
      if (t < CUE.enjoy) return { cam: [0.2, 3.4, 7.6], look: [0, 2.4, 0.5] };
      const push = ease(seg(t, CUE.enjoy, CUE.enjoy + 2));
      return { cam: [0.2, 3.3, lerp(7.6, 6.4, push)], look: [0, 2.6, 0.5] };
    }

    const cast = [steggy.root];
    const director = direct(
      stage,
      {
        room: { scene: room.scene, cast, frame: roomScene },
        sister: { scene: room.scene, cast, frame: sisterScene },
        cafe: { scene: cafe.scene, cast, frame: cafeScene },
      },
      t => sceneAt(t).id,
    );

    return {
      update(videoTime) {
        const t = videoTime / PACE; // story time
        steggy.root.visible = true;
        steggy.root.rotation.set(0, 0, 0);
        resetAll(t);
        director.update(t);
      },
      dispose: director.dispose,
    };
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default episode;
