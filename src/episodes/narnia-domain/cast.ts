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
// her phone out; the four of them on the group chat; Eter waiting at her desk, sagging; Lulu walking over to her.

/** The phones: how tall (scene units), and when they're out: Rorit's from her gasp, the others' from her first message. */
const PHONE_HEIGHT = 0.6;
const PHONES_AWAY = CUE.chat[1];
/** How wide Rorit's eyes go at the email. */
const SHOCK = 1.35;
/** How far Eter's head sinks while she waits (radians), and how fast she drums her fingers (per second). */
const SAG = 0.5;
const DRUM_RATE = 14;
/** Lulu's walk over: a step (seconds) and how big. */
const LULU_STEP = 0.5;
const LULU_STRIDE = 0.8;
/** Eter turns her head to Lulu (radians) once she's there; Lulu turns to her. */
const TO_LULU = 0.9;

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
  const rigs: Record<Member, Pick<CharacterRig, 'root' | 'head' | 'arms'>> = { ...others, Eter: eter };
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

  /** Whether `who` has their phone out at t. */
  const phoneOut = (who: Member, t: number) =>
    t < PHONES_AWAY && t >= (who === 'Rorit' ? CUE.phoneOut : CHAT[0]!.at - 0.4);

  /** Eter at her desk: she waits, her head sinking, her fingers drumming on the desk; then she turns to Lulu. */
  function eterWaits(t: number) {
    const rig = eter;
    resetLulu(rig);
    rig.root.position.copy(SPOTS.Eter);
    rig.root.rotation.y = 0;
    const waited = t < CUE.lulu[1] ? ease(seg(t, CUE.wait[0], CUE.wait[1])) : 0;
    idleLulu(rig, t, { eyesOpen: 0.85, nod: waited * SAG });
    rig.setMouth(mouthAt('Eter', t));
    if (t >= CUE.wait[0] && t < CUE.lulu[1])
      armOf(rig, 1).rotation.x -= 0.6 + Math.max(0, Math.sin(t * DRUM_RATE)) * 0.15;
    if (t >= CUE.lulu[1]) rig.head.rotation.y = TO_LULU;
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
    if (who === 'Rorit') rig.head.rotation.y = t < CUE.gasp ? -0.5 : 0; // to her monitor, on her right
    // Amazaurus and Eilon are only in the chat: they don't speak
    rig.setMouth(who === 'Rorit' ? mouthAt(who, t) : 0);
  }

  /** One of the four, posed, and their phone when it's out. */
  function member(who: Member, t: number) {
    if (who === 'Eter') eterWaits(t);
    else standing(who, t);
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
      // the email: Rorit's eyes go wide
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
