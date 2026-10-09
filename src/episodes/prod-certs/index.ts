import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import { disposeObject } from '../../engine/dispose';
import type { Episode } from '../../engine/types';
import { idle, resetPose } from '../../characters/rory';
import { armOf, reachArm, releaseArm } from '../../characters/reach';
import { ORNITHO_SEAT, type OrnithomimusRig } from '../../characters/ornithomimus';
import { SEAT_HEIGHT } from '../../props/furniture';
import { createPhone, type Phone } from '../../props/phone';
import { linesAt } from '../../world/screen-script';
import { createBedroom, BED_TOP } from '../../world/bedroom';
import { createCampus } from '../../world/campus';
import { sky } from '../../world/sky';
import { createCup } from '../../props/cup';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createAmazaurus, createEilon, createRorit, createSagish, createTaluzarus } from './cast';
import { AMAZ_SEAT, BEANBAG, BEANBAG_TOP, FIDGET, createCallBackdrop, createWarRoom } from './sets';
import {
  CUE,
  DURATION,
  FIX_SCRIPT,
  LAPTOP_SCRIPT,
  STATUS_FIXED,
  STATUS_SCRIPT,
  clockAt,
  mouthAt,
  type Who,
} from './timeline';
import { FIDGET_STEP, soundtrack } from './sound';

// Beat sheet (video seconds; see timeline.ts for the cues, scripts and lines, captions.ts for the text)
//   0–3.5    03:00, the Papo Pako Shapeworks campus, dark
//   3.5–9.5  Sagish asleep; the pager goes off; he bolts up and opens his laptop
//   9.5–15.5 the terminal: certificate has expired, notAfter=Invalid Date
//   15.5–22  Sagish calls Rorit, the mighty DinOps manager: she picks up on the first ring
//   22–26    Rorit calls the seniors: Taluzarus (already awake, obviously), Amazaurus (calm as the moon)
//   26–41    the war room: Amazaurus fixes it, calmly; Taluzarus tries 12 things at once; prod comes back
//   41–44    time-lapse: sunrise; they all doze off (Taluzarus asleep standing up, still swaying)
//   44–55    Eilon, the tech lead, walks in smiling: "Morning! Was something wrong?"
//   then the channel's end card (outro.ts)

type Vec = readonly [number, number, number];
interface Shot {
  cam: Vec;
  look: Vec;
}
type Where = 'campus' | 'sagish' | 'rorit' | 'call' | 'warRoom';
function where(t: number): Where {
  if (t < CUE.campus[1]) return 'campus';
  if (t < CUE.roritAnswers) return 'sagish';
  if (t < CUE.callSeniors[0]) return 'rorit';
  if (t < CUE.warRoom[0]) return 'call';
  return 'warRoom';
}

const SAGISH_SCALE = 0.9; // young
const TALU_SCALE = 1.15; // tall
const RORIT_SCALE = 0.85; // small, but very fit
const EILON_SCALE = 0.8; // short

const episode: Episode = {
  id: 'prod-certs',
  title: 'Invalid Date 📟',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const { camera } = stage;

    // ── the sets ───────────────────────────────────────────────
    const campus = createCampus();
    campus.scene.background = sky('#03050f', '#0b1233', '#1a2350');
    campus.scene.fog = new THREE.Fog(0x0b1233, 40, 90);
    campus.hemi.color.set(0x34408a);
    campus.hemi.groundColor.set(0x101018);
    campus.hemi.intensity = 0.45;
    campus.sun.color.set(0x9db4ff); // moonlight
    campus.sun.intensity = 0.35;
    for (const m of [campus.sign.material, campus.plate.material] as THREE.MeshStandardMaterial[])
      m.emissiveIntensity = 1.4;

    const sagishRoom = createBedroom();
    sagishRoom.clock.set('3:02');
    sagishRoom.hemi.intensity = 1.5;
    const roritRoom = createBedroom();
    roritRoom.clock.set('3:09');
    roritRoom.hemi.color.set(0xb08ae0);
    roritRoom.laptop.visible = false;
    roritRoom.pager.visible = false;
    const call = createCallBackdrop();
    const war = createWarRoom();
    const scenes: Record<Where, THREE.Scene> = {
      campus: campus.scene,
      sagish: sagishRoom.scene,
      rorit: roritRoom.scene,
      call: call.scene,
      warRoom: war.scene,
    };

    // ── the cast ───────────────────────────────────────────────
    const sagish = createSagish();
    sagish.root.scale.setScalar(SAGISH_SCALE);
    const rorit = createRorit();
    rorit.root.scale.setScalar(RORIT_SCALE);
    const talu = createTaluzarus();
    talu.root.scale.setScalar(TALU_SCALE);
    const amaz = createAmazaurus();
    const eilon = createEilon();
    eilon.root.scale.setScalar(EILON_SCALE);
    const feet = new Map<{ feet: THREE.Object3D[] }, THREE.Vector3[]>(
      [sagish, rorit, talu, amaz, eilon].map(r => [r, r.feet.map(f => f.position.clone())]),
    );
    const phoneOf = (colour: number, owner: string) =>
      createPhone({ title: '', subtitle: '', colours: {}, owner }, { height: 0.6, colour });
    const phones = {
      Sagish: phoneOf(0x2a6fdb, 'Sagish'),
      Rorit: phoneOf(0xff8fab, 'Rorit'),
      Taluzarus: phoneOf(0xff9a52, 'Taluzarus'),
      Amazaurus: phoneOf(0x15151a, 'Amazaurus'),
    } as const;
    const eilonCoffee = createCup(0xf4f1ea, 0x6b4a2a);

    const CAST: Record<Where, THREE.Object3D[]> = {
      campus: [],
      sagish: [sagish.root, phones.Sagish.group],
      rorit: [rorit.root, phones.Rorit.group],
      call: [talu.root, amaz.root, phones.Taluzarus.group, phones.Amazaurus.group],
      warRoom: [sagish.root, rorit.root, talu.root, amaz.root, eilon.root, eilonCoffee],
    };
    for (const w of ['campus', 'warRoom', 'call', 'rorit', 'sagish'] as const)
      for (const o of CAST[w]) scenes[w].add(o);
    let current: Where | null = null;
    const v = new THREE.Vector3();

    // ── posing helpers ─────────────────────────────────────────
    type Rig = Parameters<typeof resetPose>[0] & { root: THREE.Group; arms: THREE.Group[]; feet: THREE.Group[] };
    function reset(rig: Rig) {
      resetPose(rig);
      rig.root.position.set(0, 0, 0);
      rig.root.rotation.set(0, 0, 0);
      rig.squash.rotation.set(0, 0, 0);
      rig.squash.position.set(0, 0, 0);
      rig.feet.forEach((f: THREE.Object3D, i: number) => f.position.copy(feet.get(rig)![i]!));
      for (const arm of rig.arms) releaseArm(arm);
      rig.head.visible = true;
      rig.root.visible = true;
    }
    function place(rig: { root: THREE.Group }, x: number, y: number, z: number, yaw = 0) {
      rig.root.position.set(x, y, z);
      rig.root.rotation.y = yaw;
    }
    function grip(arm: THREE.Object3D, world: THREE.Vector3) {
      reachArm(arm, arm.parent!.worldToLocal(world.clone()));
    }
    /** Stepping (in place or on the move): feet lift in turn, a bob. `phase` counts steps. */
    function step(rig: Rig, phase: number, amount = 1) {
      const p = Math.PI * phase;
      rig.root.position.y += Math.abs(Math.sin(p)) * 0.1 * amount;
      for (const f of rig.feet)
        f.position.y += Math.max(0, Math.sin(p + (f.userData.side > 0 ? 0 : Math.PI))) * 0.3 * amount;
      for (const a of rig.arms) a.rotation.x = -0.5 + Math.sin(p + (a.userData.side > 0 ? Math.PI : 0)) * 0.4 * amount;
    }
    /** Phone to the ear (left paw): the screen against the cheek. */
    function onThePhone(rig: Rig, phone: Phone, ear: THREE.Vector3) {
      rig.root.updateMatrixWorld(true);
      phone.group.visible = true;
      rig.head.localToWorld(phone.group.position.copy(ear));
      rig.head.getWorldQuaternion(phone.group.quaternion);
      phone.group.rotateY(-Math.PI / 2 + 0.2);
      phone.group.rotateX(0.3);
      phone.group.updateMatrixWorld(true);
      grip(armOf(rig, -1), phone.group.localToWorld(v.set(0, -0.2, -0.05)));
    }
    /** Mouth: whoever's talking babbles; Eilon always smiles. */
    const talk = (rig: { setMouth(k: number): void }, who: Who, t: number, rest = 0) =>
      rig.setMouth(Math.max(rest, mouthAt(who, t)));
    /** Asleep on their side in bed (the slim build): head on the pillow, the blanket over. */
    function asleep(rig: OrnithomimusRig, room: ReturnType<typeof createBedroom>, t: number, scale: number) {
      place(rig, 0.9, BED_TOP + 0.45 * scale, -0.6);
      rig.root.rotation.z = 1.45;
      for (const e of rig.eyes) e.scale.y = 0.08;
      rig.updateLegs();
      room.blanket.position.set(0.6, BED_TOP + 0.2, -0.55);
      room.blanket.scale.set(2.3, 0.55, 1.35);
      const breath = Math.sin(t * 2.4);
      rig.torso.scale.y *= 1 + breath * 0.03;
      rig.head.updateWorldMatrix(true, false);
      rig.head.getWorldPosition(v);
      room.zzz.forEach((z, i) => {
        const p = (((t * 0.6 + i / 3) % 1) + 1) % 1;
        z.position.set(v.x + 0.2 + p * 0.8, v.y + 0.5 + p * 1.5, v.z + 0.4);
        z.scale.setScalar(0.25 + p * 0.35);
        (z.material as THREE.SpriteMaterial).opacity = Math.sin(p * Math.PI);
      });
    }
    /** Sitting up in bed, legs under the blanket. */
    function sittingUp(rig: OrnithomimusRig, room: ReturnType<typeof createBedroom>, scale: number) {
      place(rig, 0.6, BED_TOP - (ORNITHO_SEAT - 0.08) * scale, -0.6);
      rig.dangleFeet();
      rig.updateLegs(1);
      room.blanket.position.set(0.6, BED_TOP + 0.15, 0.1);
      room.blanket.scale.set(1.5, 0.45, 1.3);
      for (const z of room.zzz) (z.material as THREE.SpriteMaterial).opacity = 0;
    }

    // ── 03:00, the campus ──────────────────────────────────────
    function campusScene(t: number): Shot {
      const c = ease(seg(t, CUE.campus[0], CUE.campus[1]));
      return { cam: [lerp(2.5, 1, c), lerp(7, 6.4, c), lerp(33, 30, c)], look: [0, lerp(9.8, 8.6, c), -12] };
    }

    // ── Sagish's bedroom ───────────────────────────────────────
    const SAG_EAR = new THREE.Vector3(-0.42, 0, 0.05);
    function sagishScene(t: number): Shot {
      const room = sagishRoom;
      reset(sagish);
      idle(sagish, t, { eyesOpen: 1 });
      phones.Sagish.group.visible = false;
      // the pager: quiet, then screaming
      const alerting = t >= CUE.alert;
      room.pagerScreen.set(alerting ? 'PROD DOWN\nTLS EXPIRED' : '');
      (room.led.material as THREE.MeshBasicMaterial).color.set(alerting && Math.floor(t * 4) % 2 ? 0xff2020 : 0x330000);
      room.alarm.intensity = alerting && t < CUE.laptop[0] ? 10 * (0.5 + 0.5 * Math.sin(t * 12)) : 0;
      const buzz = alerting && t < CUE.sitUp + 1.2 ? Math.sin(t * 80) * 0.02 : 0;
      room.pager.position.set(-3.75 + buzz, 1.3, 0.45);
      room.screen.show(linesAt(LAPTOP_SCRIPT, t), Math.floor(t * 2.5) % 2 === 0);

      if (t < CUE.sitUp) {
        asleep(sagish, room, t, SAGISH_SCALE);
        room.lid.rotation.x = 0;
        room.laptop.position.set(1.6, BED_TOP, 0.6);
        room.laptopGlow.intensity = 0;
        if (t < CUE.alert) return { cam: [2.0, 4.4, 10.5], look: [-0.6, 2.0, -0.5] };
        return { cam: [-3.75, 2.9, 1.4], look: [-3.75, 1.3, 0.45] }; // the pager
      }

      // bolt upright; the laptop on his lap, open
      sittingUp(sagish, room, SAGISH_SCALE);
      const jolt = Math.exp(-(t - CUE.sitUp) * 8);
      sagish.squash.scale.set(1 - jolt * 0.08, 1 + jolt * 0.15, 1 - jolt * 0.08);
      for (const e of sagish.eyes) e.scale.set(1.3, 1.3, 1);
      const open = ease(seg(t, CUE.sitUp + 0.5, CUE.sitUp + 1.2));
      sagish.root.updateMatrixWorld(true);
      room.laptop.position.set(0.6, BED_TOP + 0.38, 0.05);
      room.laptop.rotation.set(0, Math.PI, 0);
      room.lid.rotation.x = -1.9 * open;
      room.laptopGlow.intensity = 9 * open;
      room.laptopGlow.position.set(0.6, BED_TOP + 1.8, 0.6); // the screen lights his face
      room.laptop.updateMatrixWorld(true);
      const calling = t >= CUE.callRorit[0];
      if (!calling) {
        // typing: paws on the keys
        for (const arm of sagish.arms) {
          const side = arm.userData.side as number;
          const tap = Math.max(0, Math.sin(t * 20 + side)) * 0.05;
          grip(arm, room.laptop.localToWorld(v.set(side * 0.3, 0.12 + tap, 0.15)));
        }
        sagish.head.rotation.x += 0.35;
      } else {
        onThePhone(sagish, phones.Sagish, SAG_EAR);
        sagish.head.rotation.z = Math.sin(t * 7) * 0.08; // panicking
        sagish.root.position.y += Math.abs(Math.sin(t * 9)) * 0.03;
      }
      talk(sagish, 'Sagish', t);

      if (t < CUE.laptop[0]) {
        return { cam: [1.6, 3.9, 7.0], look: [0.6, 2.8, -0.3] };
      }
      if (!calling) {
        // over his eyes, onto the screen
        sagish.root.visible = false; // we're him
        room.screen.mesh.updateMatrixWorld(true);
        const p = room.screen.mesh.getWorldPosition(new THREE.Vector3());
        const n = new THREE.Vector3(0, 0, 1).transformDirection(room.screen.mesh.matrixWorld);
        const cam = p.clone().addScaledVector(n, 2.7);
        return { cam: [cam.x, cam.y, cam.z], look: [p.x, p.y - 0.12, p.z] };
      }
      return { cam: [1.7, 3.8, 5.6], look: [0.5, 3.1, -0.5] };
    }

    // ── Rorit's bedroom ────────────────────────────────────────
    const RORIT_EAR = new THREE.Vector3(-0.42, 0, 0.05);
    function roritScene(t: number): Shot {
      const room = roritRoom;
      reset(rorit);
      idle(rorit, t, { eyesOpen: 1 });
      rorit.neck.visible = true;
      rorit.hair.ponytail.rotation.set(0.1, 0, 0);
      const answered = t >= CUE.roritAnswers + 0.6;
      if (!answered) {
        asleep(rorit, room, t, RORIT_SCALE);
        const buzz = Math.sin(t * 80) * 0.02;
        phones.Rorit.group.visible = true;
        phones.Rorit.group.position.set(-3.75 + buzz, 1.33, 0.45);
        phones.Rorit.group.rotation.set(-Math.PI / 2, 0, 0.3 + buzz * 3);
        return { cam: [-3.6, 3.0, 2.2], look: [-3.75, 1.4, 0.45] };
      }
      sittingUp(rorit, room, RORIT_SCALE);
      onThePhone(rorit, phones.Rorit, RORIT_EAR);
      for (const e of rorit.eyes) e.scale.y = 0.6; // locked in
      rorit.head.rotation.z = -0.08;
      talk(rorit, 'Rorit', t);
      return { cam: [1.5, 3.3, 5.0], look: [0.4, 2.9, -0.5] };
    }

    // ── Rorit calls the seniors ────────────────────────────────
    const amazTea = createCup(0xf4f1ea, 0xc8915a);
    call.scene.add(amazTea);
    function callScene(t: number): Shot {
      const taluTurn = t < CUE.amazaurus;
      talu.root.visible = taluTurn;
      phones.Taluzarus.group.visible = taluTurn;
      amaz.root.visible = !taluTurn;
      phones.Amazaurus.group.visible = !taluTurn;
      amazTea.visible = !taluTurn;
      if (taluTurn) {
        call.setColour(0xff9a52);
        reset(talu);
        idle(talu, t * 1.6, { eyesOpen: 1 });
        place(talu, Math.sin(t * 3.1) * 0.35, 0, 0, Math.sin(t * 2.3) * 0.4);
        step(talu, t / FIDGET_STEP);
        talu.updateLegs();
        onThePhone(talu, phones.Taluzarus, new THREE.Vector3(-0.42, 0, 0.05));
        armOf(talu, 1).rotation.set(-0.6 + Math.sin(t * 9) * 0.5, 0, 0.9); // waving it around
        for (const e of talu.eyes) e.scale.set(1.2, 1.2, 1);
        talk(talu, 'Taluzarus', t, 0.15);
        return { cam: [0.5, 4.6, 7.2], look: [0, 3.9, 0] };
      }
      call.setColour(0x4fb6a8);
      reset(amaz);
      idle(amaz, t * 0.6, { eyesOpen: 0.65 });
      place(amaz, 0, 0, 0);
      onThePhone(amaz, phones.Amazaurus, new THREE.Vector3(-0.5, 0, 0.05));
      amaz.root.updateMatrixWorld(true);
      amaz.torso.localToWorld(amazTea.position.set(0.55, 1.45, 1.0));
      grip(armOf(amaz, 1), amazTea.localToWorld(v.set(0.2, 0.2, 0)));
      talk(amaz, 'Amazaurus', t);
      return { cam: [0.5, 2.8, 6.0], look: [0, 2.3, 0] };
    }

    // ── the war room ───────────────────────────────────────────
    const RORIT_SPOT = new THREE.Vector3(-3.1, 0, 2.2);
    const SAGISH_SPOT = new THREE.Vector3(1.6, 0, -0.9);
    const EILON_FROM = new THREE.Vector3(7.4, 0, 2.8);
    const EILON_TO = new THREE.Vector3(3.4, 0, 2.8);
    /** Taluzarus, never still: wandering about his spot, turning, waving his arms. */
    function fidget(t: number, amount = 1) {
      place(
        talu,
        FIDGET.x + (Math.sin(t * 1.9) * (FIDGET.rx - 0.15) + Math.sin(t * 5.1) * 0.15) * amount,
        0,
        FIDGET.z + Math.sin(t * 2.7 + 1) * FIDGET.rz * amount,
        (Math.sin(t * 1.3) * 0.9 + Math.sin(t * 3.7) * 0.3) * amount - 0.3,
      );
      step(talu, t / FIDGET_STEP, amount);
      talu.head.rotation.y = Math.sin(t * 4.1) * 0.4 * amount;
      armOf(talu, 1).rotation.set(-0.8 + Math.sin(t * 6.3) * 0.7 * amount, 0, 0.5 + Math.sin(t * 4.7) * 0.4 * amount);
    }
    function warRoomScene(t: number): Shot {
      const fixed = t >= CUE.fixed;
      const morning = t >= CUE.timelapse[0];
      const day = ease(seg(t, CUE.timelapse[0], CUE.timelapse[1] - 0.5));
      war.setDay(day);
      war.dashboard.show(linesAt(fixed ? STATUS_FIXED : STATUS_SCRIPT, t), false);
      war.dashGlow.color.set(fixed ? 0x3bff8a : 0xff3b3b);
      war.dashGlow.intensity = (fixed ? 2 : 3 + Math.sin(t * 6) * 1.2) * (1 - day * 0.8);
      war.laptop.screen.show(linesAt(FIX_SCRIPT, t), Math.floor(t * 2.5) % 2 === 0);
      war.laptop.lid.rotation.x = -1.85;
      const [h, m] = clockAt(t);
      war.clock.set(h, m);
      const cheer = fixed && !morning ? Math.abs(Math.sin((t - CUE.fixed) * 7)) * Math.exp(-(t - CUE.fixed) * 0.6) : 0;
      const ask = t >= CUE.ask;
      const stare = t >= CUE.ask + 3.0; // 🫠

      // Amazaurus: in his chair, typing; calm, always
      reset(amaz);
      idle(amaz, t * 0.6, { eyesOpen: 0.65 });
      place(amaz, AMAZ_SEAT.x, SEAT_HEIGHT + 0.25, AMAZ_SEAT.z + 0.15); // a tall office chair: eyes over the laptop
      for (const f of amaz.feet) f.position.z += 0.35;
      amaz.root.updateMatrixWorld(true);
      war.laptop.group.updateMatrixWorld(true);
      if (!fixed) {
        for (const arm of amaz.arms) {
          const side = arm.userData.side as number;
          const tap = Math.max(0, Math.sin(t * 9 + side * 1.4)) * 0.04;
          grip(arm, war.laptop.group.localToWorld(war.laptop.key(-side * 0.4, 0.2).add(v.set(0, tap, 0))));
        }
        amaz.head.rotation.x += 0.2;
      } else {
        // the tea: a calm sip
        war.tea.updateMatrixWorld(true);
        grip(armOf(amaz, -1), war.tea.localToWorld(v.set(0.2, 0.2, 0)));
        if (cheer > 0) amaz.head.rotation.x += Math.sin(t * 3) * 0.08; // a single, dignified nod
      }
      talk(amaz, 'Amazaurus', t);

      // Taluzarus: everywhere at once; asleep on his feet in the morning (still swaying); off again at 🫠
      reset(talu);
      idle(talu, t * 1.6, { eyesOpen: 1 });
      if (!morning) {
        fidget(t);
        if (fixed) {
          talu.root.position.y += cheer * 1.2;
          for (const a of talu.arms) a.rotation.set(-0.3, 0, a.userData.side * 2.6);
        }
      } else if (!stare) {
        place(talu, FIDGET.x, 0, FIDGET.z, -0.3);
        talu.torso.rotation.z = Math.sin(t * 1.2) * 0.08;
        for (const e of talu.eyes) e.scale.y = ask ? 0.5 : 0.08;
      } else {
        fidget(t, 0.6);
        for (const e of talu.eyes) e.scale.y = 0.5;
        talu.setFrown(true);
      }
      talu.updateLegs();
      talk(talu, 'Taluzarus', t);

      // Rorit: arms crossed, in command; the cheer; asleep on the beanbag in the morning
      reset(rorit);
      idle(rorit, t, { eyesOpen: 1 });
      rorit.hair.ponytail.rotation.set(0.1, 0, 0);
      if (!morning) {
        place(rorit, RORIT_SPOT.x, 0, RORIT_SPOT.z, 0.45);
        rorit.root.updateMatrixWorld(true);
        if (fixed) {
          for (const a of rorit.arms) a.rotation.set(-0.3, 0, a.userData.side * 2.5);
          rorit.root.position.y += cheer * 0.5;
          rorit.setMouth(0.6);
        } else {
          grip(armOf(rorit, -1), rorit.torso.localToWorld(v.set(0.22, 2.12, 0.62)));
          grip(armOf(rorit, 1), rorit.torso.localToWorld(v.set(-0.22, 2.06, 0.66)));
          rorit.head.rotation.x += Math.sin(t * 1.5) * 0.05;
        }
        rorit.updateLegs();
      } else {
        place(rorit, BEANBAG.x, BEANBAG_TOP - (ORNITHO_SEAT - 0.1) * RORIT_SCALE, BEANBAG.z, 0.4);
        rorit.torso.rotation.x = -0.25;
        rorit.dangleFeet();
        rorit.updateLegs(1);
        for (const e of rorit.eyes) e.scale.y = ask ? 0.5 : 0.08;
        rorit.head.rotation.z = ask ? 0 : 0.35;
        if (stare) rorit.setFrown(true);
      }

      // Sagish: hovering behind Amazaurus, nervous; asleep face-down on the desk in the morning
      reset(sagish);
      idle(sagish, t, { eyesOpen: 1 });
      sagish.neck.visible = true;
      place(sagish, SAGISH_SPOT.x, 0, SAGISH_SPOT.z, -0.5);
      if (!morning) {
        sagish.root.position.y += Math.abs(Math.sin(t * 6)) * 0.04;
        sagish.torso.rotation.x = 0.15;
        sagish.root.updateMatrixWorld(true);
        if (fixed) {
          for (const a of sagish.arms) a.rotation.set(-0.3, 0, a.userData.side * 2.6);
          sagish.root.position.y += cheer * 0.8;
          sagish.setMouth(0.7);
        } else grip(armOf(sagish, 1), sagish.head.localToWorld(v.set(0.2, -0.3, 0.45))); // biting his claws
      } else {
        sagish.torso.rotation.x = ask ? 0.3 : 0.75;
        for (const e of sagish.eyes) e.scale.y = ask ? 0.5 : 0.08;
        if (stare) sagish.setFrown(true);
      }
      sagish.updateLegs();

      // Eilon: walks in with his coffee, smiling. Always smiling.
      reset(eilon);
      idle(eilon, t, { eyesOpen: 1 });
      eilon.root.visible = t >= CUE.eilon;
      eilonCoffee.visible = eilon.root.visible;
      if (eilon.root.visible) {
        const k = seg(t, CUE.eilon, CUE.eilon + 3.4);
        const pos = new THREE.Vector3().lerpVectors(EILON_FROM, EILON_TO, k);
        place(
          eilon,
          pos.x,
          0,
          pos.z,
          k < 1 ? -Math.PI / 2 : lerp(-Math.PI / 2, -0.55, ease(seg(t, CUE.eilon + 3.4, CUE.eilon + 3.9))),
        );
        if (k < 1) step(eilon, (t - CUE.eilon) / 0.42);
        eilon.root.updateMatrixWorld(true);
        eilon.torso.localToWorld(eilonCoffee.position.set(0.55, 1.2, 1.0));
        grip(armOf(eilon, 1), eilonCoffee.localToWorld(v.set(0.2, 0.2, 0)));
        talk(eilon, 'Eilon', t); // and when he isn't talking: the smile. It never leaves.
        for (const c of eilon.cheeks) c.scale.set(1.15, 0.9, 0.4); // smiling eyes
        if (ask && t < CUE.ask + 3) armOf(eilon, -1).rotation.set(-0.4, 0, -2.4 + Math.sin(t * 10) * 0.3); // hiii
      }

      // ── shots ──
      const headShot = (head: THREE.Object3D, side = 0.6, dist = 4.6, rise = 0.2): Shot => {
        head.getWorldPosition(v);
        return { cam: [v.x + side, v.y + rise, v.z + dist], look: [v.x, v.y - 0.25, v.z] };
      };
      if (t < CUE.warRoom[0] + 2.3) return { cam: [0.5, 5.4, 16.5], look: [0.5, 3.8, -1] };
      if (t < 31) return { cam: [7.4, 4.6, 10.5], look: [FIDGET.x - 0.4, 3.6, 0.8] }; // Taluzarus, everywhere
      if (t < 34) {
        // through Amazaurus's eyes, onto his terminal
        amaz.root.visible = false; // we're him
        war.laptop.screen.mesh.updateMatrixWorld(true);
        const p = war.laptop.screen.mesh.getWorldPosition(new THREE.Vector3());
        const n = new THREE.Vector3(0, 0, 1).transformDirection(war.laptop.screen.mesh.matrixWorld);
        const cam = p.clone().addScaledVector(n, 2.6);
        return { cam: [cam.x, cam.y + 0.15, cam.z], look: [p.x, p.y, p.z] };
      }
      if (t < CUE.fixed) return headShot(amaz.head, 0.6, 4.4, 0.7);
      if (t < CUE.timelapse[0]) return { cam: [0.5, 5.0, 15.5], look: [0.5, 4.2, -1] };
      if (t < CUE.eilon) return { cam: [0.5, 5.6, 16.5], look: [0.5, 3.8, -1] }; // the time-lapse
      if (t < CUE.ask) return { cam: [3.0, 4.4, 14.5], look: [3.4, 3.0, 1.0] };
      if (t < CUE.ask + 3.0) return headShot(eilon.head, -0.5, 4.4);
      if (t < CUE.ask + 4.0) return { cam: [-0.6, 4.8, 13.5], look: [-0.6, 3.0, 0] }; // 🫠
      return headShot(amaz.head, 0.6, 4.2, 0.7);
    }

    function update(t: number) {
      camera.up.set(0, 1, 0);
      const here = where(t);
      if (here !== current) {
        for (const o of CAST[here]) scenes[here].add(o);
        stage.scene = scenes[here];
        current = here;
      }
      talu.root.visible = amaz.root.visible = true;
      let shot: Shot;
      if (here === 'campus') shot = campusScene(t);
      else if (here === 'sagish') shot = sagishScene(t);
      else if (here === 'rorit') shot = roritScene(t);
      else if (here === 'call') shot = callScene(t);
      else shot = warRoomScene(t);
      camera.position.set(...shot.cam);
      camera.lookAt(...shot.look);
    }

    return {
      update,
      dispose() {
        for (const s of Object.values(scenes)) disposeObject(s);
      },
    };
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default withOutro(episode);
