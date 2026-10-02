import * as THREE from 'three';
import { enableShadows } from '../characters/materials';
import { textTexture, outlinedText } from '../world/text-texture';

const shellMat = () =>
  new THREE.MeshPhysicalMaterial({ color: 0x7b3fa0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 });
// No environment map on stage, so metals use partial metalness + a little glow to stay bright
const chrome = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 0.5, roughness: 0.3, emissive: 0x333344 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 0.7 });
const brass = new THREE.MeshStandardMaterial({ color: 0xf0c050, metalness: 0.45, roughness: 0.35, emissive: 0x4a3200 });

function drum(radius, depth) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 40, 1, true), shellMat()));
  for (const y of [-depth / 2, depth / 2]) {
    const head = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.98, 40), headMat);
    head.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2;
    head.position.y = y;
    g.add(head);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.025, 8, 40), chrome);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = y;
    g.add(rim);
  }
  return g;
}

function stand(from, to) {
  const d = to.clone().sub(from);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, d.length(), 8), chrome);
  m.position.copy(from).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

function cymbal(radius) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.08, radius, 0.05, 40), brass);
  return c;
}

/**
 * Drum kit for a drummer sitting at the origin facing +z (lefty layout: hi-hat and crash on her right).
 * Returns { group, kick, snare, tom, floorTom, hat, crash, throne, strike(name, k) }:
 * call strike with k = 0..1 each frame to wobble cymbals / pulse drums after hits.
 */
export function createDrumKit({ logo = 'ROCKSAURUS' } = {}) {
  const g = new THREE.Group();

  const throne = new THREE.Group();
  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.55, 0.16, 32),
    new THREE.MeshStandardMaterial({ color: 0x1b1b2e, roughness: 0.6 }),
  );
  seat.position.y = 0.42;
  throne.add(seat, stand(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.4, 0)));
  g.add(throne);

  // kick drum lying on its side, front head facing the audience with the band logo
  const kick = new THREE.Group();
  const kickDrum = drum(0.62, 0.55);
  kickDrum.rotation.x = Math.PI / 2;
  kick.add(kickDrum);
  const logoTex = textTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#140a1f';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff5fa2';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2 - 26, 0, Math.PI * 2);
      ctx.stroke();
      const fire = (c, y, size) => {
        const gr = c.createLinearGradient(0, y - size / 2, 0, y + size / 2);
        gr.addColorStop(0, '#fff3a8');
        gr.addColorStop(0.5, '#ffb347');
        gr.addColorStop(1, '#ff3d2e');
        return gr;
      };
      outlinedText(ctx, logo, w / 2, h / 2, {
        font: "'Metal Mania'",
        size: 96,
        maxWidth: w * 0.82,
        fill: fire,
        stroke: '#000',
        line: 0.1,
        glow: '#ff3d2e',
      });
      outlinedText(ctx, '🤘', w / 2, h * 0.73, { font: 'sans-serif', size: 70, stroke: 'rgba(0,0,0,0)' });
    },
    ["96px 'Metal Mania'"],
  );
  const front = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 48),
    new THREE.MeshStandardMaterial({
      map: logoTex,
      roughness: 0.6,
      emissive: 0xffffff,
      emissiveMap: logoTex,
      emissiveIntensity: 0.25,
    }),
  );
  front.position.z = 0.282;
  kick.add(front);
  kick.position.set(0, 0.62, 1.65);
  g.add(kick);

  const snare = drum(0.32, 0.18);
  snare.position.set(-0.6, 1.25, 1.0);
  snare.rotation.set(0.25, 0, -0.1);
  g.add(snare, stand(new THREE.Vector3(-0.6, 0, 1.0), new THREE.Vector3(-0.6, 1.15, 1.0)));

  const tom = drum(0.26, 0.28);
  tom.position.set(0.3, 1.45, 1.42);
  tom.rotation.set(0.45, 0, 0.1);
  g.add(tom);

  const floorTom = drum(0.36, 0.48);
  floorTom.position.set(-1.05, 0.75, 0.85);
  g.add(floorTom);
  for (const a of [0.5, 2.6, 4.6])
    g.add(
      stand(
        new THREE.Vector3(-1.05 + Math.cos(a) * 0.45, 0, 0.85 + Math.sin(a) * 0.45),
        new THREE.Vector3(-1.05 + Math.cos(a) * 0.38, 0.6, 0.85 + Math.sin(a) * 0.38),
      ),
    );

  const hat = new THREE.Group();
  const hatBottom = cymbal(0.33),
    hatTop = cymbal(0.33);
  hatTop.position.y = 0.07;
  hatTop.rotation.x = Math.PI;
  hat.add(hatBottom, hatTop);
  hat.position.set(1.0, 1.5, 0.95);
  g.add(hat, stand(new THREE.Vector3(1.0, 0, 0.95), new THREE.Vector3(1.0, 1.5, 0.95)));

  const crash = cymbal(0.5);
  crash.position.set(1.15, 2.45, 1.25);
  crash.rotation.set(0.35, 0, -0.25);
  g.add(crash, stand(new THREE.Vector3(1.3, 0, 1.15), new THREE.Vector3(1.15, 2.42, 1.25)));

  enableShadows(g);

  const rest = { crash: crash.rotation.clone(), hat: hat.position.y };
  function strike(name, k) {
    if (name === 'crash') {
      crash.rotation.x = rest.crash.x + Math.sin(k * 30) * 0.15 * k;
      crash.rotation.z = rest.crash.z + Math.cos(k * 26) * 0.1 * k;
    }
    if (name === 'hat') hatTop.position.y = 0.07 - 0.04 * k;
    if (name === 'kick') kick.scale.setScalar(1 + 0.03 * k);
    if (name === 'snare') snare.scale.setScalar(1 + 0.04 * k);
    if (name === 'tom') tom.scale.setScalar(1 + 0.05 * k);
    if (name === 'floorTom') floorTom.scale.setScalar(1 + 0.05 * k);
  }

  return { group: g, kick, snare, tom, floorTom, hat, crash, throne, strike };
}
