import * as THREE from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { ball, enableShadows } from '../characters/materials';
import { lerp } from '../engine/math';
import type { CharacterRig, Ellipsoid } from '../characters/types';
import { textTexture } from '../world/text-texture';

const JERSEY_FONT = "'Bungee'";

/** Tiki Taka's T-rex body, as the jersey wraps it (the posture group's space). */
export const TREX_BODY: Ellipsoid = { center: [0, 1.45, 0], radii: [1, 1.25, 1.05] };

/** The daycare dads' home kit: all white, sponsored by the daycare. Tiki wears it with RONALDO 7 on the back. */
export const HOME_KIT = {
  color: 0xffffff,
  trim: 0x1b1b22,
  ink: '#1b1b22',
  style: { sponsor: 'LITTLE ROARS', accent: '#1b1b22', badge: '#d9b44a' },
};

export interface JerseyOptions {
  color: number;
  /** Collar, cuffs and the shorts' stripe. */
  trim: number;
  shorts?: number;
  /** Colour of the printed number and name. */
  ink?: string;
  /** Printed big on the back and small on the chest. */
  number?: string;
  /** Printed across the shoulders on the back. */
  name?: string;
  /**
   * A pro-style home shirt: a faint woven pattern, a V-neck, a stripe over each shoulder, a sponsor across the
   * chest and a small round badge. Plain shapes and our own text only — no real crests or brand marks.
   */
  style?: { sponsor: string; accent: string; badge: string };
}

/**
 * Paints the shirt's own texture. The shell is a sphere band, so u runs round the body (front at u = 0.25,
 * the sides at 0 and 0.5) and v from the neck (top of the canvas) to the hem.
 */
function shirtTexture(base: string, { sponsor, accent, badge }: NonNullable<JerseyOptions['style']>) {
  return textTexture(
    1024,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      // faint woven pattern: little offset chevrons
      ctx.fillStyle = 'rgba(30, 30, 50, 0.07)';
      for (let y = 0, row = 0; y < h; y += 14, row++)
        for (let x = (row % 2) * 8; x < w; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 6, y + 5);
          ctx.lineTo(x, y + 10);
          ctx.lineTo(x + 3, y + 5);
          ctx.fill();
        }
      // a stripe from the collar over each shoulder and down the side
      ctx.fillStyle = accent;
      const band = w * 0.026;
      for (const u of [0, 0.5, 1]) ctx.fillRect(u * w - band / 2, 0, band, h * 0.5);
      // V-neck: a dark edge round a white V
      const front = w * 0.25;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = accent;
      ctx.lineWidth = h * 0.05;
      ctx.beginPath();
      ctx.moveTo(front - w * 0.06, 0);
      ctx.lineTo(front, h * 0.17);
      ctx.lineTo(front + w * 0.06, 0);
      ctx.stroke();
      ctx.strokeStyle = base;
      ctx.lineWidth = h * 0.022;
      ctx.stroke();
      // sponsor across the chest
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // two lines, low on the belly (a dinosaur's head hides the top of the chest), kept to the front of the body
      sponsor.split(' ').forEach((line, i) => {
        let size = h * (i ? 0.075 : 0.09);
        ctx.font = `${size}px ${JERSEY_FONT}, Impact, sans-serif`;
        const width = ctx.measureText(line).width;
        if (width > w * 0.17) size *= (w * 0.17) / width;
        ctx.font = `${size}px ${JERSEY_FONT}, Impact, sans-serif`;
        ctx.fillText(line, front, h * (0.6 + i * 0.1));
      });
      // the crest on the left chest, in the royal style: a crown over a gold ring, a sash and a monogram
      const bx = front + w * 0.06,
        by = h * 0.47,
        r = h * 0.06;
      const gold = badge,
        dark = '#8a6a1f';
      // crown: a jewelled band and three arches topped with pearls
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(bx - r * 0.85, by - r * 1.15);
      ctx.lineTo(bx - r * 0.95, by - r * 1.9);
      ctx.lineTo(bx - r * 0.45, by - r * 1.5);
      ctx.lineTo(bx, by - r * 2.15);
      ctx.lineTo(bx + r * 0.45, by - r * 1.5);
      ctx.lineTo(bx + r * 0.95, by - r * 1.9);
      ctx.lineTo(bx + r * 0.85, by - r * 1.15);
      ctx.closePath();
      ctx.fill();
      for (const dx of [-0.95, 0, 0.95]) {
        ctx.beginPath();
        ctx.arc(bx + dx * r, by - r * (dx ? 1.98 : 2.25), r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#c8283a';
      for (const dx of [-0.45, 0.45]) {
        ctx.beginPath();
        ctx.arc(bx + dx * r, by - r * 1.3, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      // the roundel, with a blue sash from top right to bottom left
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.clip();
      ctx.strokeStyle = '#3157c4';
      ctx.lineWidth = r * 0.42;
      ctx.beginPath();
      ctx.moveTo(bx + r, by - r);
      ctx.lineTo(bx - r, by + r);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = gold;
      ctx.lineWidth = r * 0.24;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.stroke();
      // our own monogram: LR, for Little Roars
      ctx.font = `700 ${r * 0.95}px 'Cinzel', Georgia, serif`;
      ctx.lineWidth = r * 0.12;
      ctx.strokeStyle = dark;
      ctx.strokeText('LR', bx, by + r * 0.05);
      ctx.fillStyle = gold;
      ctx.fillText('LR', bx, by + r * 0.05);
    },
    [`40px ${JERSEY_FONT}`, "700 40px 'Cinzel'"],
  );
}

/** Prints a texture onto the shirt shell, projected from the front (or back) of the body. */
function print(
  shell: THREE.Mesh,
  parent: THREE.Object3D,
  at: THREE.Vector3,
  back: boolean,
  size: THREE.Vector3,
  map: THREE.Texture,
) {
  // DecalGeometry works in world space: project there, then bring the result back into the parent's space
  parent.updateWorldMatrix(true, false);
  const q = parent.getWorldQuaternion(new THREE.Quaternion());
  if (back) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
  const geometry = new DecalGeometry(
    shell,
    parent.localToWorld(at.clone()),
    new THREE.Euler().setFromQuaternion(q),
    size,
  );
  geometry.applyMatrix4(parent.matrixWorld.clone().invert());
  const decal = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.8,
    }),
  );
  parent.add(decal);
}

const lettering = (text: string, ink: string, w: number, h: number) =>
  textTexture(
    w,
    h,
    (ctx, cw, ch) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = ch * 0.86;
      ctx.font = `${size}px ${JERSEY_FONT}, Impact, sans-serif`;
      const width = ctx.measureText(text).width;
      if (width > cw * 0.94) size *= (cw * 0.94) / width;
      ctx.font = `${size}px ${JERSEY_FONT}, Impact, sans-serif`;
      ctx.fillStyle = ink;
      ctx.fillText(text, cw / 2, ch / 2);
    },
    [`40px ${JERSEY_FONT}`],
  );

/**
 * A football kit: a shirt over the upper body (with sleeves on the arms), shorts round the hips, and an
 * optional number and name printed on the back. `parent` is the group the body ellipsoid lives in. Plain
 * lettering only — no club crests.
 */
export function addJersey(
  rig: CharacterRig,
  parent: THREE.Object3D,
  body: Ellipsoid,
  { color, trim, shorts = 0xffffff, ink = '#1b1b2e', number, name, style }: JerseyOptions,
): THREE.Group {
  const kit = new THREE.Group();
  parent.add(kit);
  const [cx, cy, cz] = body.center;
  const [rx, ry, rz] = body.radii;
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  const shirtMat = style
    ? new THREE.MeshStandardMaterial({
        map: shirtTexture(`#${new THREE.Color(color).getHexString()}`, style),
        roughness: 0.7,
      })
    : cloth;
  const trimMat = new THREE.MeshStandardMaterial({ color: trim, roughness: 0.7 });

  const fit = 1.1; // roomy, over any bumps on the skin
  const shirtGeo = new THREE.SphereGeometry(1, 56, 36, 0, Math.PI * 2, Math.PI * 0.08, Math.PI * 0.56);
  // below the belly a loose shirt doesn't follow the body back in: it hangs nearly straight, in soft folds
  const sp = shirtGeo.attributes.position!;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i),
      y = sp.getY(i),
      z = sp.getZ(i);
    if (y >= 0) continue;
    const r = Math.hypot(x, z) || 1;
    const hang = lerp(r, 0.99, 0.85) * (1 + 0.03 * Math.sin(Math.atan2(z, x) * 9) * -y * 3);
    sp.setXYZ(i, (x / r) * hang, y, (z / r) * hang);
  }
  shirtGeo.computeVertexNormals();
  const shirt = new THREE.Mesh(shirtGeo, shirtMat);
  shirt.scale.set(rx * fit, ry * fit, rz * fit);
  shirt.position.set(cx, cy, cz);
  kit.add(shirt);

  const shortsMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.2),
    new THREE.MeshStandardMaterial({ color: shorts, roughness: 0.8 }),
  );
  shortsMesh.scale.set(rx * (fit + 0.01), ry * (fit + 0.01), rz * (fit + 0.01));
  shortsMesh.position.set(cx, cy, cz);
  kit.add(shortsMesh);

  // a collar ring where the shirt opens at the neck
  const neckY = Math.cos(Math.PI * 0.08);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(Math.sin(Math.PI * 0.08) * 1.02, 0.045, 8, 32), trimMat);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(rx * fit, rz * fit, 1);
  collar.position.set(cx, cy + neckY * ry * fit, cz);
  kit.add(collar);

  for (const arm of rig.arms) {
    const capsule = arm.children.find(c => (c as THREE.Mesh).geometry?.type === 'CapsuleGeometry') as THREE.Mesh;
    const r = (capsule.geometry as THREE.CapsuleGeometry).parameters.radius;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(r * 1.55, 0.06, 8, 16), cloth);
    sleeve.position.y = -0.05;
    arm.add(sleeve);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(r * 1.55, 0.025, 8, 20), trimMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.1;
    arm.add(cuff);
  }

  // the prints are projected from the parent's current pose, so wear the kit before posing the rig
  rig.root.updateMatrixWorld(true);
  if (number) {
    print(
      shirt,
      kit,
      new THREE.Vector3(cx, cy + ry * 0.22, cz - rz * fit), // high on the back, clear of a tail
      true,
      new THREE.Vector3(rx * 0.85, ry * 0.62, rz),
      lettering(number, ink, 256, 256),
    );
    if (!style)
      print(
        shirt,
        kit,
        new THREE.Vector3(cx + rx * 0.38, cy + ry * 0.38, cz + rz * fit * 0.85),
        false,
        new THREE.Vector3(rx * 0.3, ry * 0.25, rz * 0.6),
        lettering(number, ink, 128, 128),
      );
  }
  if (name)
    print(
      shirt,
      kit,
      new THREE.Vector3(cx, cy + ry * 0.66, cz - rz * fit * 0.75),
      true,
      new THREE.Vector3(rx * 1.25, ry * 0.26, rz),
      lettering(name, ink, 768, 160),
    );

  enableShadows(kit);
  return kit;
}

/** A classic black-and-white football: dark patches where the twelve pentagons are. Radius 0.36. */
export function createBall(): THREE.Group {
  const g = new THREE.Group();
  const R = 0.36;
  const white = new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.45 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1b1b22, roughness: 0.5 });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), white));
  // pentagon centres = the vertices of an icosahedron
  const ico = new THREE.IcosahedronGeometry(1, 0);
  const pos = ico.attributes.position!;
  const seen: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i).normalize();
    if (seen.some(s => s.distanceTo(v) < 0.01)) continue;
    seen.push(v);
    const patch = ball(R * 0.36, black, [0, 0, 0], [1, 1, 0.3], 20);
    patch.position.copy(v).multiplyScalar(R * 0.93);
    patch.lookAt(v.clone().multiplyScalar(2));
    g.add(patch);
  }
  ico.dispose();
  enableShadows(g);
  return g;
}

export interface Goal {
  group: THREE.Group;
  /** Pushes the back of the net out around a point (in goal space: y up, z across), `k` 0..1. */
  bulge(k: number, y: number, z: number): void;
}

/**
 * A goal facing −x, its mouth on the goal line at the group's origin: white posts and crossbar, and a net that
 * runs back to a frame behind them. `width` across (z), `height` up, `depth` back (+x).
 */
export function createGoal({ width = 7, height = 3.6, depth = 2.2 } = {}): Goal {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const r = 0.09;
  const bar = (len: number) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), white);
  for (const z of [-width / 2, width / 2]) {
    const post = bar(height);
    post.position.set(0, height / 2, z);
    group.add(post);
  }
  const cross = bar(width + r * 2);
  cross.rotation.x = Math.PI / 2;
  cross.position.set(0, height, 0);
  group.add(cross);

  const netTex = textTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, w, h);
  });
  netTex.wrapS = netTex.wrapT = THREE.RepeatWrapping;
  const netMat = (rx: number, ry: number) => {
    const map = netTex.clone();
    map.repeat.set(rx, ry);
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      alphaTest: 0.3,
      side: THREE.DoubleSide,
      roughness: 0.9,
    });
  };
  const CELL = 0.28;
  // back of the net: a plane at x = depth, sloping down from the crossbar's height to the ground
  const backGeo = new THREE.PlaneGeometry(width, height, 28, 16);
  const back = new THREE.Mesh(backGeo, netMat(width / CELL, height / CELL));
  back.rotation.y = -Math.PI / 2;
  back.position.set(depth, height / 2, 0);
  group.add(back);
  const rest = Float32Array.from(backGeo.attributes.position!.array as Float32Array);
  // roof and sides
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(depth, width), netMat(depth / CELL, width / CELL));
  roof.rotation.x = -Math.PI / 2;
  roof.position.set(depth / 2, height, 0);
  group.add(roof);
  for (const z of [-width / 2, width / 2]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), netMat(depth / CELL, height / CELL));
    side.position.set(depth / 2, height / 2, z);
    group.add(side);
  }
  // the frame at the back
  for (const z of [-width / 2, width / 2]) {
    const p = bar(height);
    p.position.set(depth, height / 2, z);
    group.add(p);
    const top = bar(depth);
    top.rotation.z = Math.PI / 2;
    top.position.set(depth / 2, height, z);
    group.add(top);
  }
  enableShadows(group);

  return {
    group,
    bulge(k, y, z) {
      const p = backGeo.attributes.position!;
      for (let i = 0; i < p.count; i++) {
        // plane space: x across (= z in goal space, after the turn), y up (centred on height / 2)
        const px = rest[i * 3]!,
          py = rest[i * 3 + 1]!;
        const d2 = (px - z) ** 2 + (py + height / 2 - y) ** 2;
        p.setZ(i, -k * 1.1 * Math.exp(-d2 / 1.4)); // −z in plane space = out the back (+x)
      }
      p.needsUpdate = true;
    },
  };
}
