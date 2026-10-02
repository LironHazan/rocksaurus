import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { textTexture } from '../world/text-texture.js';

const TATTOO_FONT = 'Rye';
const LETTERING_FONT = "'Metal Mania'";
const INK = '#1b1b2e';

function heart(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.55);
  ctx.bezierCurveTo(cx - s * 0.95, cy - s * 0.05, cx - s * 0.55, cy - s * 0.75, cx, cy - s * 0.3);
  ctx.bezierCurveTo(cx + s * 0.55, cy - s * 0.75, cx + s * 0.95, cy - s * 0.05, cx, cy + s * 0.55);
  ctx.closePath();
  ctx.fillStyle = '#e63946';
  ctx.fill();
  ctx.lineWidth = s * 0.06;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();                                   // shine
  ctx.arc(cx - s * 0.35, cy - s * 0.25, s * 0.13, Math.PI * 1.1, Math.PI * 1.7);
  ctx.lineWidth = s * 0.05;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

function bat(ctx, cx, cy, s) {
  // right half outline (x relative to center, y relative), mirrored for the left wing
  const half = [[0.12, -0.12], [0.45, -0.42], [1, -0.18], [0.78, 0.0], [0.72, 0.18], [0.52, 0.05], [0.42, 0.22], [0.24, 0.08], [0.12, 0.22]];
  ctx.beginPath();
  ctx.moveTo(cx, cy - 0.3 * s);
  ctx.lineTo(cx + 0.1 * s, cy - 0.42 * s);               // ear
  for (const [x, y] of half) ctx.lineTo(cx + x * s, cy + y * s);
  ctx.lineTo(cx, cy + 0.3 * s);
  for (const [x, y] of [...half].reverse()) ctx.lineTo(cx - x * s, cy + y * s);
  ctx.lineTo(cx - 0.1 * s, cy - 0.42 * s);               // ear
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = '#ff5fa2';                              // little pink eyes
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + sx * 0.05 * s, cy - 0.17 * s, 0.025 * s, 0, Math.PI * 2); ctx.fill(); }
}

function banner(ctx, cx, cy, w, h, text) {
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#e7c9a0';
  for (const s of [-1, 1]) {                             // folded tails behind
    ctx.beginPath();
    ctx.moveTo(cx + s * (w / 2 - 20), cy - h * 0.2);
    ctx.lineTo(cx + s * (w / 2 + 40), cy - h * 0.2);
    ctx.lineTo(cx + s * (w / 2 + 15), cy + h * 0.3);
    ctx.lineTo(cx + s * (w / 2 + 40), cy + h * 0.8);
    ctx.lineTo(cx + s * (w / 2 - 20), cy + h * 0.8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#fff3dc';
  ctx.beginPath();
  ctx.rect(cx - w / 2, cy - h / 2, w, h);
  ctx.fill(); ctx.stroke();
  ctx.font = `${h * 0.72}px ${TATTOO_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#9c1c2a';
  ctx.fillText(text, cx, cy + h * 0.04, w * 0.9);
}

/** Lettering-only tattoo: just the word in a metal font, black ink with a thin red edge. */
function lettering(ctx, w, h, text) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.12);                                     // slight slant, hand-inked feel
  ctx.font = `200px ${LETTERING_FONT}`;
  const size = 200 * Math.min(1, (w * 0.9) / ctx.measureText(text).width);
  ctx.font = `${size}px ${LETTERING_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.12;
  ctx.strokeStyle = '#b3202e';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = INK;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * A tattoo inked onto Rory's hip (the side facing the camera).
 *   style: 'lettering' — just `text` in a metal font (default)
 *          'classic'   — old-school heart + bat + banner with `text`
 *   image: path to your own PNG (transparent background), e.g. '/tattoos/my-tattoo.png'
 *          in public/. Overrides `style`. Only use artwork you have the rights to.
 */
export function addTattoo(rig, { text = 'OZZY', style = 'lettering', image, size = 0.85 } = {}) {
  let tex;
  if (image) {
    tex = new THREE.TextureLoader().load(image);
    tex.colorSpace = THREE.SRGBColorSpace;
  } else if (style === 'classic') {
    tex = textTexture(512, 512, ctx => {
      heart(ctx, 256, 300, 300);
      bat(ctx, 256, 125, 210);
      banner(ctx, 256, 330, 330, 86, text);
    }, [`60px ${TATTOO_FONT}`]);
  } else {
    tex = textTexture(512, 512, (ctx, w, h) => lettering(ctx, w, h, text), [`200px ${LETTERING_FONT}`]);
  }

  const thigh = rig.thighs.find(t => t.userData.side === -1);
  rig.root.updateMatrixWorld(true);                       // project while the rig is at rest
  const normal = new THREE.Vector3(-0.85, 0.05, 0.52).normalize();
  const center = thigh.getWorldPosition(new THREE.Vector3()).addScaledVector(normal, 0.5);
  const projector = new THREE.Object3D();
  projector.position.copy(center);
  projector.lookAt(center.clone().add(normal));
  const geometry = new DecalGeometry(thigh, center, projector.rotation, new THREE.Vector3(size, size, 0.6));

  // DecalGeometry is in world space; at rest the torso's world matrix is identity,
  // so the decal can live on the torso and move with Rory from now on.
  const decal = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 0.93, roughness: 0.8,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
  }));
  decal.receiveShadow = true;
  rig.torso.add(decal);
  rig.tattoo = decal;
  return decal;
}
