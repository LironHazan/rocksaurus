import * as THREE from 'three';
import { textTexture } from '../world/text-texture';
import { enableShadows } from '../characters/materials';

// Lulu's body ellipsoid (see createLulu: BODY)
const BODY = { y: 1, rx: 1.05, ry: 0.95, rz: 1 };

/** Grunge plaid: wide dark bands over a base color, with thin accent lines, in both directions. */
function plaidTexture({ base, band, accent, line }: { base: string; band: string; accent: string; line: string }) {
  const tex = textTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = band;
    for (const o of [0, 128]) {
      ctx.fillRect(o, 0, 64, h);
      ctx.fillRect(0, o, w, 64);
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = accent;
    for (const o of [88, 216]) {
      ctx.fillRect(o, 0, 14, h);
      ctx.fillRect(0, o, w, 14);
    }
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = line;
    for (const o of [32, 160]) {
      ctx.fillRect(o, 0, 3, h);
      ctx.fillRect(0, o, w, 3);
    }
    ctx.globalAlpha = 0.12; // worn, brushed flannel texture
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = i % 2 ? '#000' : '#fff';
      ctx.fillRect((i * 97) % w, (i * 57) % h, 2, 1);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Open grunge flannel shirt over a dark band tee, with collar, buttons and short rolled sleeves.
 * Works with Lulu's rig (body, arms). Colors are the plaid's base / dark bands / accent stripe / thin line.
 */
export function addFlannel(
  rig: { body: THREE.Object3D; arms: THREE.Object3D[] },
  { base = '#a3262a', band = '#120c10', accent = '#2f5a35', line = '#e3b23c', tee = 0x22222b } = {},
) {
  const plaid = plaidTexture({ base, band, accent, line });
  plaid.repeat.set(7, 3);
  const flannelMat = new THREE.MeshStandardMaterial({ map: plaid, roughness: 0.95, side: THREE.DoubleSide });
  const teeMat = new THREE.MeshStandardMaterial({ color: tee, roughness: 0.9 });
  const shirt = new THREE.Group();

  // the tee underneath (shows through the open front)
  const teeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 32, 0, Math.PI * 2, Math.PI * 0.14, Math.PI * 0.56),
    teeMat,
  );
  teeMesh.scale.set(BODY.rx * 1.02, BODY.ry * 1.02, BODY.rz * 1.02);
  teeMesh.position.y = BODY.y;
  shirt.add(teeMesh);

  // the flannel: same shape, a bit bigger, open at the front
  const GAP = 0.42; // half-width of the open front (radians)
  const front = Math.PI / 2; // +z in SphereGeometry's phi
  const flannel = new THREE.Mesh(
    new THREE.SphereGeometry(1, 56, 32, front + GAP, Math.PI * 2 - GAP * 2, Math.PI * 0.12, Math.PI * 0.6),
    flannelMat,
  );
  flannel.scale.set(BODY.rx * 1.05, BODY.ry * 1.05, BODY.rz * 1.05);
  flannel.position.y = BODY.y;
  shirt.add(flannel);

  // buttons down her left front edge
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0xe9e2d0, roughness: 0.5 });
  for (let i = 0; i < 4; i++) {
    const th = Math.PI * (0.25 + i * 0.11),
      ph = front - GAP;
    const p = new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th));
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), buttonMat);
    b.position.set(p.x * BODY.rx * 1.07, BODY.y + p.y * BODY.ry * 1.07, p.z * BODY.rz * 1.07);
    b.lookAt(b.position.clone().add(new THREE.Vector3(p.x, p.y, p.z)));
    b.rotateX(Math.PI / 2);
    shirt.add(b);
  }

  // collar around the base of the neck, open at the front
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.085, 12, 40, Math.PI * 1.55), flannelMat);
  collar.rotation.order = 'YXZ'; // lay the ring flat first, then turn it
  collar.rotation.set(Math.PI / 2, Math.PI * 1.275, 0); // …so the gap faces the front
  collar.position.set(0, 1.82, 0.12);
  collar.scale.set(1, 1, 0.7);
  shirt.add(collar);

  rig.body.add(shirt);

  // short sleeves with a rolled cuff on each tiny arm
  for (const arm of rig.arms) {
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.1, 8, 16), flannelMat);
    sleeve.position.y = -0.07;
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 10, 24), flannelMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.16;
    arm.add(sleeve, cuff);
  }

  enableShadows(shirt);
  return shirt;
}
