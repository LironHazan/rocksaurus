import * as THREE from 'three';
import { ease, lerp, seg } from '../../engine/math';
import { disposeObject } from '../../engine/dispose';
import type { Episode } from '../../engine/types';
import { idle, resetPose } from '../../characters/rory';
import { armOf, reachArm, releaseArm } from '../../characters/reach';
import { SEAT_HEIGHT } from '../../props/furniture';
import { chatView, createPhone, holdPhone, phonePov } from '../../props/phone';
import { createBassist } from '../../band/bassist';
import { createDrummer } from '../../band/drummer';
import { createGuitarist } from '../../band/guitarist';
import { beatPulse } from '../../band/timing';
import { withOutro } from '../outro';
import { CAPTIONS } from './captions';
import { createInjuredTiki, createOmli, createParis, createSteggy } from './cast';
import { BASS, DRUMS, GUITAR, luluPlays, omliPlays, roryPlays } from './music';
import { BENCH_TOP, OMLI_ENTER, OMLI_SPOT, PLOT, createAuditionStage, createDumbbell, createGym } from './sets';
import { BPM, CHAT, COLOURS, CUE, DURATION, MUSIC_AT, START_CLOCK, mouthAt, type Who } from './timeline';
import { soundtrack } from './sound';

// Beat sheet (video seconds; timeline.ts has the cues, the chat and the lines, music.ts the song)
//   0–15     Omli's home gym: curls; his phone buzzes. Lulu's DM: Tiki Taka broke his arm, gig next week, audition
//            tomorrow? · Omli: "say less 🤘" · "bring the muscles 💪😂". He flexes.
//   15–17.5  the stage: Omli walks on with his bass, PANTERA tee, all muscle
//   17.5–39  the audition: Omli alone (the band's jaws drop, Tiki in his sling 😬) · Lulu joins on drums · Rory
//   39–41.4  the last hit; Omli flexes
//   41.4–47  Rory: "You're IN!" · Tiki: "…temporarily. 😤"
//   then the channel's end card (outro.ts)

type Vec = readonly [number, number, number];
interface Shot {
  cam: Vec;
  look: Vec;
}
type Where = 'gym' | 'stage';
const where = (t: number): Where => (t < CUE.audition[0] ? 'gym' : 'stage');
const BEAT = 60 / BPM;

const episode: Episode = {
  id: 'omli-audition',
  title: 'The Audition 🤘',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const { camera } = stage;
    const gym = createGym();
    const venue = createAuditionStage();
    const scenes: Record<Where, THREE.Scene> = { gym: gym.scene, stage: venue.scene };

    // ── the cast ───────────────────────────────────────────────
    const tiki = createInjuredTiki();
    const tikiFeet = tiki.feet.map(f => f.position.clone());
    // Omli at home (a second Omli plays the audition, bass and all)
    const lifter = createOmli();
    const dumbbell = createDumbbell();
    const phone = createPhone(
      { title: 'Lulu 🥁', subtitle: 'online', colours: COLOURS, owner: 'Omli' },
      { height: 0.9, colour: 0x15151a },
    );
    gym.scene.add(lifter.root, dumbbell, phone.group);

    const omli = createBassist(BASS, { beat: BEAT, activity: omliPlays }, { rig: createOmli(), bassColour: 0x15151a });
    const lulu = createDrummer(DRUMS, { beat: BEAT, activity: luluPlays });
    const rory = createGuitarist(GUITAR, { beat: BEAT, activity: roryPlays });
    const paris = createParis();
    const steggy = createSteggy();
    for (const [p, spot] of [
      [lulu.root, PLOT.drums],
      [rory.root, PLOT.rory],
      [paris.root, PLOT.paris],
      [steggy.root, PLOT.steggy],
    ] as const) {
      p.position.set(spot.x, spot.y, spot.z);
      p.rotation.y = spot.ry;
      venue.scene.add(p);
    }
    venue.scene.add(omli.root);

    const CAST: Record<Where, THREE.Object3D[]> = { gym: [], stage: [tiki.root] };
    let current: Where | null = null;
    const v = new THREE.Vector3();

    /** Tiki, sitting: hips on the seat, feet forward, the broken arm in its sling. */
    function seatTiki(x: number, z: number, yaw: number) {
      resetPose(tiki);
      tiki.feet.forEach((f, i) => f.position.copy(tikiFeet[i]!));
      for (const a of tiki.arms) releaseArm(a);
      tiki.root.position.set(x, SEAT_HEIGHT - 0.2, z);
      tiki.root.rotation.y = yaw;
      for (const f of tiki.feet) f.position.z += 0.45;
    }
    /** A T-Rex can't frown: droopy eyes and a hung head instead. */
    function glum() {
      for (const e of tiki.eyes) e.scale.y = Math.min(e.scale.y, 0.55);
      tiki.head.rotation.x += 0.18;
    }
    const talk = (rig: { setMouth(k: number): void }, who: Who, t: number, rest = 0) =>
      rig.setMouth(Math.max(rest, mouthAt(who, t)));

    // ── Omli's home gym ─────────────────────────────────────────
    const curlArm = armOf(lifter, 1);
    function gymScene(t: number): Shot {
      resetPose(lifter);
      for (const a of lifter.arms) releaseArm(a);
      idle(lifter, t, { eyesOpen: 1 });
      lifter.root.position.copy(OMLI_SPOT);
      lifter.root.rotation.y = 0;
      lifter.root.updateMatrixWorld(true);
      const view = chatView(CHAT, t, 'Omli', START_CLOCK);
      phone.show(view);
      if (t < CUE.pickUp) {
        // curls: tiny arm, massive bicep; the phone on the bench, buzzing at the DM
        const curl = (1 - Math.cos(t * 3)) / 2;
        const paw = lifter.posture.localToWorld(new THREE.Vector3(0.78, 1.45 + curl * 0.5, 0.95 + curl * 0.3));
        reachArm(curlArm, curlArm.parent!.worldToLocal(paw.clone()));
        dumbbell.position.copy(paw);
        dumbbell.rotation.set(0, 0, 0);
        lifter.setMouth(0.15 + curl * 0.3); // effort
        const buzz = t >= CUE.buzz ? Math.sin(t * 90) * 0.02 : 0;
        phone.group.position.set(BENCH_TOP.x + buzz, BENCH_TOP.y + 0.03, BENCH_TOP.z);
        phone.group.rotation.set(-Math.PI / 2, 0, 0.4 + buzz * 3);
      } else {
        dumbbell.position.set(1.2, 0.22, 1.6); // down it goes
        dumbbell.rotation.set(0, 0.5, 0);
        if (t < CUE.flex) {
          holdPhone(lifter, phone, t, { forward: 1.1, up: -0.1, typing: view.draft.length > 0 });
          lifter.head.rotation.x += 0.3;
        } else {
          // done typing: the phone goes down, both biceps go up
          phone.group.position.set(BENCH_TOP.x, BENCH_TOP.y + 0.03, BENCH_TOP.z);
          phone.group.rotation.set(-Math.PI / 2, 0, 0.4);
          for (const arm of lifter.arms)
            reachArm(arm, arm.position.clone().add(v.set((arm.userData.side as number) * 0.45, 0.45, 0.25)));
          lifter.setMouth(0.6);
        }
      }
      const grinning = t >= CUE.grin[0] && t < CUE.grin[1];
      if (grinning) {
        lifter.setMouth(0.5);
        for (const e of lifter.eyes) e.scale.y = 0.5;
        lifter.head.rotation.x -= 0.3;
      }
      if (t < CUE.buzz) return { cam: [1.4, 4.0, 10.5], look: [0.2, 2.6, 0.6] };
      if (t < CUE.pov) return { cam: [-0.6, 3.6, 7.5], look: [-1.2, 2.2, 0.8] }; // the buzz
      if (grinning) return { cam: [0.6, 4.0, 6.0], look: [0, 3.5, 0.8] };
      if (t < CUE.flex) {
        lifter.head.visible = false;
        return phonePov(phone, camera);
      }
      return { cam: [0.4, 3.6, 8.5], look: [0, 2.8, 0.8] };
    }

    // ── the audition ───────────────────────────────────────────
    function stageScene(t: number): Shot {
      const song = t - MUSIC_AT;
      const playing = t >= MUSIC_AT && t < CUE.lastHit + 0.3;
      const hit = playing ? beatPulse(song, BEAT) : 0;
      venue.lights.pulse(t >= CUE.lastHit ? Math.max(0.6, 1 - (t - CUE.lastHit) * 0.5) : playing ? hit * 0.8 : 0.15);

      // Omli: walks on, plays, then flexes
      omli.update(song);
      const walk = seg(t, CUE.enter, MUSIC_AT - 0.3);
      omli.root.position.lerpVectors(OMLI_ENTER, new THREE.Vector3(PLOT.omli.x, 0, PLOT.omli.z), walk);
      omli.root.rotation.y = walk < 1 ? -Math.PI / 2 + 0.4 : 0;
      if (walk < 1) {
        omli.root.position.y = Math.abs(Math.sin(t * 7)) * 0.12;
        for (const f of omli.rig.feet)
          f.position.y = Math.max(0, Math.sin(t * 7 + (f.userData.side > 0 ? 0 : Math.PI))) * 0.3;
      } else omli.root.position.y = 0;
      if (t >= CUE.lastHit + 0.4) {
        // the flex: tiny arms, massive biceps
        omli.rig.root.updateMatrixWorld(true);
        for (const arm of omli.rig.arms) {
          const side = arm.userData.side as number;
          reachArm(arm, arm.position.clone().add(v.set(side * 0.45, 0.45, 0.25)));
        }
        omli.rig.setMouth(0.6);
      }

      lulu.update(song);
      rory.update(song);
      if (t >= CUE.verdict[0]) talk(rory.rig, 'Rory', t);

      // Paris and Steggy, watching: jaws drop, then they can't help headbanging
      const solo = t >= MUSIC_AT && t < CUE.drumsIn;
      for (const [rig, k] of [
        [paris, 0],
        [steggy, 1],
      ] as const) {
        resetPose(rig);
        idle(rig, t + k, { eyesOpen: 1 });
        if (solo) {
          rig.setMouth(0.7);
          for (const e of rig.eyes) e.scale.set(1.3, 1.3, 1);
        } else if (playing) rig.head.rotation.x += hit * 0.3;
        if (t >= CUE.lastHit + 0.3 && t < CUE.verdict[0]) {
          for (const a of rig.arms) a.rotation.set(-0.3, 0, a.userData.side * 2.5);
          rig.setMouth(0.6);
        }
      }
      paris.setCrestGlow(playing ? hit : 0);

      // Tiki in his chair, arm in the sling: 😬, then a grudging nod, then "…temporarily."
      seatTiki(PLOT.tiki.x, PLOT.tiki.z, PLOT.tiki.ry);
      idle(tiki, t, { eyesOpen: 1 });
      tiki.head.visible = true;
      if (solo || t >= CUE.verdict[0]) glum();
      else if (playing) tiki.head.rotation.x += hit * 0.12;
      if (solo) for (const e of tiki.eyes) e.scale.y = 0.6;
      talk(tiki, 'Tiki Taka', t);

      // ── shots ──
      const d = PLOT.drums,
        g = PLOT.rory,
        o = PLOT.omli;
      if (t < MUSIC_AT) return { cam: [0, 4.6, 15.5], look: [0, 2.6, 0] };
      if (t < MUSIC_AT + 3) return { cam: [1.4, 3.6, 7.2], look: [o.x, 3.0, o.z] };
      if (t < MUSIC_AT + 5) return { cam: [2.0, 3.6, 9.5], look: [5.0, 2.8, 1.8] }; // 😳
      if (t < CUE.drumsIn) return { cam: [-3.0, 3.4, 9.0], look: [PLOT.tiki.x, 2.6, PLOT.tiki.z] }; // 😬
      if (t < CUE.drumsIn + 3.6) return { cam: [d.x - 0.6, 4.6, d.z + 6.2], look: [d.x, 3.8, d.z] };
      if (t < CUE.guitarIn) return { cam: [0, 4.4, 15], look: [0, 2.5, 0] };
      if (t < CUE.guitarIn + 3.2) return { cam: [g.x + 1.4, 2.8, g.z + 4.6], look: [g.x, 2.2, g.z] };
      if (t < CUE.lastHit) {
        const p = ease(seg(t, CUE.guitarIn + 3.2, CUE.lastHit));
        return { cam: [lerp(-7, 7, p), 4.4, lerp(12, 13, p)], look: [0, 2.4, 0] };
      }
      if (t < CUE.verdict[0]) return { cam: [0.9, 3.3, 7.4], look: [o.x, 3.1, o.z] }; // the flex
      if (t < CUE.verdict[0] + 2.4) return { cam: [g.x + 1.4, 2.9, g.z + 4.8], look: [g.x, 2.3, g.z] };
      return { cam: [PLOT.tiki.x + 2.6, 3.4, PLOT.tiki.z + 5.2], look: [PLOT.tiki.x, 2.6, PLOT.tiki.z] };
    }

    function update(t: number) {
      camera.up.set(0, 1, 0);
      tiki.head.visible = lifter.head.visible = true;
      const here = where(t);
      if (here !== current) {
        for (const o of CAST[here]) scenes[here].add(o);
        stage.scene = scenes[here];
        current = here;
      }
      const shot = here === 'gym' ? gymScene(t) : stageScene(t);
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
