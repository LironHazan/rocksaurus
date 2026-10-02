import * as THREE from 'three';
import { ball, enableShadows } from '../characters/materials';

// crown fit for a Rory-style head (head ellipsoid ≈ 1.155 × 0.9975 × 1.05)
const CROWN = { x: 1.2, y: 0.95, z: 1.12 };

/** A curved baseball-cap bill: D-shaped, rounded edges, drooping at the sides. Lies along -z (worn backwards). */
function billGeometry(reach = 0.78, spread = 1.15) {
  const shape = new THREE.Shape();
  const N = 24;
  // inner edge follows the crown rim at the back; outer edge is a rounded "D"
  for (let i = 0; i <= N; i++) {
    const a = -spread + (2 * spread * i) / N;
    const x = CROWN.x * Math.sin(a),
      y = CROWN.z * Math.cos(a) * 0.98;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const a = -spread + (2 * spread * i) / N;
    const k = Math.cos(((a / spread) * Math.PI) / 2); // 1 in the middle, 0 at the ends
    shape.lineTo(CROWN.x * Math.sin(a) * 0.98, CROWN.z * Math.cos(a) + reach * Math.pow(k, 0.7));
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 24,
  });
  g.rotateX(Math.PI / 2); // shape y → +z, thickness downward
  g.scale(1, 1, -1); // point the bill out the back (-z)
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    // curve the bill: sides droop, tip lifts a touch
    const x = p.getX(i),
      z = p.getZ(i);
    p.setY(i, p.getY(i) - 0.16 * (x / CROWN.x) ** 2 + 0.06 * Math.max(0, -z - CROWN.z));
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Baseball cap worn backwards (defaults fit a Rory-style head; use scale/position for other heads): six-panel crown with stitched seams and eyelets,
 * top button, curved bill out the back, and a snapback strap over the opening at the forehead.
 * Hides the rig's little head bump if it has one.
 */
export function addCap(
  rig,
  { crown = 0xe63946, brim = 0x1b1b2e, button = 0xe63946, scale = 1, position = [0, 0.22, -0.04], tilt = -0.12 } = {},
) {
  const crownMat = new THREE.MeshStandardMaterial({ color: crown, roughness: 0.8 });
  const seamMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(crown).multiplyScalar(0.6), roughness: 0.9 });
  const brimMat = new THREE.MeshStandardMaterial({ color: brim, roughness: 0.6, side: THREE.DoubleSide });
  const cap = new THREE.Group();

  // crown: a tall, rounded dome (caps are taller than they are flat)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), crownMat);
  dome.scale.set(CROWN.x, CROWN.y, CROWN.z);
  cap.add(dome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 64), seamMat); // stitched bottom edge
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(CROWN.x, CROWN.z, 1);
  cap.add(rim);

  // six panel seams from the button down to the rim, and an eyelet on every panel
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const seam = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 32, Math.PI / 2), seamMat);
    seam.scale.set(1.005, 1.005, 1.005);
    const holder = new THREE.Group();
    holder.add(seam);
    seam.rotation.set(0, 0, 0);
    holder.rotation.y = a;
    holder.scale.set(CROWN.x, CROWN.y, CROWN.z);
    cap.add(holder);
    const e = a + Math.PI / 6,
      el = 0.95; // eyelet mid-panel, near the top
    const pos = new THREE.Vector3(Math.cos(e) * Math.sin(0.55), Math.cos(0.55), -Math.sin(e) * Math.sin(0.55));
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 14), seamMat);
    eyelet.position.set(pos.x * CROWN.x * el * 1.03, pos.y * CROWN.y * el * 1.03, pos.z * CROWN.z * el * 1.03);
    eyelet.lookAt(eyelet.position.clone().multiplyScalar(2));
    cap.add(eyelet);
  }
  cap.add(
    ball(
      0.075,
      new THREE.MeshStandardMaterial({ color: button, roughness: 0.6 }),
      [0, CROWN.y - 0.01, 0],
      [1, 0.55, 1],
      16,
    ),
  );

  // curved bill out the back
  const bill = new THREE.Mesh(billGeometry(), brimMat);
  bill.position.y = 0.02;
  cap.add(bill);

  // snapback at the forehead: arched opening edge + strap with snaps
  const strapMat = new THREE.MeshStandardMaterial({ color: brim, roughness: 0.6 });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 24, Math.PI), seamMat);
  arch.position.set(0, 0.0, CROWN.z * 0.995);
  cap.add(arch);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.03), strapMat);
  strap.position.set(0, 0.04, CROWN.z * 0.99);
  cap.add(strap);
  for (let i = -2; i <= 2; i++)
    cap.add(
      ball(
        0.018,
        new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.3 }),
        [i * 0.09, 0.04, CROWN.z * 0.99 + 0.02],
        [1, 1, 0.5],
        8,
      ),
    );

  cap.position.set(...position);
  cap.rotation.x = tilt; // tipped back a little: relaxed, not tight
  cap.scale.setScalar(scale);
  enableShadows(cap);
  if (rig.headBump) rig.headBump.visible = false;
  rig.head.add(cap);
  rig.cap = cap;
  return cap;
}
