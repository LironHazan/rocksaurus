import * as THREE from 'three';
import { seg, ease, lerp, rng } from '../../engine/math';
import type { Episode } from '../../engine/types';
import { cuts, direct, type Shot } from '../../engine/director';
import type { Vec3 } from '../../characters/types';
import { createParasaurolophus } from '../../characters/parasaurolophus';
import { idle, resetPose } from '../../characters/rory';
import { reachArm, releaseArm, armOf } from '../../characters/reach';
import { addGothOutfit } from '../../props/goth-outfit';
import { addFantasyGear, type Look } from '../../props/fantasy-gear';
import { textTexture } from '../../world/text-texture';
import { sungNotes, mouthOpenAt } from '../../audio/vowels';
import { ROUND } from '../../world/interior';
import { CAPTIONS } from './captions';
import { createStore, COUNTER, RACK, BOOTH } from './sets/store';
import { CUE, DURATION, TRY, TRY_AT, TRY_LEN, fitting, TRY_LOOKS } from './timeline';
import { soundtrack, vocal } from './music';

// Beat sheet (video seconds; see timeline.ts for the cues and captions.ts for the text)
//   0–3     the neon sign flickers on, the bell rings, Paris walks in
//   3–7.5   she browses the rack, sliding the hangers along, and pulls out a coat
//   7.5–22.5 three try-ons behind the fitting-room curtain: wizard, ranger, elf
//   22.5–27 checkout: she finds a ring in a bowl ("free with purchase"), the total is $6.66
//   27–34.5 she puts on everything and rolls a d20 for initiative: natural 20

const FACING_RIGHT = Math.PI / 2 - 0.25; // facing +x, turned a little toward the camera
const NOTES = sungNotes(vocal);

/** Where each look is first shown (the curtain opens), to time its pose. */
const REVEAL = new Map<Look, number>(TRY_LOOKS.map((name, i) => [name, TRY_AT[i]! + TRY.open[1]]));

/** A hanger pushed aside by a paw: moves away from it, and leans, the closer it is. */
const pushFrom = (d: number) => Math.sign(d) * 0.13 * Math.exp(-((d / 0.5) ** 2));
const leanFrom = (d: number) => -Math.sign(d) * 0.1 * Math.exp(-((d / 0.5) ** 2));

const backOut = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;
const pop = (t: number, at: number, len = 0.35) => (t < at ? 0 : t < at + len ? backOut((t - at) / len) : 1);
const dot = (color: number) =>
  textTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, `#${color.toString(16).padStart(6, '0')}`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

/** The shop sign's neon at t: sputters on, then burns steadily with a slow hum. */
function neonGlow(t: number): number {
  if (t < 0.35) return Math.sin(t * 90) > 0 ? 0.2 : 0.05;
  if (t < 0.6) return Math.sin(t * 70) > -0.3 ? 1 : 0.15;
  return 0.9 + 0.1 * Math.sin(t * 6);
}

const episode: Episode = {
  id: 'paris-rot-hotic',
  title: 'Paris Goes to Rot Hotic 🖤',
  duration: DURATION,
  captions: CAPTIONS,

  setup(stage) {
    const store = createStore();
    const scene = store.scene;
    stage.scene = scene; // this episode brings its own shop
    const RING_REST = store.till.ring.position.clone();

    const paris = createParasaurolophus();
    addGothOutfit(paris);
    const gear = addFantasyGear(paris);
    scene.add(paris.root);

    const v = new THREE.Vector3();
    const w = new THREE.Vector3();

    const coatSource = store.garments.at(-4)!.group; // the one she pulls off the rack
    const heldCoat = coatSource.clone();
    heldCoat.visible = false;
    scene.add(heldCoat);

    const d20 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({ color: 0x4b1f66, roughness: 0.35, metalness: 0.3, flatShading: true }),
    );
    d20.visible = false;
    d20.castShadow = true;
    scene.add(d20);
    const d20Light = new THREE.PointLight(0xffc83a, 0, 9, 1.6);
    scene.add(d20Light);
    const twenty = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: textTexture(
          256,
          256,
          (ctx, cw, ch) => {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `700 ${ch * 0.72}px ${ROUND}`;
            ctx.lineWidth = ch * 0.1;
            ctx.strokeStyle = '#3a1f4a';
            ctx.strokeText('20', cw / 2, ch / 2);
            ctx.fillStyle = '#ffd36b';
            ctx.fillText('20', cw / 2, ch / 2);
          },
          ['700 40px Fredoka'],
        ),
        transparent: true,
        depthTest: false,
      }),
    );
    twenty.visible = false;
    scene.add(twenty);

    const bag = new THREE.Group();
    const bagBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.0, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x0d0a12, roughness: 0.6 }),
    );
    bagBody.position.y = 0.5;
    const bagPrint = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.5),
      new THREE.MeshBasicMaterial({
        map: textTexture(
          256,
          180,
          (ctx, cw, ch) => {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${ch * 0.28}px 'Metal Mania', sans-serif`;
            ctx.fillStyle = '#ff6bd0';
            ctx.fillText('ROT', cw / 2, ch * 0.32);
            ctx.fillText('HOTIC', cw / 2, ch * 0.62);
            ctx.font = `${ch * 0.22}px sans-serif`;
            ctx.fillText('🦇', cw / 2, ch * 0.88);
          },
          ["40px 'Metal Mania'"],
        ),
        transparent: true,
        toneMapped: false,
      }),
    );
    bagPrint.position.set(0, 0.5, 0.231);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.02, 6, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x7b3fa0 }),
    );
    handle.position.y = 1.0;
    bag.add(bagBody, bagPrint, handle);
    bag.visible = false;
    scene.add(bag);

    const receipt = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 1.5).translate(0, 0.75, 0),
      new THREE.MeshBasicMaterial({
        map: textTexture(
          128,
          384,
          (ctx, cw, ch) => {
            ctx.fillStyle = '#f4efe2';
            ctx.fillRect(0, 0, cw, ch);
            ctx.fillStyle = '#16121c';
            ctx.textAlign = 'center';
            ctx.font = `700 ${ch * 0.055}px ${ROUND}`;
            [
              'ROT HOTIC',
              '',
              '1 x cloak',
              '1 x pointy hat',
              '1 x ears',
              '1 x ring *',
              '',
              'TOTAL  $6.66',
              '',
              'NO REFUNDS',
              'ONLY REGRETS',
            ].forEach((line, i) => ctx.fillText(line, cw / 2, ch * (0.1 + i * 0.075)));
          },
          ['700 40px Fredoka'],
        ),
        side: THREE.DoubleSide,
      }),
    );
    receipt.visible = false;
    scene.add(receipt);

    // sparkles for the magic moments: a pool of sprites replayed at each event
    const POOF_AT: { t: number; pos: Vec3; color: number }[] = [
      ...TRY_AT.map(s => ({ t: s + TRY.swap, pos: [BOOTH.x, 3.4, BOOTH.front + 0.3] satisfies Vec3, color: 0xc9a8ff })),
      { t: CUE.take[1] - 0.2, pos: [COUNTER.x - 1.3, 3.4, 1.5], color: 0xffc83a },
      { t: CUE.bag, pos: [COUNTER.x - 0.4, 2.7, 0.9], color: 0xff6bd0 },
      { t: CUE.poof, pos: [0.4, 2.2, 1.2], color: 0xff6bd0 },
      { t: CUE.nat20, pos: [0.1, 1.2, 3.2], color: 0xffc83a },
    ];
    const sprites = Array.from({ length: 26 }, () => {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: dot(0xffffff),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      s.visible = false;
      scene.add(s);
      return s;
    });
    const spray = rng(9);
    const dirs = sprites.map(() =>
      new THREE.Vector3(spray() - 0.5, spray() * 0.8 + 0.1, spray() - 0.5)
        .normalize()
        .multiplyScalar(0.8 + spray() * 1.4),
    );

    function sparkles(t: number) {
      const e = POOF_AT.find(p => t >= p.t && t < p.t + 1.1);
      sprites.forEach((s, i) => {
        s.visible = !!e;
        if (!e) return;
        const u = (t - e.t) / 1.1;
        s.position.set(e.pos[0], e.pos[1], e.pos[2]).addScaledVector(dirs[i]!, u * 1.6);
        s.position.y -= u * u * 0.9;
        s.scale.setScalar(0.5 * (1 - u) + 0.08);
        s.material.opacity = 1 - u;
        s.material.color.setHex(i % 3 === 0 ? 0xffffff : e.color);
      });
    }

    const A_LEFT = armOf(paris, 1); // local +x: her left (toward the rack when she faces +x)
    const A_RIGHT = armOf(paris, -1);

    /** Reaches a paw to a point in torso space, with the elbow bent outward. */
    function reach(side: -1 | 1, target: THREE.Vector3) {
      const pivot = side === 1 ? A_LEFT : A_RIGHT;
      const elbow = pivot.position.clone().lerp(target, 0.5);
      elbow.x += side * 0.3;
      elbow.y -= 0.15;
      reachArm(pivot, target, elbow);
    }
    const reachWorld = (side: -1 | 1, p: THREE.Vector3) => {
      paris.root.updateMatrixWorld(true);
      reach(side, paris.torso.worldToLocal(w.copy(p)));
    };
    const at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    /** A walking cycle: bob, alternate feet, sway, tail. */
    function walkCycle(phase: number, amount: number) {
      const p = Math.PI * phase;
      paris.root.position.y += Math.abs(Math.sin(p)) * 0.1 * amount;
      for (const f of paris.feet)
        f.position.y = Math.max(0, Math.sin(p + (f.userData.side > 0 ? 0 : Math.PI))) * 0.28 * amount;
      paris.torso.rotation.z = Math.sin(p) * 0.04 * amount;
      paris.tail.rotation.y = Math.sin(p) * 0.3 * amount;
      for (const a of paris.arms)
        a.rotation.x = -0.5 + Math.sin(p + (a.userData.side > 0 ? Math.PI : 0)) * 0.45 * amount;
    }

    function place(x: number, z: number, yaw: number) {
      paris.root.position.set(x, 0, z);
      paris.root.rotation.y = yaw;
    }

    /** The pose for each look once the curtain is open. `lp` = seconds since the reveal. */
    function pose(look: Look, lp: number) {
      const sway = Math.sin(lp * 2.2);
      paris.torso.rotation.z = sway * 0.04;
      paris.head.rotation.z = Math.sin(lp * 1.6) * 0.08;
      if (look === 'wizard') {
        reach(1, at(1.05, 1.95 + sway * 0.03, 0.55)); // leaning on the staff
        reach(-1, at(-1.05, 3.0 + Math.sin(lp * 5) * 0.15, 0.7)); // spell hand
        gear.setStaffGlow(0.6 + 0.4 * Math.sin(lp * 5));
        paris.setCrestGlow(0.5);
      } else if (look === 'ranger') {
        gear.sword.rotation.z = -0.2 + sway * 0.04;
        reach(1, at(0.95, 1.9, 0.75)); // sword up
        reach(-1, at(-1.0, 1.35, 0.1)); // other paw on the hip
        paris.head.rotation.x -= 0.1;
      } else if (look === 'elf') {
        const tap = Math.sin(lp * 9) * 0.07 * (lp < 1.6 ? 1 : 0); // wiggling the ears
        reach(1, at(0.8, 2.85 + tap, 0.35));
        reach(-1, at(-0.8, 2.85 - tap, 0.35));
        paris.head.rotation.z = Math.sin(lp * 3) * 0.12;
      } else if (look === 'party') {
        reach(1, at(1.05, 1.95, 0.55)); // staff
        gear.setStaffGlow(0.8 + 0.2 * Math.sin(lp * 6));
      }
    }

    function shopping(t: number): Shot {
      const [w0, w1] = CUE.walkIn;
      const [b0] = CUE.browse;
      const sliding = t >= b0 + 0.7 && t < CUE.pick;
      let x: number, z: number, yaw: number;
      if (t < w1) {
        // in through the door, walking right
        const k = seg(t, w0, w1);
        x = lerp(-9.8, -2.0, k);
        z = lerp(1.5, -1.0, ease(k));
        yaw = FACING_RIGHT;
        walkCycle(t * 2.2, t < w0 ? 0 : 1);
      } else {
        // turns to face the rack, side-steps along it, then turns round with her coat to show the camera
        const turn = ease(seg(t, b0, b0 + 0.7));
        const along = seg(t, b0 + 0.7, CUE.pick);
        const show = ease(seg(t, CUE.pick + 0.3, CUE.pick + 1.1));
        x = lerp(-2.0, -1.5, turn) + 3.5 * along;
        z = lerp(-1.0, -1.5, turn);
        yaw = show > 0 ? lerp(Math.PI, 2 * Math.PI - 0.4, show) : lerp(FACING_RIGHT, Math.PI, turn);
        walkCycle(t * 1.5, sliding ? 0.45 : 0);
      }
      place(x, z, yaw);
      paris.head.rotation.z = sliding ? Math.sin(t * 2.4) * 0.12 : 0;

      // both paws slide the hangers along as she goes (she faces the rack, so her left is world -x)
      const pawX = [x - 0.75, x + 0.75] as const;
      if (sliding) {
        pawX.forEach((px, i) => {
          v.set(px, 2.5 + Math.sin(t * 7 + i * 2) * 0.12, RACK.z + 0.3);
          reachWorld(i === 0 ? 1 : -1, v);
        });
      }
      for (const g of store.garments) {
        const push = sliding ? Math.max(...pawX.map(px => pushFrom(g.x - px))) : 0;
        const lean = sliding ? Math.min(...pawX.map(px => leanFrom(g.x - px))) : 0;
        g.group.position.x = g.x + push;
        g.group.rotation.z = lean;
      }

      // pulls a coat off the rack with her right paw and holds it up
      heldCoat.visible = false;
      if (t >= CUE.pick && t < CUE.browse[1]) {
        const grabX = x + 0.75;
        const nearest = store.garments.reduce((a, b) => (Math.abs(b.x - grabX) < Math.abs(a.x - grabX) ? b : a));
        nearest.group.visible = false;
        const pickK = ease(seg(t, CUE.pick, CUE.pick + 0.6));
        paris.root.updateMatrixWorld(true);
        const front = paris.torso.localToWorld(at(-0.95, 2.5, 1.0)); // up in front of her, on her right
        v.set(nearest.group.position.x, RACK.pole - 0.5, RACK.z + 0.3).lerp(front, pickK);
        heldCoat.visible = true;
        heldCoat.position.copy(v);
        heldCoat.rotation.y = yaw - Math.PI; // its front faces the same way she does
        heldCoat.scale.setScalar(lerp(1, 1.5, pickK));
        reachWorld(-1, v);
        reach(1, at(1.0, 1.35, 0.1)); // other paw on her hip
        paris.head.rotation.x -= 0.08 * pickK;
      } else for (const g of store.garments) g.group.visible = true;

      // camera: the sign, then following her in, then over her shoulder at the rack
      if (t < w0) return { cam: [-0.4, 6.8, 9.6], look: [-0.4, 7.2, -4] }; // the sign, big
      if (t < w1) {
        const k = seg(t, w0, w1);
        return { cam: [lerp(-6.4, -3.0, k), 3.0, 11], look: [x + 1.2, 2.2, 0] };
      }
      const k = seg(t, b0, CUE.browse[1]);
      return { cam: [x - 2.6, lerp(3.4, 3.0, k), lerp(4.2, 5.4, k)], look: [x + 0.9, 2.6, RACK.z + 0.6] };
    }

    function fittingRoom(t: number): Shot {
      const i = TRY_AT.filter(s => s <= t).length - 1;
      const s = TRY_AT[i]!;
      const local = t - s;
      const f = fitting(t);
      // she walks into the booth for the first try-on, then stays in it
      if (i === 0 && local < TRY.close[0]) {
        const k = ease(local / TRY.close[0]);
        place(lerp(-4.2, BOOTH.x, k), lerp(-1.4, -3.1, k), lerp(-Math.PI / 2 + 0.2, 0, k));
        walkCycle(t * 3.2, 1);
        paris.head.rotation.y = 0;
      } else {
        place(BOOTH.x, -3.1, 0);
        const look = f.look;
        const lp = Math.max(0, t - (REVEAL.get(look) ?? 0));
        if (look !== 'goth') pose(look, lp);
        const popK = look === 'goth' ? 1 : pop(t, REVEAL.get(look) ?? 0, 0.4);
        paris.root.scale.setScalar(popK > 1 ? 1 + (popK - 1) * 0.35 : 1);
      }
      const shaking = f.curtain < 1 ? Math.sin(t * 38) * 0.05 * (f.curtain < 0.05 ? 1 : 0.3) : 0;
      store.booth.setOpen(f.curtain, shaking);

      // the booth camera: a different angle for each look, pushing in after the curtain opens
      const push = ease(seg(local, TRY.open[0], TRY_LEN));
      const angles: Vec3[] = [
        [BOOTH.x, 2.9, 6.8],
        [BOOTH.x + 2.0, 2.7, 6.2],
        [BOOTH.x - 1.4, 2.7, 6.2],
      ];
      const from = angles[i]!;
      return {
        cam: [from[0], from[1], lerp(from[2], from[2] - 1.8, push)],
        look: [BOOTH.x + (i === 2 ? 0.3 : 0), 2.5, -3],
      };
    }

    function checkout(t: number): Shot {
      const ringWorld = store.till.bowl.localToWorld(RING_REST.clone());
      const arrive = seg(t, CUE.counter, CUE.counter + 0.9);
      const x = lerp(3.2, 5.1, ease(arrive));
      place(x, 0.9, FACING_RIGHT + 0.25);
      walkCycle(t * 2.2, arrive < 1 ? 1 : 0);

      // she spots the ring: head swings round to the bowl, eyes go wide, the ring glows
      const notice = ease(seg(t, CUE.notice, CUE.notice + 0.4));
      paris.head.rotation.y = -0.7 * notice;
      for (const e of paris.eyes) e.scale.set(1 + 0.25 * notice, 1 + 0.25 * notice, 1);
      const glow = ease(seg(t, CUE.notice, CUE.notice + 0.7));
      store.till.glow.intensity = 14 * glow;
      store.till.ring.material.emissiveIntensity = 0.6 + 2.2 * glow;
      store.till.ring.visible = t < CUE.total;

      // she takes it: the paw stretches to the bowl and lifts it
      const take = seg(t, CUE.take[0], CUE.take[1]);
      if (t >= CUE.take[0] - 0.2 && t < CUE.total) {
        const lift = ease(take);
        v.set(lerp(ringWorld.x, x + 0.9, lift), lerp(ringWorld.y, 3.2, lift), lerp(ringWorld.z, 1.7, lift));
        reachWorld(-1, v);
      }
      if (t >= CUE.take[0] && t < CUE.total) store.till.ring.position.copy(store.till.bowl.worldToLocal(w.copy(v)));
      else store.till.ring.position.copy(RING_REST);

      // the register: ka-ching
      const paid = t >= CUE.total;
      store.till.screens[0]!.visible = !paid;
      store.till.screens[1]!.visible = paid;
      if (t >= CUE.total - 0.25 && t < CUE.total + 0.6) {
        v.set(COUNTER.x - 0.1, store.till.topY + 0.75, 0);
        reachWorld(1, v);
      }
      paris.setCrestGlow(Math.max(glow * 0.6, 0));

      // receipt and bag
      const [r0, r1] = CUE.receipt;
      receipt.visible = t >= r0;
      if (receipt.visible) {
        receipt.position.set(COUNTER.x - 0.1, store.till.topY + 0.2, -0.5);
        receipt.rotation.y = -Math.PI / 2;
        receipt.scale.y = Math.max(0.01, ease(seg(t, r0, r1)));
      }
      bag.visible = t >= CUE.bag;
      bag.position.set(COUNTER.x - 0.45, store.till.topY + 0.05, 0.9);
      bag.scale.setScalar(pop(t, CUE.bag, 0.3));

      // camera
      // from the counter side, so you see her face, the bowl, and the register in front of her
      if (t < CUE.notice) return { cam: [8.4, 3.4, 8.6], look: [5.2, 2.5, 0.8] };
      if (t < CUE.total) {
        const k = ease(seg(t, CUE.notice, CUE.total));
        return { cam: [lerp(8.4, 8.2, k), lerp(3.4, 3.2, k), lerp(8.6, 6.8, k)], look: [lerp(5.2, 5.6, k), 2.6, 1.0] };
      }
      return { cam: [8.3, 3.3, 6.4], look: [5.4, 2.6, 0.4] };
    }

    function finale(t: number): Shot {
      store.till.ring.visible = false;
      receipt.visible = false;
      bag.visible = false;
      const px = 0.4,
        pz = 1.2;
      place(px, pz, 0);
      paris.head.rotation.x -= 0.05;

      // holding the shopping bag until she puts everything on
      const worn = t >= CUE.poof;
      if (!worn) {
        bag.visible = true;
        paris.root.updateMatrixWorld(true);
        v.set(px + 1.0, 1.1, pz + 0.7);
        bag.position.set(v.x - 0.05, v.y - 0.9, v.z);
        bag.scale.setScalar(1);
        reach(1, paris.torso.worldToLocal(w.set(v.x, v.y + 0.2, v.z)));
        paris.squash.scale.y = 1 + Math.sin(t * 9) * 0.015; // so excited
        paris.head.rotation.z = Math.sin(t * 4) * 0.1;
      } else {
        const lp = t - CUE.poof;
        const popK = pop(t, CUE.poof, 0.5);
        paris.root.scale.setScalar(1 + (popK - 1) * 0.3);
        pose('party', lp);
        paris.torso.rotation.z = 0;
      }

      // the d20: wound up in the right paw, thrown high, and it clatters down in front of her
      const thrown = t >= CUE.throw;
      d20.visible = worn && t >= CUE.poof + 0.8;
      d20Light.intensity = 0;
      if (d20.visible) {
        const wind = ease(seg(t, CUE.throw - 0.7, CUE.throw - 0.15)); // arm draws back
        const hand = at(-1.0, lerp(2.4, 3.3, wind), lerp(0.8, -0.1, wind));
        paris.root.updateMatrixWorld(true);
        if (!thrown) {
          reach(-1, hand);
          d20.position.copy(paris.torso.localToWorld(w.copy(hand)));
          d20.rotation.set(t * 2, t * 3, 0);
        } else {
          const tau = t - CUE.throw; // 0…
          const flight = CUE.land - CUE.throw;
          const start = paris.torso.localToWorld(at(-1.0, 3.3, -0.1));
          if (tau < flight) {
            const k = tau / flight;
            const apex = 0.55;
            const y =
              k < apex ? lerp(start.y, 6.4, 1 - (1 - k / apex) ** 2) : lerp(6.4, 0.34, ((k - apex) / (1 - apex)) ** 2);
            d20.position.set(lerp(start.x, 0.0, k), y, lerp(start.z, 3.0, k));
            reach(-1, at(-1.0, lerp(3.3, 3.9, ease(Math.min(1, k * 2))), 0)); // follow-through
          } else {
            const u = t - CUE.land; // bounces, then settles
            const b =
              u < 0.45
                ? Math.sin((Math.PI * u) / 0.45) * 0.8
                : u < 0.7
                  ? Math.sin((Math.PI * (u - 0.45)) / 0.25) * 0.25
                  : 0;
            d20.position.set(
              lerp(0.0, 0.15, ease(Math.min(1, u / 0.9))),
              0.34 + b,
              lerp(3.0, 3.35, ease(Math.min(1, u / 0.9))),
            );
          }
          const spin = (tau < flight ? 14 * tau : 14 * flight + 5 * (1 - Math.exp(-(tau - flight) * 3))) * 1;
          d20.rotation.set(spin * 0.9, spin * 0.6, spin * 0.3);
          d20Light.position.copy(d20.position);
        }
      }

      // natural 20
      const nat = t >= CUE.nat20;
      const natPop = pop(t, CUE.nat20, 0.5);
      twenty.visible = nat;
      if (nat) {
        twenty.position.set(0.15, 1.5, 3.35);
        twenty.scale.setScalar(1.5 * natPop);
        d20Light.position.set(0.15, 1.2, 3.3);
        d20Light.intensity = 30 * Math.exp(-(t - CUE.nat20) * 1.2);
        paris.setCrestGlow(1.6);
        gear.setStaffGlow(1);
        paris.head.rotation.x -= 0.3 * ease(seg(t, CUE.nat20, CUE.nat20 + 0.5));
        reach(-1, at(-1.1, 3.4, 0.4));
        paris.root.position.y = Math.abs(Math.sin((t - CUE.nat20) * 5)) * 0.18 * Math.exp(-(t - CUE.nat20) * 0.8);
        store.sign.setGlow(1.3);
      }

      if (t < CUE.poof) return { cam: [px + 0.2, 2.4, 8.8], look: [px, 2.2, 0.6] };
      if (t < CUE.throw) {
        const k = ease(seg(t, CUE.poof, CUE.throw));
        return { cam: [px, lerp(2.2, 2.0, k), lerp(8.4, 9.4, k)], look: [px, lerp(2.4, 3.0, k), 0.5] };
      }
      const k = ease(seg(t, CUE.nat20, DURATION));
      return { cam: [px + 0.1, lerp(2.0, 1.8, k), lerp(9.4, 7.4, k)], look: [px + 0.1, lerp(3.0, 2.6, k), 1.0] };
    }

    // One shop, four beats: the camera cuts between them, the scene stays.
    const director = direct(
      stage,
      {
        shopping: { scene, frame: shopping },
        fitting: { scene, frame: fittingRoom },
        checkout: { scene, frame: checkout },
        finale: { scene, frame: finale },
      },
      cuts([
        [0, 'shopping'],
        [TRY_AT[0], 'fitting'],
        [CUE.counter, 'checkout'],
        [CUE.finale, 'finale'],
      ]),
    );

    function update(t: number) {
      resetPose(paris);
      for (const a of paris.arms) releaseArm(a);
      paris.root.scale.setScalar(1);
      gear.sword.rotation.z = 0;
      gear.setStaffGlow(0.15);
      idle(paris, t, { eyesOpen: 1 });
      const open = mouthOpenAt(NOTES, t);
      paris.setMouth(open);
      paris.setCrestGlow(open);

      store.sign.setGlow(neonGlow(t));
      const door =
        t < CUE.door[1] ? seg(t, CUE.door[0], CUE.door[1]) : 1 - seg(t, CUE.walkIn[1] - 0.1, CUE.walkIn[1] + 0.6);
      store.entrance.setOpen(ease(Math.max(0, door)));

      const f = fitting(t);
      const look: Look = t < CUE.counter ? f.look : t < CUE.poof ? 'elf' : 'party';
      gear.setLook(look);

      director.update(t);
      if (t < TRY_AT[0] || t >= CUE.counter) store.booth.setOpen(1);
      sparkles(t);
    }

    return { update, dispose: director.dispose };
  },

  audio(bus, t0) {
    soundtrack(bus, t0);
  },
};

export default episode;
