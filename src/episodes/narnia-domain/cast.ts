import * as THREE from 'three';
import { ease, seg } from '../../engine/math';
import { createEilon, createEter, createRorit } from '../../characters/coworkers';
import { createAmazaurus } from '../../characters/amazaurus';
import { createLulu, idleLulu, resetLulu, walkLulu } from '../../characters/lulu';
import { armOf } from '../../characters/reach';
import { restRig } from '../../characters/rest';
import type { CharacterRig } from '../../characters/types';
import { addFlannel } from '../../props/flannel';
import { addPonytail } from '../../props/ponytail';
import { chatView, createPhone, holdPhone, type Phone } from '../../props/phone';
import { LULU_ENTRY, LULU_STOP, SPOTS } from './sets';
import { CHAT, COLOURS, CUE, MEMBERS, START_CLOCK, mouthAt, type Member } from './timeline';

// Who does what on the DevOps floor, as a function of t: everyone at their spot; Rorit reads her mail, gasps and gets
// her phone out; the four of them on the group chat; then the grind, all four typing flat out. From the email on,
// they're stressed: wide eyes, a jittery head, a sweat drop running down. Lulu walks over to Eter at the end.

/** The phones: how tall (scene units), and when they're out: Rorit's from her gasp, the others' from her first message. */
const PHONE_HEIGHT = 0.6;
const PHONES_AWAY = CUE.chat[1];
/** How wide Rorit's eyes go at the email. */
const SHOCK = 1.35;
/** Stress: how wide the eyes go, the head's jitter (radians, and per second), how fast they type in the grind (per
 * second) and how far each paw dips (radians); a sweat drop runs down every `SWEAT_S` seconds. */
const STRESS = { eyes: 1.2, jitter: 0.05, jitterRate: 13, typeRate: 16, dip: 0.25 } as const;
const SWEAT_S = 1.3;
/** The sweat drop beside the outer eye (in eye spacings): out, up, how far it runs down, and its size. */
const SWEAT = { out: 0.4, up: 0.5, fall: 1.0, size: 0.22 } as const;
/** Lulu's walk over: a step (seconds) and how big. */
const LULU_STEP = 0.5;
const LULU_STRIDE = 0.8;
/** Eter turns her head to Lulu (radians) once she's there; Lulu turns to her. */
const TO_LULU = 0.9;

/** A sweat drop: clear and blue, catching the light. */
const SWEAT_MAT = new THREE.MeshPhysicalMaterial({
  color: 0x5fb8ff,
  emissive: 0x1f5f9f,
  roughness: 0.05,
  clearcoat: 1,
});

/** Everyone on the floor, and their phones. */
export function createFloorCast() {
  const rorit = createRorit();
  const eter = createEter(); // Lulu's build: posed the way Lulu is
  const others: Record<Exclude<Member, 'Eter'>, CharacterRig> = {
    Rorit: rorit.rig,
    Amazaurus: createAmazaurus(),
    Eilon: createEilon(),
  };
  /** Everyone, for the shots and the phones: where they are, their head, their arms. */
  const rigs: Record<Member, Pick<CharacterRig, 'root' | 'head' | 'arms' | 'eyes'>> = { ...others, Eter: eter };
  const feet = new Map(Object.values(others).map(r => [r, r.feet.map(f => f.position.clone())]));
  const phoneOf = (owner: Member) =>
    createPhone(
      { title: 'DevOps 🦖', subtitle: MEMBERS.join(', '), colours: COLOURS, owner },
      { height: PHONE_HEIGHT },
    );
  const phones: Record<Member, Phone> = {
    Rorit: phoneOf('Rorit'),
    Amazaurus: phoneOf('Amazaurus'),
    Eilon: phoneOf('Eilon'),
    Eter: phoneOf('Eter'),
  };

  const lulu = createLulu();
  const luluHair = addPonytail(lulu);
  addFlannel(lulu);

  /** A sweat drop by each one's outer eye, in head space (built at rest, so it fits each head). */
  const drops = new Map(
    MEMBERS.map((who, i) => {
      const rig = rigs[who];
      rig.root.updateMatrixWorld(true);
      const eyes = rig.eyes.map(e => e.getWorldPosition(new THREE.Vector3()));
      const outer = eyes.reduce((a, b) => (b.x > a.x ? b : a));
      const spacing = Math.max(...eyes.map(e => e.x)) - Math.min(...eyes.map(e => e.x));
      const drop = new THREE.Mesh(new THREE.SphereGeometry(spacing * SWEAT.size, 12, 10), SWEAT_MAT);
      drop.scale.set(1, 1.5, 1);
      const start = outer.clone().add(new THREE.Vector3(spacing * SWEAT.out, spacing * SWEAT.up, 0));
      rig.head.add(drop);
      const top = rig.head.worldToLocal(start.clone());
      const bottom = rig.head.worldToLocal(start.clone().add(new THREE.Vector3(0, -spacing * SWEAT.fall, 0)));
      return [who, { drop, top, bottom, phase: i * 0.37 }] as const;
    }),
  );

  /** Stressed: wide eyes, a jittery head, a sweat drop; typing flat out in the grind. */
  function stress(who: Member, t: number) {
    const rig = rigs[who];
    const { drop, top, bottom, phase } = drops.get(who)!;
    const on = t >= CUE.gasp;
    const k = ((((t + phase * SWEAT_S) % SWEAT_S) + SWEAT_S) % SWEAT_S) / SWEAT_S;
    drop.visible = on;
    drop.position.lerpVectors(top, bottom, k);
    if (!on) return;
    rig.head.rotation.z += Math.sin(t * STRESS.jitterRate + phase * 7) * STRESS.jitter;
    for (const e of rig.eyes) e.scale.multiplyScalar(STRESS.eyes);
    if (t < CUE.grind[0] || t >= CUE.grind[1] + (who === 'Eter' ? 0 : CUE.year - CUE.grind[1])) return;
    if (who === 'Eter' && t >= CUE.lulu[1]) return; // she stops to talk to Lulu
    for (const side of [-1, 1] as const)
      armOf(rig, side).rotation.x -=
        0.7 + Math.max(0, Math.sin(t * STRESS.typeRate + side * 1.7 + phase * 5)) * STRESS.dip;
  }

  /** Whether `who` has their phone out at t. */
  const phoneOut = (who: Member, t: number) =>
    t < PHONES_AWAY && t >= (who === 'Rorit' ? CUE.phoneOut : CHAT[0]!.at - 0.4);

  /** Eter at her desk; once Lulu's there, she turns to her. */
  function eterAtDesk(t: number) {
    resetLulu(eter);
    eter.root.position.copy(SPOTS.Eter);
    eter.root.rotation.y = 0;
    idleLulu(eter, t, { eyesOpen: 0.85 });
    eter.setMouth(mouthAt('Eter', t));
    if (t >= CUE.lulu[1]) eter.head.rotation.y = TO_LULU;
  }

  function luluWalks(t: number) {
    resetLulu(lulu);
    luluHair.ponytail.rotation.set(0.1, 0, 0);
    lulu.root.visible = t >= CUE.lulu[0];
    idleLulu(lulu, t, { eyesOpen: t >= CUE.year - 3 ? 0.45 : 0.85 }); // smug, by the end
    lulu.setMouth(mouthAt('Lulu', t));
    const k = ease(seg(t, CUE.lulu[0], CUE.lulu[1]));
    lulu.root.position.lerpVectors(LULU_ENTRY, LULU_STOP, k);
    const to = k < 1 ? LULU_STOP : SPOTS.Eter;
    lulu.root.rotation.y = Math.atan2(to.x - lulu.root.position.x, to.z - lulu.root.position.z);
    walkLulu(lulu, (t - CUE.lulu[0]) / LULU_STEP, k > 0 && k < 1 ? LULU_STRIDE : 0, luluHair.ponytail);
  }

  /** Rorit, Amazaurus or Eilon at their spot, idling; Rorit at her monitor. */
  function standing(who: Exclude<Member, 'Eter'>, t: number) {
    const rig = others[who];
    restRig(rig, feet.get(rig)!, t, { eyesOpen: 0.85 });
    rig.root.position.copy(SPOTS[who]);
    rig.root.rotation.y = 0;
    const atMonitor = t < CUE.gasp || (t >= CUE.grind[0] && t < CUE.year);
    if (who === 'Rorit') rig.head.rotation.y = atMonitor ? -0.5 : 0; // to her monitor, on her right
    // Amazaurus and Eilon are only in the chat: they don't speak
    rig.setMouth(who === 'Rorit' ? mouthAt(who, t) : 0);
  }

  /** One of the four, posed, and their phone when it's out. */
  function member(who: Member, t: number) {
    if (who === 'Eter') eterAtDesk(t);
    else standing(who, t);
    stress(who, t);
    const rig = rigs[who];
    const phone = phones[who];
    phone.group.visible = phoneOut(who, t);
    if (!phone.group.visible) return;
    const view = chatView(CHAT, t, who, START_CLOCK);
    phone.show(view);
    // Rorit's up by her eyes (we see it through them); the others' low, under their faces
    const low = who !== 'Rorit';
    holdPhone(rig, phone, t, {
      forward: low ? 1.0 : 0.8,
      up: low ? -0.7 : 0.2,
      grip: -0.3,
      typing: view.draft.length > 0,
    });
  }

  return {
    rigs,
    phones,
    lulu,
    update(t: number) {
      rorit.ponytail.rotation.set(0.1, 0, Math.sin(t * 2) * 0.05);
      for (const who of MEMBERS) member(who, t);
      // the email: Rorit's eyes go wider still
      const shock = t >= CUE.gasp && t < CUE.phoneOut + 1 ? SHOCK : 1;
      for (const e of others.Rorit.eyes) e.scale.multiplyScalar(shock);
      luluWalks(t);
    },
    /** For the phone close-ups: hide Rorit's head, the camera is where her eyes are. */
    hideRoritHead(hidden: boolean) {
      rigs.Rorit.head.visible = !hidden;
    },
  };
}
