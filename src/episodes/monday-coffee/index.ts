import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { cuts, direct, type Shot } from '../../engine/director';
import { createTyrannosaurus, TIKI_COLORS } from '../../characters/tyrannosaurus';
import { createParasaurolophus, PARIS_COLORS } from '../../characters/parasaurolophus';
import { createStegosaurus, STEGGY_COLORS } from '../../characters/stegosaurus';
import { createLulu, idleLulu } from '../../characters/lulu';
import { createRory, idle, resetPose } from '../../characters/rory';
import { reachArm, releaseArm, sideOf } from '../../characters/reach';
import { ball } from '../../characters/materials';
import { addCap } from '../../props/cap';
import { addSunglasses } from '../../props/sunglasses';
import { addGothOutfit } from '../../props/goth-outfit';
import { addBandTee } from '../../props/band-tee';
import { addShortHair } from '../../props/short-hair';
import { addGlasses } from '../../props/glasses';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';
import { addMohawk } from '../../props/mohawk';
import { addTattoo } from '../../props/tattoo';
import { chatView, createPhone, phonePov, type Phone } from '../../props/phone';
import { addJersey, HOME_KIT, TREX_BODY } from '../../props/soccer';
import { createBedroom, BED_TOP } from '../../world/bedroom';
import { CAPTIONS } from './captions';
import { createCup } from '../../props/cup';
import {
  ARMCHAIR,
  CAFE_CHAIRS,
  CAFE_TABLE,
  COUCH,
  KID_START,
  PARENT_SPOT,
  SCHOOL_DOOR,
  SCHOOLS,
  createSchoolGate,
  createStreetCafe,
  createTherapy,
} from './sets';
import { CHAT, COLOURS, CUE, DURATION, START_CLOCK, chatAt, type Member } from './timeline';
import { soundtrack } from './sound';
import { withOutro } from '../outro';

// Beat sheet (video seconds; see timeline.ts for the cues and the chat, captions.ts for the text)
//   0–7.8    three drop-offs, three schools: Tiki (School of Rock), Paris (St. Raven's), Steggy (Little Einsteins)
//   7.8–10.6 Tiki Taka, at his school gate, to the group chat: "coffeee? ☕"
//   10.6–21.4 the debate, over each parent's phone in turn: black coffee, matcha, big chairs. "@Rory ?"
//   21.4–26.4 Rory: fast asleep, his phone buzzing on the nightstand
//   26.4–41.6 Lulu on her therapist's couch: reads the chat mid-session: "FOMO. Severe FOMO."
//   41.6–50.2 the street café on Elm St: big chairs, a clink, a selfie for Lulu
//   50.2–55   Lulu gets the selfie and flops back on the couch
//   then the channel's end card (outro.ts): Rory with a sign, subscribe for more Rocksaurus shorts

type Parent = 'tiki' | 'paris' | 'steggy';
type Where = Parent | 'bedroom' | 'therapy' | 'cafe';

/** Which set we're in at time t: each parent's school, Rory's room, the therapist's, the café. */
const where = cuts<Where>([
  [0, 'tiki'],
  [CUE.parisSchool[0], 'paris'],
  [CUE.steggySchool[0], 'steggy'],
  [CUE.ask[0], 'tiki'],
  [CUE.parisPhone[0], 'paris'],
  [CUE.steggyPhone[0], 'steggy'],
  [CUE.tikiPhone[0], 'tiki'],
  [CUE.rory[0], 'bedroom'],
  [CUE.therapy[0], 'therapy'],
  [CUE.cafe[0], 'cafe'],
  [CUE.end, 'therapy'],
]);

const SUB = 'Tiki, Paris, Steggy, Lulu, Rory';
/** How far out and up each parent holds their phone: clear of a big belly (or a goth dress). */
const GRIP = {
  'Tiki Taka': { forward: 1.1, up: -0.1 },
  Paris: { forward: 1.4, up: 0.3 },
  Steggy: { forward: 1.5, up: 0.55 },
} as const;
const KID_SCALE = 0.42;

/** The therapist: a distinguished, grey Stegosaurus with a white moustache. */
const DOC_COLORS = {
  ...STEGGY_COLORS,
  body: 0xb9b3c9,
  belly: 0xf2eee6,
  plates: 0x8d87a3,
  plateTips: 0xaaa4bf,
  bowTie: 0x7a2e3a,
  eyes: 0x5a4632,
  mustache: 0xf4f2ec,
};

/** Someone on screen: a holder for place and facing around the rig, and where their feet rest. */
interface Actor<R extends { root: THREE.Group; feet: THREE.Object3D[] }> {
  rig: R;
  holder: THREE.Group;
  feet: THREE.Vector3[];
}

const episode: Episode = {
  id: 'monday-coffee',
  title: 'Monday Coffee ☕',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const { camera } = stage;
    const schools = {
      tiki: createSchoolGate(SCHOOLS.tiki, 31),
      paris: createSchoolGate(SCHOOLS.paris, 47),
      steggy: createSchoolGate(SCHOOLS.steggy, 59),
    };
    const therapy = createTherapy();
    const cafe = createStreetCafe();
    const bedroom = createBedroom();
    const scenes: Record<Where, THREE.Scene> = {
      tiki: schools.tiki.scene,
      paris: schools.paris.scene,
      steggy: schools.steggy.scene,
      bedroom: bedroom.scene,
      therapy: therapy.scene,
      cafe: cafe.scene,
    };

    // Rory's room: the same bedroom, but it's morning (and he isn't on call)
    bedroom.scene.background = new THREE.Color(0xcfe2f5);
    bedroom.hemi.color.set(0xfff3dc);
    bedroom.hemi.intensity = 1.2;
    bedroom.moon.color.set(0xffe2b8);
    bedroom.moon.intensity = 2.0;
    bedroom.laptop.visible = false;
    bedroom.pager.visible = false;
    bedroom.alarm.intensity = 0;
    bedroom.clock.set('8:14');

    function actor<R extends { root: THREE.Group; feet: THREE.Object3D[] }>(rig: R, scale = 1): Actor<R> {
      const holder = new THREE.Group();
      holder.scale.setScalar(scale);
      holder.add(rig.root);
      return { rig, holder, feet: rig.feet.map(f => f.position.clone()) };
    }

    const tikiRig = createTyrannosaurus();
    const cap = addCap(tikiRig, { position: [0, 0.3, 0.08], tilt: -0.14 });
    cap.scale.set(0.62, 0.66, 0.82);
    addSunglasses(tikiRig.head, {
      eyes: [
        [-0.43, 0.2, 1.02],
        [0.43, 0.2, 1.02],
      ],
      size: 0.24,
    });
    // his lucky shirt: the white home kit, RONALDO 7 on the back
    addJersey(tikiRig, tikiRig.posture, TREX_BODY, { ...HOME_KIT, number: '7', name: 'RONALDO' });
    const tiki = actor(tikiRig);

    const parisRig = createParasaurolophus();
    addGothOutfit(parisRig);
    const paris = actor(parisRig);

    const steggyRig = createStegosaurus();
    addBandTee(steggyRig, { text: 'DREAM THEATER' });
    addShortHair(steggyRig);
    addGlasses(steggyRig.head, { eyeX: 0.22, eyeY: 0.1, eyeZ: 0.52, rim: 0.14 });
    const steggy = actor(steggyRig);

    const luluRig = createLulu();
    const hair = addPonytail(luluRig);
    addFlannel(luluRig);
    const lulu = actor(luluRig);

    const roryRig = createRory();
    addMohawk(roryRig);
    addTattoo(roryRig);
    const rory = actor(roryRig);

    const docRig = createStegosaurus(DOC_COLORS);
    addGlasses(docRig.head, { eyeX: 0.22, eyeY: 0.1, eyeZ: 0.52, rim: 0.14, color: 0x8a6a2a });
    const doc = actor(docRig);
    const notepad = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.65, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xfff6c8, roughness: 0.9 }),
    );
    therapy.scene.add(notepad);

    // the kids, with backpacks
    const backpack = (colour: number) => {
      const g = new THREE.Group();
      g.add(
        ball(0.75, new THREE.MeshStandardMaterial({ color: colour, roughness: 0.8 }), [0, 0, 0], [1, 1.2, 0.6], 20),
      );
      g.add(
        ball(
          0.35,
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
          [0, -0.3, 0.38],
          [1, 0.8, 0.4],
          16,
        ),
      );
      return g;
    };
    const kidTikiRig = createTyrannosaurus({ ...TIKI_COLORS, body: 0x9fd6ff, stripes: 0x6fbbea, brow: 0x86c4f2 });
    const kidParisRig = createParasaurolophus({ ...PARIS_COLORS, body: 0xb89cff, spots: 0x9a7be8, crest: 0xff6b8b });
    const kidSteggyRig = createStegosaurus({ ...STEGGY_COLORS, mustache: null, bowTie: 0x3fb8ff });
    const kids = [
      {
        a: actor(kidTikiRig, KID_SCALE),
        pack: 0xff8c42,
        back: kidTikiRig.posture,
        at: [0, 1.6, -1.0],
      },
      {
        a: actor(kidParisRig, KID_SCALE),
        pack: 0x2b2a35,
        back: kidParisRig.torso,
        at: [0, 1.5, -0.95],
      },
      {
        a: actor(kidSteggyRig, KID_SCALE),
        pack: 0x5cbf5a,
        back: kidSteggyRig.torso,
        at: [0, 1.7, -1.25],
      },
    ] as const;
    for (const k of kids) {
      const p = backpack(k.pack);
      p.position.fromArray(k.at);
      k.back.add(p);
    }

    // phones: one each, the same chat, their own bubbles on the right
    const phoneOf = (owner: Member, height: number, colour: number) =>
      createPhone({ title: 'The Parliament 🏛️', subtitle: SUB, colours: COLOURS, owner }, { height, colour });
    const phones: Record<Member, Phone> = {
      'Tiki Taka': phoneOf('Tiki Taka', 0.9, 0x3a78b8),
      Paris: phoneOf('Paris', 0.8, 0x15111c),
      Steggy: phoneOf('Steggy', 0.9, 0xff8a65),
      Lulu: phoneOf('Lulu', 0.75, 0xff8fab),
      Rory: phoneOf('Rory', 0.7, 0x2a2a30),
    };

    const cups = {
      tiki: createCup(0xf4f1ea, 0xc89b6d), // latte
      paris: createCup(0x15111c, 0x1a0f0a), // black, like her soul
      steggy: createCup(0xf4f1ea, 0x7bb661), // matcha
    };
    for (const c of Object.values(cups)) cafe.scene.add(c);

    // who is where; moving the holders between scenes as the story cuts
    const CAST: Record<Where, THREE.Object3D[]> = {
      tiki: [tiki.holder, kids[0].a.holder, phones['Tiki Taka'].group],
      paris: [paris.holder, kids[1].a.holder, phones.Paris.group],
      steggy: [steggy.holder, kids[2].a.holder, phones.Steggy.group],
      bedroom: [rory.holder, phones.Rory.group],
      therapy: [lulu.holder, doc.holder, phones.Lulu.group],
      cafe: [
        tiki.holder,
        paris.holder,
        steggy.holder,
        phones['Tiki Taka'].group,
        phones.Paris.group,
        phones.Steggy.group,
      ],
    };
    for (const w of ['cafe', 'therapy', 'bedroom', 'steggy', 'paris', 'tiki'] as const)
      for (const o of CAST[w]) scenes[w].add(o);

    const v = new THREE.Vector3(),
      w = new THREE.Vector3();
    const UP = new THREE.Vector3(0, 1, 0);

    type Posable = Actor<{ root: THREE.Group; feet: THREE.Object3D[]; arms: THREE.Group[] }>;
    function reset(a: Actor<Parameters<typeof resetPose>[0]>) {
      resetPose(a.rig);
      a.rig.root.position.set(0, 0, 0);
      a.rig.feet.forEach((f: THREE.Object3D, i: number) => f.position.copy(a.feet[i]!));
      for (const arm of a.rig.arms) releaseArm(arm);
    }
    function resetLulu() {
      const r = lulu.rig;
      r.root.position.set(0, 0, 0);
      r.root.rotation.set(0, 0, 0);
      r.squash.rotation.set(0, 0, 0);
      r.squash.scale.set(1, 1, 1);
      r.head.rotation.set(0, 0, 0);
      r.tail.rotation.set(0, 0, 0);
      for (const arm of r.arms) {
        releaseArm(arm);
        arm.rotation.set(-0.3, 0, arm.userData.side * 0.15);
      }
      r.feet.forEach((f, i) => f.position.copy(lulu.feet[i]!));
      for (const e of r.eyes) e.scale.set(1, 1, 1);
      for (const s of r.sticks) s.visible = false;
      r.setMouth(0);
      hair.ponytail.rotation.set(0.1, 0, 0);
    }
    function place(a: { holder: THREE.Group }, x: number, z: number, yaw: number) {
      a.holder.position.set(x, 0, z);
      a.holder.rotation.y = yaw;
    }
    function walk(a: Posable, t: number, amount: number) {
      const ph = t * 6;
      a.rig.root.position.y += Math.abs(Math.sin(ph)) * 0.12 * amount;
      for (const f of a.rig.feet) {
        const s = f.userData.side > 0 ? 0 : Math.PI;
        f.position.y += Math.max(0, Math.sin(ph + s)) * 0.35 * amount;
        f.position.z += Math.cos(ph + s) * 0.25 * amount;
      }
      for (const arm of a.rig.arms)
        arm.rotation.x = -0.5 + Math.sin(ph + (arm.userData.side > 0 ? Math.PI : 0)) * 0.4 * amount;
    }
    /** A paw up, waving. */
    function wave(arm: THREE.Object3D, t: number, k = 1) {
      arm.rotation.x = lerp(arm.rotation.x, -2.6, k);
      arm.rotation.z = arm.userData.side * lerp(0.35, 0.5 + Math.sin(t * 10) * 0.35, k);
    }
    /**
     * Holds a phone in both paws in front of the chest, screen toward the face; thumbs tap while `typing`.
     * `forward`/`up` place it from the shoulders (in the holder's frame, world units).
     */
    function hold(
      a: Posable,
      head: THREE.Object3D,
      phone: Phone,
      t: number,
      { forward = 0.9, up = 0.1, grip = 0.05, spread = 0.4, typing = false } = {},
    ) {
      a.holder.updateMatrixWorld(true);
      const [l, r] = a.rig.arms;
      const mid = l!.getWorldPosition(v).add(r!.getWorldPosition(w)).multiplyScalar(0.5);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(a.holder.quaternion);
      const s = a.holder.scale.x;
      phone.group.position
        .copy(mid)
        .addScaledVector(fwd, forward * s)
        .addScaledVector(UP, up * s);
      phone.group.lookAt(head.getWorldPosition(new THREE.Vector3()));
      phone.group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(phone.group, true);
      const tall = Math.max(box.max.y - box.min.y, 0.3); // roughly the phone's height
      for (const arm of a.rig.arms) {
        const side = sideOf(arm);
        const tap = typing ? Math.max(0, Math.sin(t * 22 + side * 1.7)) * 0.04 : 0;
        // paws on the sides, halfway up, so they don't cover the newest message at the bottom (the phone faces
        // its owner, so its +x is on their right: mirror the side)
        const edge = phone.group.localToWorld(new THREE.Vector3(-side * tall * spread, tall * grip + tap, 0.02));
        reachArm(arm, arm.parent!.worldToLocal(edge));
      }
    }
    /** Through the owner's eyes (their head is hidden for the shot): a phone close-up. */
    const HEADS: THREE.Object3D[] = [tikiRig.head, parisRig.head, steggyRig.head, luluRig.head, ...luluRig.neck];
    function pov(phone: Phone, ...owner: THREE.Object3D[]): Shot {
      for (const o of owner) o.visible = false;
      return phonePov(phone, camera);
    }
    const show = (owner: Member, t: number) => phones[owner].show(chatView(CHAT, t, owner, START_CLOCK));
    const typingNow = (t: number, who: Member) => chatAt(t).pending?.from === who;
    /** Sitting on a seat: hips on the cushion, feet forward. */
    function sit(a: Posable, spot: { x: number; z: number; yaw: number }, hips: number, feet = 0.5) {
      place(a, spot.x + Math.sin(spot.yaw) * 0.2, spot.z + Math.cos(spot.yaw) * 0.2, spot.yaw);
      a.rig.root.position.y = hips;
      for (const f of a.rig.feet) {
        f.position.z += feet;
        f.position.y += 0.15;
      }
    }

    // ── the three school gates ─────────────────────────────────
    const toward = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z);
    const PARENTS = {
      tiki: {
        a: tiki,
        head: tikiRig.head,
        phone: phones['Tiki Taka'],
        name: 'Tiki Taka',
        kid: kids[0].a,
        drop: CUE.tikiSchool,
      },
      paris: {
        a: paris,
        head: parisRig.head,
        phone: phones.Paris,
        name: 'Paris',
        kid: kids[1].a,
        drop: CUE.parisSchool,
      },
      steggy: {
        a: steggy,
        head: steggyRig.head,
        phone: phones.Steggy,
        name: 'Steggy',
        kid: kids[2].a,
        drop: CUE.steggySchool,
      },
    } as const;
    /** The phone shot windows, and when each one cuts from the wide shot to the close-up. */
    const PHONE_SHOTS: Record<Parent, readonly (readonly [from: number, to: number, close: number])[]> = {
      tiki: [
        [CUE.ask[0], CUE.ask[1], CUE.ask[0] + 0.7],
        [CUE.tikiPhone[0], CUE.tikiPhone[1], CUE.tikiPhone[0] + 0.4],
      ],
      paris: [[CUE.parisPhone[0], CUE.parisPhone[1], CUE.parisPhone[0] + 0.6]],
      steggy: [[CUE.steggyPhone[0], CUE.steggyPhone[1], CUE.steggyPhone[0] + 0.6]],
    };
    function schoolScene(who: Parent, t: number): Shot {
      const { a, head, phone, name, kid, drop } = PARENTS[who];
      const [d0, d1] = drop;
      reset(a);
      idle(a.rig, t, { eyesOpen: 1 });
      // the kid walks up the path and in through the door; the parent waves, then turns to the camera
      reset(kid);
      idle(kid.rig, t * 1.3, { eyesOpen: 1 });
      const k = seg(t, d0 + 0.15, d1 - 0.2);
      const pos = new THREE.Vector3().lerpVectors(KID_START, SCHOOL_DOOR, k);
      pos.x = lerp(KID_START.x, SCHOOL_DOOR.x, ease(seg(k, 0, 0.5)));
      place(kid, pos.x, pos.z, toward(KID_START, SCHOOL_DOOR) * (1 - k) + Math.PI * k);
      walk(kid, t, k > 0 && k < 1 ? 1 : 0);
      kid.holder.visible = k < 0.97;
      if (k < 0.12)
        wave(
          kid.rig.arms.find(arm => arm.userData.side < 0)!,
          t,
          1,
        ); // bye!

      const dropping = t < d1;
      const yaw = dropping ? 1.0 : 0.25; // turned toward the path (and us) while waving, then to the camera
      place(a, PARENT_SPOT.x, PARENT_SPOT.z, yaw);
      phone.group.visible = !dropping;
      if (dropping)
        wave(
          a.rig.arms.find(arm => arm.userData.side > 0)!,
          t,
          ease(seg(t, d0 + 0.2, d0 + 0.6)),
        );
      else {
        hold(a, head, phone, t, { ...GRIP[name], typing: typingNow(t, name) });
        a.rig.head.rotation.x += 0.35; // head down, eyes on the screen
        show(name, t);
      }

      if (dropping) {
        // the school behind, the kid going up the path, the parent waving by the gate
        const c = ease(seg(t, d0, d1));
        return {
          cam: [lerp(3.6, 3.0, c), lerp(4.6, 4.3, c), lerp(13.5, 12.5, c)],
          look: [-0.6, lerp(3.2, 3.0, c), -1.2],
        };
      }
      const shot = PHONE_SHOTS[who].find(([f, to]) => t >= f && t < to);
      if (shot && t >= shot[2]) return pov(phone, head);
      // a wide shot of them at their school gate, on the phone
      return { cam: [PARENT_SPOT.x + 1.4, 3.8, PARENT_SPOT.z + 8.5], look: [PARENT_SPOT.x, 2.6, PARENT_SPOT.z - 1] };
    }

    function bedroomScene(t: number): Shot {
      const r = rory;
      reset(r);
      idle(r.rig, t, { eyesOpen: 0.06 });
      place(r, 0.3, -0.4, 0);
      r.rig.root.position.y = BED_TOP + 0.95;
      r.rig.root.rotation.z = 1.45; // on his side, head on the pillow
      r.rig.head.rotation.z = -0.5;
      const breath = Math.sin(((t - CUE.rory[0] - 0.3) / 1.6) * Math.PI * 2);
      r.rig.torso.scale.y *= 1 + breath * 0.04;
      r.rig.setMouth(0.15 + Math.max(0, breath) * 0.3); // snoring
      // the blanket over him
      r.holder.updateMatrixWorld(true);
      r.rig.torso.localToWorld(v.set(0, 1.0, 0));
      bedroom.blanket.position.set(v.x + 0.8, v.y, v.z + 0.15);
      bedroom.blanket.scale.set(1.6, 0.85, 1.25);
      bedroom.blanket.rotation.set(0, 0, 0);
      // Zzz
      r.rig.head.localToWorld(w.set(0, 0.6, 0.3));
      bedroom.zzz.forEach((z, i) => {
        const p = (((t * 0.6 + i / 3) % 1) + 1) % 1;
        z.position.set(w.x + 0.2 + p * 0.8, w.y + 0.3 + p * 1.5, w.z + 0.4);
        z.scale.setScalar(0.25 + p * 0.35);
        z.material.opacity = Math.sin(p * Math.PI);
      });
      // his phone on the nightstand, face up, rattling with every message
      const phone = phones.Rory;
      const buzz = CHAT.some(m => t >= m.at && t < m.at + 0.6) ? Math.sin(t * 90) * 0.02 : 0;
      phone.group.position.set(-3.75 + buzz, 1.33, 0.45);
      phone.group.rotation.set(-Math.PI / 2, 0, 0.3 + buzz * 3);
      show('Rory', t);

      if (t < CUE.rory[0] + 1.8) return { cam: [-3.75, 2.75, 0.75], look: [-3.75, 1.3, 0.38] }; // the phone, from above
      const k = ease(seg(t, CUE.rory[0] + 1.8, CUE.rory[1]));
      return { cam: [lerp(-2.6, -1.4, k), lerp(3.4, 3.8, k), lerp(4.4, 6.6, k)], look: [-1.6, 2.0, -0.4] };
    }

    // ── the therapist's office ─────────────────────────────────
    const COUCH_SEAT = { x: COUCH.x, z: COUCH.z, yaw: COUCH.yaw };
    function therapyScene(t: number): Shot {
      resetLulu();
      const L = lulu.rig;
      const peeking = t >= CUE.peek;
      const reading = peeking && t < CUE.feel;
      const fomo = t >= CUE.fomo && t < CUE.cafe[0];
      const ending = t >= CUE.end;
      idleLulu(L, t, { eyesOpen: fomo ? 1 : 0.8, nod: reading || (ending && t < CUE.flop) ? 0.45 : 0 });
      place(lulu, COUCH_SEAT.x + Math.sin(COUCH.yaw) * 0.25, COUCH_SEAT.z + Math.cos(COUCH.yaw) * 0.25, COUCH.yaw);
      L.root.position.y = 0.7;
      // the phone: on the couch beside her until she sneaks a look, then in both paws
      const phone = phones.Lulu;
      if (peeking && !(ending && t >= CUE.flop + 0.4)) {
        hold(lulu, L.head, phone, t, {
          forward: 1.15,
          up: 0.9,
          grip: -0.62,
          spread: 0.4,
          typing: typingNow(t, 'Lulu'),
        });
      } else {
        lulu.holder.updateMatrixWorld(true);
        L.body.localToWorld(v.set(1.2, 0.95, 0.2));
        const buzz = CHAT.some(m => t >= m.at && t < m.at + 0.6) ? Math.sin(t * 90) * 0.02 : 0;
        phone.group.position.set(v.x + buzz, 1.12, v.z);
        phone.group.rotation.set(-Math.PI / 2, 0, COUCH.yaw);
      }
      show('Lulu', t);
      if (fomo) {
        // FOMO: neck shoots up, head shakes, mouth wide
        const k = ease(seg(t, CUE.fomo, CUE.fomo + 0.25));
        L.neck.forEach(s => (s.rotation.x -= 0.18 * k));
        L.head.rotation.y = Math.sin(t * 16) * 0.25 * k;
        L.setMouth(0.9 * k);
        for (const e of L.eyes) e.scale.set(1.25, 1.25, 1);
        hair.ponytail.rotation.x = 0.1 + Math.abs(Math.sin(t * 16)) * 0.4 * k;
      }
      if (ending && t >= CUE.flop) {
        // flops back over the couch arm, defeated
        const k = ease(seg(t, CUE.flop, CUE.flop + 0.6));
        L.squash.rotation.x = -0.45 * k;
        L.neck.forEach(s => (s.rotation.x -= 0.25 * k));
        L.head.rotation.x -= 0.3 * k;
        for (const e of L.eyes) e.scale.y = lerp(1, 0.3, k);
      }

      // the therapist: notes, nods, then the question
      const d = doc;
      reset(d);
      idle(d.rig, t + 3, { eyesOpen: 1 });
      sit(d, ARMCHAIR, 0.55, 0.35);
      const asking = t >= CUE.feel && t < CUE.fomo;
      if (asking) {
        d.rig.torso.rotation.x += 0.15; // leans in
        d.rig.setMouth(0.25 + Math.abs(Math.sin(t * 14)) * 0.35);
      } else d.rig.head.rotation.x += Math.sin(t * 2.2) * 0.06; // mm-hm
      d.holder.updateMatrixWorld(true);
      const pad = d.rig.torso.localToWorld(v.set(0.15, 1.45, 1.05));
      notepad.position.copy(pad);
      notepad.lookAt(d.rig.head.getWorldPosition(w));
      const pen = d.rig.arms.find(arm => arm.userData.side < 0)!;
      const scribble = asking ? 0 : Math.sin(t * 18) * 0.06;
      reachArm(pen, pen.parent!.worldToLocal(notepad.localToWorld(new THREE.Vector3(-0.1 + scribble, 0, 0.05))));
      const holdPad = d.rig.arms.find(arm => arm.userData.side > 0)!;
      reachArm(holdPad, holdPad.parent!.worldToLocal(notepad.localToWorld(new THREE.Vector3(0.24, -0.1, 0))));

      if (t < CUE.peek) return { cam: [0.6, 5.2, 14.5], look: [0.2, 3.4, 0] }; // the session, wide
      if (t < CUE.feel) return pov(phone, L.head, ...L.neck);
      if (t < CUE.cafe[0]) {
        const k = ease(seg(t, CUE.fomo, CUE.fomo + 0.4));
        return {
          cam: [lerp(0.4, -0.6, k), lerp(4.6, 5.6, k), lerp(12.5, 11.0, k)],
          look: [lerp(0.2, -1.2, k), lerp(3.4, 4.6, k), 0.2],
        };
      }
      if (t < CUE.flop) return pov(phone, L.head, ...L.neck);
      return { cam: [0.6, 5.0, 13.5], look: [0, 3.2, 0] };
    }

    // ── Café Noir ──────────────────────────────────────────────
    const TABLE_TOP = 1.41;
    function cafeScene(t: number): Shot {
      const seats = [
        [tiki, CAFE_CHAIRS.tiki, tikiRig.head, cups.tiki, 0.45],
        [paris, CAFE_CHAIRS.paris, parisRig.head, cups.paris, 0.55],
        [steggy, CAFE_CHAIRS.steggy, steggyRig.head, cups.steggy, 0.85],
      ] as const;
      const clink = Math.sin(Math.PI * seg(t, CUE.clink - 0.6, CUE.clink + 0.6));
      const selfie = seg(t, CUE.selfie - 0.8, CUE.selfie - 0.3) * (1 - seg(t, CUE.selfie + 0.6, CUE.selfie + 1.0));
      for (const p of Object.values(phones)) p.group.visible = true;
      phones['Tiki Taka'].group.visible = false;
      phones.Steggy.group.visible = false;
      seats.forEach(([a, chair, , cup, hips], i) => {
        reset(a);
        idle(a.rig, t + i, { eyesOpen: 1 });
        sit(a, chair, hips);
        a.rig.setMouth(0.15 + clink * 0.4 + selfie * 0.3);
        // the cup: on the table in front of them, raised to the middle for the clink
        const rest = new THREE.Vector3(
          Math.sin(chair.yaw) * -0.75,
          TABLE_TOP,
          CAFE_TABLE.z + Math.cos(chair.yaw) * -0.75,
        );
        rest.x += chair.x * 0.25;
        rest.z += (chair.z - CAFE_TABLE.z) * 0.25;
        const middle = new THREE.Vector3(CAFE_TABLE.x + (i - 1) * 0.28, 3.1, CAFE_TABLE.z);
        cup.position.lerpVectors(rest, middle, clink);
        cup.rotation.y = chair.yaw;
        if (clink > 0.02) {
          const arm = a.rig.arms.find(arm => arm.userData.side < 0)!;
          a.holder.updateMatrixWorld(true);
          reachArm(arm, arm.parent!.worldToLocal(cup.localToWorld(new THREE.Vector3(0.22, 0.22, 0))));
        }
        // leaning in for the selfie, toward Paris
        if (selfie > 0 && a !== paris) a.rig.torso.rotation.z += (i === 0 ? -0.25 : 0.25) * selfie;
      });
      // Paris's phone: held up high for the selfie, then back in her paws to post it
      const phone = phones.Paris;
      if (selfie > 0) {
        paris.holder.updateMatrixWorld(true);
        parisRig.torso.localToWorld(v.set(0.3, 4.4, 1.6));
        phone.group.position.copy(v);
        phone.group.lookAt(parisRig.head.getWorldPosition(w).add(new THREE.Vector3(0, 0.2, 0)));
        const arm = parisRig.arms.find(arm => arm.userData.side > 0)!;
        reachArm(arm, arm.parent!.worldToLocal(phone.group.localToWorld(new THREE.Vector3(0, -0.3, 0))));
      } else if (t >= CUE.selfie + 1.0)
        hold(paris, parisRig.head, phone, t, { forward: 1.8, up: 0.4, typing: typingNow(t, 'Paris') });
      else phone.group.visible = false;
      show('Paris', t);
      const flash = Math.max(0, 1 - Math.abs(t - CUE.selfie) / 0.15);
      cafeFlash.intensity = 60 * flash;
      cafeFlash.position.copy(phone.group.position);

      if (t < CUE.selfie + 1.0) {
        const k = ease(seg(t, CUE.cafe[0], CUE.cafe[0] + 2.2));
        return { cam: [lerp(-1.0, 0.2, k), lerp(6.2, 5.0, k), lerp(16.5, 13.0, k)], look: [0, 2.8, 0] };
      }
      return pov(phone, parisRig.head);
    }
    const cafeFlash = new THREE.PointLight(0xffffff, 0, 12, 1.5);
    cafe.scene.add(cafeFlash);

    const school = (who: Parent) => ({
      scene: scenes[who],
      cast: CAST[who],
      frame: (t: number) => schoolScene(who, t),
    });
    const director = direct(
      stage,
      {
        tiki: school('tiki'),
        paris: school('paris'),
        steggy: school('steggy'),
        bedroom: { scene: scenes.bedroom, cast: CAST.bedroom, frame: bedroomScene },
        therapy: { scene: scenes.therapy, cast: CAST.therapy, frame: therapyScene },
        cafe: { scene: scenes.cafe, cast: CAST.cafe, frame: cafeScene },
      },
      where,
    );

    return {
      update(t) {
        for (const head of HEADS) head.visible = true;
        director.update(t);
      },
      dispose: director.dispose,
    };
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default withOutro(episode);
