import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { cuts, direct, type Shot } from '../../engine/director';
import { createLulu, idleLulu, reachLulu, resetLulu as resetLuluPose, walkLulu } from '../../characters/lulu';
import { createOrnithomimus, ORNITHO_SEAT } from '../../characters/ornithomimus';
import { createCeratops } from '../../characters/ceratops';
import { idle, resetPose } from '../../characters/rory';
import { armOf, reachArm, releaseArm } from '../../characters/reach';
import { addPonytail } from '../../props/ponytail';
import { addFlannel } from '../../props/flannel';
import { chatView, createPhone, pawsOnPhone, phonePov, placePhone } from '../../props/phone';
import { createProteinBar } from '../../props/protein-bar';
import { box, mat } from '../../world/interior';
import { textTexture } from '../../world/text-texture';
import { createHome } from '../../world/lulu-home';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { LULU_ENTER, LULU_HANDOFF, SEATS, STASH_TOP, UPRIGHT, createStash } from './sets';
import { BENCH, createCampus } from '../../world/campus';
import { CHAT, COLOURS, CUE, DURATION, LINES, START_CLOCK, mouthAt, speakerAt, type Member } from './timeline';
import { soundtrack } from './sound';

// Beat sheet (video seconds; see timeline.ts for the cues, the chat and the gossip, captions.ts for the text)
//   0–4.6    Lulu's flat, morning: heading for the door when her phone buzzes
//   4.6–15.6 the office group chat: Rorit's SOS (the gym, no protein bar), Silvi's kombucha, "say no more 💪"
//   15.6–21.6 Lulu's emergency protein stash: grabs one, holds it up like a trophy
//   21.6–25.6 the Papo Pako Shapeworks HQ, a long look with the birds singing
//   25.6–31.2 Lulu brings the bar to the bench; Rorit inhales it
//   31.2–49.2 the three of them on the bench, gossiping: the 3rd floor, the new VP, pizza Friday cancelled (gasp)
//   49.2–52  "Same time tomorrow?" Lulu: the office protein dealer
//   then the channel's end card (outro.ts)

type Where = 'home' | 'campus';
const where = cuts<Where>([
  [0, 'home'],
  [CUE.arrive[0], 'campus'],
]);

/** Where the three sit on the bench (z), and how high each one's hips are. */
const SIT_Z = BENCH.z + 0.35;
const HOME_SPOT = new THREE.Vector3(4.2, 0, 0.4); // where she stops when the phone buzzes
const DOOR_FROM = new THREE.Vector3(-1.6, 0, 0.8);
const STASH_SPOT = new THREE.Vector3(-2.1, 0, -0.6);
const STASH_YAW = -1.07; // facing the counter, and a little toward us
const HANDOFF_YAW = 1.0; // turned to Rorit, beside her on the bench (and three-quarters to us)
const RORIT_SCALE = 0.85; // small, but very fit

const episode: Episode = {
  id: 'office-besties',
  title: 'Office Besties 💅',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const { camera } = stage;

    const home = createHome();
    home.key.color.set(0xfff4e0);
    home.lamp.intensity = 0;
    home.kit.position.set(-0.4, 0, -2.6);
    home.window.visible = false;
    const morning = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.6),
      new THREE.MeshBasicMaterial({ color: 0xcfe8ff, toneMapped: false }),
    );
    morning.position.copy(home.window.position).add(new THREE.Vector3(0, 0, 0.04));
    morning.material.map = textTexture(64, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#7fbef5');
      g.addColorStop(1, '#fff1dc');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 2 - 1, 0, 2, h);
    });
    morning.material.color.set(0xffffff);
    home.scene.add(morning);
    const door = box(1.8, 3.8, 0.12, mat(0x2f6f73, 0.5));
    door.position.set(6.6, 0, -3.9);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), mat(0xf5c451, 0.3, { metalness: 0.8 }));
    knob.position.set(5.95, 1.9, -3.8);
    const doormat = box(2.2, 0.04, 1.2, mat(0x8a5a3a, 1));
    doormat.position.set(6.6, 0, -3.0);
    home.scene.add(door, knob, doormat);
    const stash = createStash();
    stash.group.position.set(-4.2, 1.75, -1.5);
    home.scene.add(stash.group);

    const campus = createCampus();
    const scenes: Record<Where, THREE.Scene> = { home: home.scene, campus: campus.scene };

    const lulu = createLulu();
    const hair = addPonytail(lulu);
    addFlannel(lulu);

    const rorit = createOrnithomimus();
    rorit.root.scale.setScalar(RORIT_SCALE);
    const roritHair = addPonytail(rorit, { color: 0xf2d36b, scrunchie: 0xc6ff3d, seed: 3 }); // blond
    const roritFeet = rorit.feet.map(f => f.position.clone());
    // her yoga mat, rolled up on the bench, and a water bottle
    const yogaMat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.5, 24), mat(0xc6ff3d, 0.8));
    yogaMat.rotation.z = Math.PI / 2;
    yogaMat.position.set(SEATS.rorit + 1.05, BENCH.top + 0.22, BENCH.z + 0.2);
    yogaMat.rotation.y = 0.5;
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 20), mat(0xff6f91, 0.3));
    bottle.position.set(SEATS.rorit + 0.9, 0, BENCH.z + 1.5);
    campus.scene.add(yogaMat, bottle);

    const silvi = createCeratops();
    const silviHair = addPonytail(silvi, { color: 0x15121a, scrunchie: 0xff6fa8, seed: 11 }); // straight, black
    const silviFeet = silvi.feet.map(f => f.position.clone());

    const phone = createPhone(
      { title: 'Office Besties 💅', subtitle: 'Rorit, Silvi, Lulu', colours: COLOURS, owner: 'Lulu' },
      { height: 0.75, colour: 0xff8fab },
    );
    home.scene.add(phone.group);
    const bar = createProteinBar(); // the one she brings

    const CAST: Record<Where, THREE.Object3D[]> = {
      home: [lulu.root, bar.group],
      campus: [lulu.root, bar.group, rorit.root, silvi.root],
    };
    for (const w of ['campus', 'home'] as const) for (const o of CAST[w]) scenes[w].add(o);

    function resetLulu() {
      resetLuluPose(lulu);
      hair.ponytail.rotation.set(0.1, 0, 0);
    }
    function resetRig(rig: Parameters<typeof resetPose>[0] & { arms: THREE.Group[] }, feet: THREE.Vector3[]) {
      resetPose(rig);
      rig.root.position.set(0, 0, 0);
      rig.squash.rotation.set(0, 0, 0);
      rig.feet.forEach((f: THREE.Object3D, i: number) => f.position.copy(feet[i]!));
      for (const arm of rig.arms) releaseArm(arm);
    }
    /** Lulu's walk cycle at `phase` (1 = one step). */
    const walk = (phase: number, amount = 1) => walkLulu(lulu, phase, amount, hair.ponytail);
    /** Any rig's paw to a world point. */
    function grip(arm: THREE.Object3D, world: THREE.Vector3) {
      reachArm(arm, arm.parent!.worldToLocal(world.clone()));
    }
    /**
     * Sits a rig on the bench at x, hips `hips` above the ground. Short legs: the feet stay attached under the
     * thighs and stick out over the edge of the seat (`forward`), swinging a little.
     */
    function sitDown(
      rig: { root: THREE.Group; feet: THREE.Object3D[] },
      x: number,
      hips: number,
      forward: number,
      t = 0,
    ) {
      rig.root.position.set(x, hips, SIT_Z);
      rig.feet.forEach((f, i) => {
        const swing = Math.sin(t * 2.4 + i * Math.PI) * 0.06;
        f.position.z += forward + swing;
        f.position.y += Math.max(0, swing) * 0.5;
      });
    }
    /** Holds the phone in both paws in front of her, screen up toward her face; thumbs tap while she types. */
    function holdPhone(t: number, typing: boolean) {
      lulu.root.updateMatrixWorld(true);
      placePhone(phone, lulu.arms, lulu.root.quaternion, lulu.head.getWorldPosition(new THREE.Vector3()), 1.15, 0.9);
      pawsOnPhone(phone, lulu.arms, t, { height: phone.height, grip: -0.62, spread: 0.4, typing });
    }
    /** Through Lulu's eyes (her head and neck hidden for the shot): the phone, close. */
    function pov(): Shot {
      lulu.head.visible = false;
      for (const s of lulu.neck) s.visible = false;
      return phonePov(phone, camera);
    }

    function homeScene(t: number): Shot {
      resetLulu();
      const reading = t >= CUE.door[1] && t < CUE.stash[0];
      idleLulu(lulu, t, { eyesOpen: 0.9, nod: reading && !(t >= CUE.reaction[0] && t < CUE.reaction[1]) ? 0.45 : 0 });
      stash.bar.group.visible = t < CUE.grab;
      bar.group.visible = t >= CUE.grab;
      bar.setOpen(0);
      bar.setEaten(0);
      phone.show(chatView(CHAT, t, 'Lulu', START_CLOCK));

      if (t < CUE.stash[0]) {
        // to the door, then the buzz: she stops, turns, gets her phone out
        const k = seg(t, 0.2, CUE.buzz);
        lulu.root.position.lerpVectors(DOOR_FROM, HOME_SPOT, ease(k));
        const turn = ease(seg(t, CUE.buzz + 0.3, CUE.buzz + 0.8));
        lulu.root.rotation.y = lerp(Math.PI / 2, 0.25, turn);
        if (t < CUE.buzz) walk((t - 0.2) / 0.35);
        const out = t >= CUE.buzz + 0.6;
        phone.group.visible = out;
        if (out) holdPhone(t, chatView(CHAT, t, 'Lulu', START_CLOCK).draft.length > 0);
        if (t >= CUE.buzz && t < CUE.buzz + 0.6) {
          for (const e of lulu.eyes) e.scale.set(1.2, 1.2, 1); // bzzz?
          lulu.head.rotation.y = Math.sin(t * 9) * 0.15;
        }
        if (t >= CUE.reaction[0] && t < CUE.reaction[1]) {
          // "Silvi. that is not protein": Lulu looks up from the phone. She's got this.
          for (const e of lulu.eyes) e.scale.y = 0.5;
          lulu.head.rotation.z = 0.12;
        }
        if (t < CUE.buzz) return { cam: [1.6, 4.8, 14], look: [1.6, 3.0, -1] };
        if (t < CUE.door[1]) {
          const c = ease(seg(t, CUE.buzz + 0.6, CUE.door[1]));
          return { cam: [lerp(1.6, 4.4, c), lerp(4.8, 5.2, c), lerp(14, 9.5, c)], look: [lerp(1.6, 4.2, c), 3.4, 0.4] };
        }
        if (t >= CUE.reaction[0] && t < CUE.reaction[1]) return { cam: [5.2, 4.8, 7.4], look: [4.4, 4.1, 0.6] };
        return pov();
      }

      // the stash: in, grab, and up it goes
      phone.group.visible = false;
      lulu.root.position.copy(STASH_SPOT);
      lulu.root.rotation.y = STASH_YAW;
      lulu.root.updateMatrixWorld(true);
      const top = stash.group.localToWorld(STASH_TOP.clone());
      const raised = ease(seg(t, CUE.grab + 0.3, CUE.raise));
      if (t < CUE.grab) {
        const reach = ease(seg(t, CUE.stash[0] + 0.3, CUE.grab));
        const rest = lulu.body.localToWorld(new THREE.Vector3(-0.8, 1.2, 0.6));
        reachLulu(lulu, -1, rest.lerp(top, reach));
        lulu.head.rotation.y = -0.4; // eyes on the stash
      } else {
        // the bar: from the bin to her paw, then held up high (and she's very pleased with herself)
        const high = lulu.body.localToWorld(new THREE.Vector3(-0.7, 3.7, 1.3));
        bar.group.position.lerpVectors(top, high, raised);
        // out of the crate on end, turning to lie across her paw
        const lifted = ease(seg(t, CUE.grab, CUE.grab + 0.4));
        bar.group.quaternion
          .setFromEuler(UPRIGHT)
          .slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, STASH_YAW, 0.3)), lifted);
        bar.group.updateMatrixWorld(true);
        reachLulu(lulu, -1, bar.group.localToWorld(new THREE.Vector3(-0.15, -0.05, 0)));
        lulu.setMouth(0.5 * raised);
        lulu.root.position.y += Math.abs(Math.sin((t - CUE.raise) * 6)) * 0.1 * seg(t, CUE.raise, CUE.raise + 0.2);
        lulu.head.rotation.y = lerp(-0.4, 0.1, raised);
      }
      const c = ease(seg(t, CUE.raise, CUE.stash[1]));
      return {
        cam: [lerp(-5.6, -5.2, c), lerp(4.4, 4.7, c), lerp(7.0, 6.2, c)],
        look: [-3.0, lerp(2.7, 3.1, c), -1.0],
      };
    }

    const SEATED = {
      Rorit: { x: SEATS.rorit },
      Silvi: { x: SEATS.silvi },
      Lulu: { x: SEATS.lulu },
    } as const;
    const headOf: Record<Member, THREE.Object3D> = { Rorit: rorit.head, Silvi: silvi.head, Lulu: lulu.head };
    const torsoOf: Record<Member, THREE.Object3D> = { Rorit: rorit.torso, Silvi: silvi.torso, Lulu: lulu.squash };

    /** While gossiping: the talker talks, the others turn to them and lean in. */
    function gossip(who: Member, t: number) {
      const speaker = speakerAt(t);
      const head = headOf[who];
      headOf[who === 'Lulu' ? 'Lulu' : who].rotation.y = 0;
      if (speaker && speaker !== who) {
        const dir = Math.sign(SEATED[speaker].x - SEATED[who].x);
        head.rotation.y += dir * 0.5;
        torsoOf[who].rotation.z -= dir * 0.1;
      } else if (speaker === who) head.rotation.y += Math.sin(t * 1.7) * 0.35; // looking from one to the other
      const m = mouthAt(who, t);
      if (who === 'Lulu') lulu.setMouth(m);
      else (who === 'Rorit' ? rorit : silvi).setMouth(m);
    }
    /** The collective gasp: back, eyes wide, mouths open; paws to cheeks. */
    const gaspAt = (t: number) =>
      t >= CUE.gasp ? Math.exp(-(t - CUE.gasp) * 1.6) * seg(t, CUE.gasp, CUE.gasp + 0.12) : 0;

    function campusScene(t: number): Shot {
      const gasp = gaspAt(t);
      const end = t >= CUE.end[0];

      // Rorit, on the bench: dying, then saved
      resetRig(rorit, roritFeet);
      idle(rorit, t, { eyesOpen: t < CUE.establish + 0.8 ? 0.35 : 1 });
      rorit.root.position.set(SEATED.Rorit.x, BENCH.top - (ORNITHO_SEAT - 0.05) * RORIT_SCALE, SIT_Z);
      rorit.dangleFeet(t * 3); // too small for the bench: her feet swing
      roritHair.ponytail.rotation.set(0.1, 0, 0);
      const dying = 1 - ease(seg(t, CUE.establish + 0.6, CUE.establish + 1.2));
      rorit.torso.rotation.x += 0.3 * dying;
      rorit.head.rotation.x += 0.35 * dying;
      // she leans in to take the bar, then sits back with it
      const leanIn = ease(seg(t, CUE.handoff[0] + 0.2, CUE.give)) * (1 - ease(seg(t, CUE.give + 0.3, CUE.give + 0.8)));
      rorit.torso.rotation.x += 0.45 * leanIn;
      rorit.root.updateMatrixWorld(true);
      const beak = rorit.head.localToWorld(new THREE.Vector3(0, -0.12, 0.75));

      // Silvi: pats her, then gossips
      resetRig(silvi, silviFeet);
      idle(silvi, t + 1.3, { eyesOpen: 1 });
      silviHair.ponytail.rotation.set(0.1, 0, 0);
      sitDown(silvi, SEATED.Silvi.x, BENCH.top - 0.12, 0.45, t);
      silvi.root.updateMatrixWorld(true);
      if (t < CUE.handoff[0]) {
        const pat = Math.abs(Math.sin(t * 5)) * 0.1;
        grip(armOf(silvi, -1), rorit.torso.localToWorld(new THREE.Vector3(0.45, 2.45 + pat, 0.1)));
        silvi.head.rotation.y = -0.5;
        silvi.setFrown(true);
      }

      // Lulu: walks in with the bar held high, hands it over, goes and sits down
      resetLulu();
      idleLulu(lulu, t, { eyesOpen: 0.9 });
      const seated = t >= CUE.seat[1] - 0.4;
      if (t < CUE.handoff[0]) {
        const k = seg(t, CUE.arrive[0], CUE.handoff[0] - 0.2);
        lulu.root.position.lerpVectors(LULU_ENTER, LULU_HANDOFF, k);
        lulu.root.rotation.y = Math.PI / 2;
        if (k < 1) walk((t - CUE.arrive[0]) / 0.35);
      } else if (t < CUE.seat[0]) {
        lulu.root.position.copy(LULU_HANDOFF);
        lulu.root.rotation.y = lerp(Math.PI / 2, HANDOFF_YAW, ease(seg(t, CUE.handoff[0], CUE.give)));
      } else if (!seated) {
        const k = ease(seg(t, CUE.seat[0], CUE.seat[1] - 0.6));
        lulu.root.position.lerpVectors(LULU_HANDOFF, new THREE.Vector3(SEATED.Lulu.x, 0, SIT_Z + 1.6), k);
        lulu.root.rotation.y = lerp(HANDOFF_YAW, 0, ease(seg(t, CUE.seat[0], CUE.seat[1] - 0.4)));
        walk((t - CUE.seat[0]) / 0.35, 1 - seg(t, CUE.seat[1] - 0.7, CUE.seat[1] - 0.4));
      }
      if (seated) {
        const drop = ease(seg(t, CUE.seat[1] - 0.4, CUE.seat[1]));
        sitDown(lulu, SEATED.Lulu.x, lerp(0, BENCH.top - 0.08, drop), 0.5 * drop, t + 1);
        lulu.root.position.z = lerp(SIT_Z + 1.6, SIT_Z, drop);
        lulu.tail.rotation.y = 0.9 * drop; // tucked to the side of the bench
      }
      lulu.root.updateMatrixWorld(true);

      // the bar: in Lulu's paw, then Rorit's; torn open; gone in four bites
      const given = ease(seg(t, CUE.give, CUE.give + 0.4));
      const opened = ease(seg(t, CUE.tear, CUE.tear + 0.25));
      const bites = Math.min(4, Math.floor((t - CUE.chomp[0]) / 0.38) + 1);
      const eaten = t < CUE.chomp[0] ? 0 : Math.min(1, bites / 4);
      bar.setOpen(opened);
      bar.setEaten(eaten);
      bar.group.visible = t < CUE.chomp[1] + 0.5;
      // held up proudly on the way in, then offered at chest height
      const offer = ease(seg(t, CUE.handoff[0], CUE.give - 0.1));
      const inLulus = lulu.body.localToWorld(
        new THREE.Vector3(lerp(0.3, 0.85, offer), lerp(2.4, 1.85, offer), lerp(1.2, 1.0, offer)),
      );
      const inRorits = rorit.torso.localToWorld(new THREE.Vector3(0.1, 2.5, 0.85));
      const atBeak = beak.clone().add(new THREE.Vector3(0.25, -0.05, 0.1));
      const bite = t >= CUE.chomp[0] && t < CUE.chomp[1] ? 1 : ease(seg(t, CUE.tear + 0.2, CUE.chomp[0]));
      bar.group.position
        .lerpVectors(inLulus, inRorits, given)
        .lerp(atBeak, bite * (1 - seg(t, CUE.chomp[1], CUE.chomp[1] + 0.3)));
      bar.group.rotation.set(0, 0, 0.25);
      bar.group.updateMatrixWorld(true);
      if (t < CUE.give + 0.4) reachLulu(lulu, 1, bar.group.localToWorld(new THREE.Vector3(-0.25, -0.05, 0)));
      if (t >= CUE.give - 0.25 && t < CUE.chomp[1] + 0.5) {
        // both paws on it
        for (const arm of rorit.arms)
          grip(arm, bar.group.localToWorld(new THREE.Vector3(arm.userData.side * 0.25, -0.06, 0.05)));
      } else if (t >= CUE.establish + 0.8 && t < CUE.give) {
        // gimme gimme: paws out, grabby
        for (const arm of rorit.arms)
          arm.rotation.set(-1.3 - Math.abs(Math.sin(t * 8)) * 0.2, 0, arm.userData.side * 0.3);
      }
      if (t >= CUE.chomp[0] && t < CUE.chomp[1]) {
        rorit.setMouth(Math.abs(Math.sin(((t - CUE.chomp[0]) / 0.38) * Math.PI)) * 0.9);
        for (const e of rorit.eyes) e.scale.y = 0.15;
      }
      if (t >= CUE.chomp[1] && t < CUE.gossip[0]) {
        // "Ugh. Legend." Paws up.
        for (const arm of rorit.arms) arm.rotation.set(-0.3, 0, arm.userData.side * 2.5);
        rorit.setMouth(0.6);
      }

      if (t >= CUE.gossip[0]) {
        for (const who of ['Rorit', 'Silvi', 'Lulu'] as const) gossip(who, t);
        const line = LINES.find(l => t >= l.from && t < l.to);
        if (line?.who === 'Rorit' && !end) {
          rorit.torso.rotation.z -= 0.15; // TELL ME
          rorit.root.position.y += Math.abs(Math.sin(t * 9)) * 0.08;
        }
        if (line?.who === 'Lulu') {
          // the death metal ballad: horns up, a little headbang
          const horns = armOf(lulu, 1);
          horns.rotation.set(-0.3, 0, 2.5);
          for (const s of lulu.neck) s.rotation.x += Math.abs(Math.sin(t * 8)) * 0.12;
          hair.ponytail.rotation.x = 0.1 + Math.abs(Math.sin(t * 8)) * 0.5;
        }
        if (line?.who === 'Silvi' && line.from === LINES[4]!.from) {
          // "Leave it to me": a little shoulder brush
          armOf(silvi, 1).rotation.set(-1.2, 0, 1.6);
          silvi.head.rotation.z = -0.15;
        }
        if (gasp > 0.01) {
          for (const who of ['Rorit', 'Silvi'] as const) {
            const rig = who === 'Rorit' ? rorit : silvi;
            rig.torso.rotation.x -= 0.2 * gasp;
            rig.setMouth(0.9 * gasp);
            for (const e of rig.eyes) e.scale.set(1 + 0.3 * gasp, 1 + 0.3 * gasp, 1);
            rig.root.updateMatrixWorld(true);
            for (const arm of rig.arms)
              grip(arm, rig.head.localToWorld(new THREE.Vector3(arm.userData.side * 0.42, -0.2, 0.3)));
          }
          lulu.squash.rotation.x -= 0.15 * gasp;
          for (const s of lulu.neck) s.rotation.x -= 0.12 * gasp;
          lulu.setMouth(0.9 * gasp);
          for (const e of lulu.eyes) e.scale.set(1 + 0.3 * gasp, 1 + 0.3 * gasp, 1);
        }
        if (end) {
          // Rorit: puppy eyes. Lulu: oh no. Silvi: can't keep a straight face.
          for (const e of rorit.eyes) e.scale.set(1.3, 1.3, 1);
          rorit.head.rotation.z = 0.25;
          rorit.root.updateMatrixWorld(true);
          for (const arm of rorit.arms)
            grip(arm, rorit.head.localToWorld(new THREE.Vector3(arm.userData.side * 0.1, -0.55, 0.35)));
          if (t >= CUE.end[0] + 1.2) {
            for (const e of lulu.eyes) e.scale.y = 0.45;
            lulu.head.rotation.y = -0.5;
            silvi.head.rotation.x = -0.25;
            silvi.setMouth(0.4 + Math.abs(Math.sin(t * 14)) * 0.4);
            silvi.root.position.y += Math.abs(Math.sin(t * 14)) * 0.05;
          }
        }
      }
      rorit.updateLegs(1);

      return campusShot(t);
    }

    function campusShot(t: number): Shot {
      const close = (who: Member, side = 0.6): Shot => {
        const h = headOf[who].getWorldPosition(new THREE.Vector3());
        return { cam: [h.x + side, h.y + 0.3, h.z + 5.2], look: [h.x, h.y - 0.35, h.z] };
      };
      if (t < CUE.establish) {
        const c = ease(seg(t, CUE.arrive[0], CUE.establish));
        return { cam: [lerp(2.5, 1, c), lerp(7, 6.2, c), lerp(32, 29, c)], look: [0, lerp(9.5, 8.2, c), -12] };
      }
      if (t < CUE.handoff[0]) return { cam: [3, 4.4, 14], look: [-2, 2.8, 2.0] };
      if (t < CUE.chomp[0]) return { cam: [2.8, 3.7, 9.2], look: [-1.0, 2.5, 2.4] }; // the two of them
      if (t < CUE.chomp[1] + 0.4) return { cam: [1.4, 3.6, 6.2], look: [SEATS.rorit, 3.0, 1.7] };
      const three: Shot = { cam: [0, 4.7, 15.5], look: [0, 3.4, 1.5] };
      if (t < CUE.gossip[0] + 0.2) return three;
      // the gasp: a quick push in on all three
      if (t >= CUE.gasp && t < CUE.gasp + 1.8) {
        const c = ease(seg(t, CUE.gasp, CUE.gasp + 0.3));
        return { cam: [0, lerp(4.7, 4.4, c), lerp(15.5, 12.5, c)], look: [0, 3.4, 1.5] };
      }
      // the end: Rorit's puppy eyes, then pull back to the whole campus
      if (t >= CUE.end[0]) {
        if (t < CUE.end[0] + 1.2) return close('Rorit', 0.4);
        const c = ease(seg(t, CUE.end[0] + 1.2, CUE.end[1]));
        return {
          cam: [lerp(0, 1, c), lerp(4.7, 7, c), lerp(15.5, 32, c)],
          look: [0, lerp(3.4, 8, c), lerp(1.5, -10, c)],
        };
      }
      // each line: the three of them, then a close-up on whoever's talking (Lulu's from low: she's huge)
      const line = LINES.find(l => t >= l.from && t < l.to);
      if (line && t >= line.from + 0.9) {
        if (line.who === 'Lulu') return { cam: [SEATS.lulu - 1.0, 2.2, 8.0], look: [SEATS.lulu - 0.2, 3.8, 1.5] };
        return close(line.who, line.who === 'Rorit' ? -0.5 : 0.5);
      }
      return three;
    }

    const director = direct(
      stage,
      {
        home: { scene: scenes.home, cast: CAST.home, frame: homeScene },
        campus: { scene: scenes.campus, cast: CAST.campus, frame: campusScene },
      },
      where,
    );

    return {
      update(t) {
        lulu.head.visible = true;
        for (const s of lulu.neck) s.visible = true;
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
