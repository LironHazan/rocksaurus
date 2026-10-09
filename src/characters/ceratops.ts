import * as THREE from 'three';
import { plush, glossyEye, shine, blush, matte, ball, enableShadows } from './materials';
import { growTail } from './tail';
import { textTexture } from '../world/text-texture';
import { ROUND } from '../world/interior';
import type { CharacterRig } from './types';

export const SILVI_COLORS = {
  body: 0xffc79e, // peach
  belly: 0xfff3e6,
  spots: 0xf2a77a,
  shirt: '#ff6fa8', // pink, with white stripes
  stripes: '#ffffff',
  horn: 0xfff3e0,
  cheeks: 0xff7fa6,
  lips: 0xe0457b,
  eyes: 0x2fa86b, // green iris
  gold: 0xf5c451,
};

export interface CeratopsRig extends CharacterRig {
  /** Lulu-sized head anchor, scaled to this head, so Lulu's hair props (ponytail) fit. */
  face: THREE.Group;
  badge: THREE.Mesh;
}

/**
 * Silvi — the office's Fun & Wellbeing lead: a Protoceratops-style dinosaur (frill-less, so her ponytail shows)
 * with a little nose horn, long lashes, rosy lips and gold hoop earrings, in a pink shirt with white stripes and
 * her staff lanyard. Standing build like Paris's; same rig shape as the others. Hair goes on `face`.
 */
export function createCeratops(
  colors = SILVI_COLORS,
  { badge = 'SILVI', role = 'Fun & Wellbeing ✨' } = {},
): CeratopsRig {
  const M = {
    body: plush(colors.body),
    belly: plush(colors.belly),
    spot: plush(colors.spots),
    horn: plush(colors.horn),
    shirt: new THREE.MeshStandardMaterial({
      roughness: 0.8,
      map: textTexture(64, 256, (ctx, w, h) => {
        ctx.fillStyle = colors.shirt;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = colors.stripes;
        for (let i = 0; i < 9; i++) ctx.fillRect(0, (i + 0.35) * (h / 9), w, h / 9 / 3);
      }),
    }),
    eye: glossyEye(),
    shine: shine(),
    cheek: blush(colors.cheeks),
    dark: matte(0x3a1f2c),
    lips: new THREE.MeshPhysicalMaterial({ color: colors.lips, roughness: 0.3, clearcoat: 0.8 }),
    gold: new THREE.MeshStandardMaterial({ color: colors.gold, roughness: 0.25, metalness: 0.9 }),
  };

  const root = new THREE.Group();
  const squash = new THREE.Group();
  root.add(squash);
  const torso = new THREE.Group();
  squash.add(torso);
  torso.add(ball(1, M.body, [0, 1.25, 0], [0.88, 1.1, 0.85]));
  torso.add(ball(0.68, M.belly, [0, 1.15, 0.42], [1, 1.2, 0.55]));
  for (const [x, y, z, r] of [
    [0.4, 1.6, -0.6, 0.12],
    [-0.42, 1.35, -0.62, 0.1],
    [0.1, 1.0, -0.8, 0.11],
  ] as const)
    torso.add(ball(r, M.spot, [x, y, z], [1, 1, 0.35]));
  // the shirt: from the collar to the hips, over the body
  const shirt = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0.16 * Math.PI, 0.6 * Math.PI),
    M.shirt,
  );
  shirt.scale.set(0.88 * 1.04, 1.1 * 1.03, 0.85 * 1.04);
  shirt.position.y = 1.25;
  torso.add(shirt);

  const feet: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    torso.add(ball(0.46, M.body, [s * 0.5, 0.6, 0.02]));
    const foot = new THREE.Group();
    foot.position.set(s * 0.48, 0, 0.3);
    foot.add(ball(0.36, M.body, [0, 0.18, 0], [1, 0.6, 1.25]));
    for (let k = -1; k <= 1; k++) foot.add(ball(0.07, M.belly, [k * 0.12, 0.16, 0.43]));
    foot.userData.side = s;
    squash.add(foot);
    feet.push(foot);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 0.85, -0.72);
  tail.add(
    growTail(M.body, {
      spine: [
        [0, 0.35, 0.5],
        [0, 0.1, -0.3],
        [0, -0.2, -1.0],
        [0, -0.45, -1.6],
        [0, -0.55, -1.95],
      ],
      base: 0.5,
      tip: 0.05,
      taper: 1.2,
    }),
  );
  torso.add(tail);

  const arms: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.6, 1.75, 0.45);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.28, 8, 16), M.body);
    arm.position.y = -0.2;
    pivot.add(arm);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.24, 20), M.shirt);
    sleeve.position.y = -0.08;
    pivot.add(sleeve);
    pivot.userData.side = s;
    torso.add(pivot);
    arms.push(pivot);
  }

  // the lanyard: a ribbon around the neck down to a badge on her chest
  const ribbon = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.025, 6, 40, Math.PI * 1.15),
    new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.7 }),
  );
  ribbon.rotation.set(0.55, 0, -Math.PI * 0.075 - Math.PI / 2);
  ribbon.position.set(0, 1.98, 0.35);
  torso.add(ribbon);
  const badgeMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.56, 0.02),
    new THREE.MeshStandardMaterial({
      roughness: 0.5,
      map: textTexture(
        256,
        340,
        (ctx, w, h) => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#ff7a1a';
          ctx.fillRect(0, 0, w, h * 0.2);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `700 ${h * 0.08}px ${ROUND}`;
          ctx.fillText('PAPO PAKO', w / 2, h * 0.1);
          ctx.fillStyle = '#f7a8c4';
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.42, h * 0.13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1b1b22';
          ctx.font = `700 ${h * 0.11}px ${ROUND}`;
          ctx.fillText(badge, w / 2, h * 0.68);
          ctx.fillStyle = '#ff7a1a';
          ctx.font = `600 ${h * 0.065}px ${ROUND}`;
          ctx.fillText(role, w / 2, h * 0.84);
        },
        ['700 40px Fredoka'],
      ),
    }),
  );
  badgeMesh.position.set(0, 1.5, 0.92);
  badgeMesh.rotation.x = -0.18;
  torso.add(badgeMesh);

  torso.add(ball(0.42, M.body, [0, 2.15, 0.15], [1, 1.1, 1])); // neck
  const head = new THREE.Group();
  head.position.set(0, 2.6, 0.28);
  head.add(ball(0.5, M.body, [0, 0, 0], [1, 0.92, 1.05]));
  head.add(ball(0.3, M.body, [0, -0.16, 0.4], [0.8, 0.62, 0.95])); // snout
  head.add(ball(0.09, M.horn, [0, -0.1, 0.66], [0.9, 0.7, 0.9])); // the little beak tip
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 14), M.horn);
  horn.position.set(0, 0.1, 0.58);
  horn.rotation.x = 0.35;
  head.add(horn);
  for (const s of [-1, 1]) head.add(ball(0.016, M.dark, [s * 0.07, -0.08, 0.68], [1.2, 0.7, 0.6], 10));

  // Lulu's hair props are built for her head (radius 0.6): this anchor scales them to Silvi's
  const face = new THREE.Group();
  face.scale.setScalar(0.5 / 0.6);
  face.position.set(0, 0.04, -0.02);
  head.add(face);

  // lips: a rosy smile, or an open mouth
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.028, 8, 20, Math.PI), M.lips);
  smile.rotation.set(-0.3, 0, Math.PI);
  smile.position.set(0, -0.3, 0.56);
  head.add(smile);
  const mouth = new THREE.Group();
  mouth.position.set(0, -0.33, 0.56);
  mouth.add(ball(0.1, matte(0x3a1a2a), [0, 0, 0], [1.1, 0.9, 0.5]));
  mouth.add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 24), M.lips));
  mouth.visible = false;
  head.add(mouth);

  const eyes: THREE.Group[] = [];
  const cheeks: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.27, 0.13, 0.4);
    eye.rotation.y = s * 0.35;
    eye.add(
      ball(
        0.16,
        new THREE.MeshPhysicalMaterial({ color: colors.eyes, roughness: 0.15, clearcoat: 1 }),
        [0, 0, 0],
        [1, 1.1, 0.6],
      ),
    );
    eye.add(ball(0.09, M.eye, [0, -0.01, 0.06], [1, 1.1, 0.5]));
    eye.add(ball(0.05, M.shine, [0.05, 0.05, 0.1], [1, 1, 0.4], 12));
    eye.add(ball(0.022, M.shine, [-0.04, -0.05, 0.1], [1, 1, 0.4], 12));
    for (const th of [0.3, 0.65, 1.0, 1.35]) {
      const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.1, 4, 6), M.dark);
      lash.position.set(s * Math.cos(th) * 0.2, Math.sin(th) * 0.22, 0.02);
      lash.rotation.z = -s * (Math.PI / 2 - th);
      eye.add(lash);
    }
    head.add(eye);
    eyes.push(eye);
    const cheek = ball(0.11, M.cheek, [s * 0.36, -0.13, 0.4], [1, 0.7, 0.35]);
    head.add(cheek);
    cheeks.push(cheek);
    // a gold hoop under each ear
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 24), M.gold);
    hoop.position.set(s * 0.47, -0.22, 0.02);
    hoop.rotation.y = Math.PI / 2;
    head.add(hoop);
  }
  torso.add(head);
  enableShadows(root);

  return {
    root,
    squash,
    torso,
    head,
    eyes,
    cheeks,
    arms,
    feet,
    tail,
    face,
    badge: badgeMesh,
    setMouth(k) {
      smile.visible = k < 0.05;
      mouth.visible = k >= 0.05;
      mouth.scale.set(0.7 + 0.3 * k, 0.4 + k * 0.6, 1);
    },
    setFrown(on) {
      smile.rotation.z = on ? 0 : Math.PI;
    },
  };
}
