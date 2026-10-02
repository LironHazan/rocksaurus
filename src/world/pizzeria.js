import * as THREE from 'three';
import { ball, enableShadows } from '../characters/materials';
import { textTexture, outlinedText } from './text-texture';

const METAL = "'Metal Mania'";
const ROUND = 'Fredoka';
const fireGradient = (ctx, y, size) => {
  const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, '#fff3a8');
  g.addColorStop(0.5, '#ffb347');
  g.addColorStop(1, '#ff3d2e');
  return g;
};

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
function box(w, h, d, mat, [x, y, z], rotX = 0) {
  // mat may be an array: [+x, -x, +y, -y, front, back]
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.x = rotX;
  return m;
}

/**
 * Little metal pizzeria. Front faces +z. Everything on the signs is configurable:
 *   name (roof sign), tagline (under it), number (door plate), window (painted on the glass),
 *   awning: two stripe colors.
 */
export function createPizzeria({
  name = 'SLICE SABBATH',
  tagline = '⚡ PIZZA · EST. 666 ⚡',
  number = '666',
  window: windowText = "OPEN 'TIL 6:66 🤘",
  awning = [0x1b1b2e, 0xe63946],
} = {}) {
  const g = new THREE.Group();
  g.add(box(5, 3.2, 2.5, std(0xfff1d6), [0, 1.6, 0])); // walls
  g.add(box(5.4, 0.35, 2.9, std(0x2a1838), [0, 3.38, 0])); // roof
  g.add(box(1, 1.9, 0.08, std(0x3a2a33), [-1.5, 0.95, 1.27])); // door
  g.add(ball(0.06, std(0xffd36b, { metalness: 0.8, roughness: 0.3 }), [-1.15, 0.95, 1.33], [1, 1, 1], 12));

  // door number plate
  const plate = textTexture(
    256,
    112,
    (ctx, w, h) => {
      ctx.fillStyle = '#140a1f';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#c9a14a';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      outlinedText(ctx, number, w / 2, h / 2 + 4, {
        font: METAL,
        size: 84,
        fill: '#ff3d2e',
        stroke: '#000',
        line: 0.06,
      });
    },
    [`84px ${METAL}`],
  );
  g.add(
    box(
      0.5,
      0.22,
      0.03,
      [
        std(0x140a1f),
        std(0x140a1f),
        std(0x140a1f),
        std(0x140a1f),
        new THREE.MeshStandardMaterial({ map: plate, roughness: 0.5 }),
        std(0x140a1f),
      ],
      [-1.5, 2.08, 1.3],
    ),
  );

  // window with painted lettering
  const glass = textTexture(
    512,
    280,
    (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#d8f0ff');
      gr.addColorStop(1, '#9fcde8');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      outlinedText(ctx, windowText, w / 2, h / 2, {
        font: ROUND,
        size: 64,
        maxWidth: w * 0.9,
        fill: '#ffffff',
        stroke: '#2a1838',
        line: 0.18,
      });
    },
    [`700 64px ${ROUND}`],
  );
  g.add(box(2.2, 1.3, 0.04, std(0xffffff), [0.9, 1.55, 1.255])); // window frame
  const glassMat = new THREE.MeshStandardMaterial({
    map: glass,
    roughness: 0.2,
    emissive: 0xffffff,
    emissiveIntensity: 0.15,
    emissiveMap: glass,
  });
  g.add(
    box(
      2,
      1.1,
      0.06,
      [std(0xbfe6ff), std(0xbfe6ff), std(0xbfe6ff), std(0xbfe6ff), glassMat, std(0xbfe6ff)],
      [0.9, 1.55, 1.27],
    ),
  );

  const stripeW = 5.2 / 8;
  for (let i = 0; i < 8; i++)
    // awning
    g.add(box(stripeW, 0.05, 0.95, std(awning[i % 2]), [-2.6 + (i + 0.5) * stripeW, 2.62, 1.62], 0.45));

  // big roof sign
  const signTex = textTexture(
    1024,
    290,
    (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#2a0e3a');
      bg.addColorStop(1, '#0d0518');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ff5fa2';
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      outlinedText(ctx, name, w / 2, h * 0.42, {
        font: METAL,
        size: 150,
        maxWidth: w * 0.88,
        fill: fireGradient,
        stroke: '#000',
        line: 0.08,
        glow: '#ff3d2e',
      });
      outlinedText(ctx, tagline, w / 2, h * 0.8, {
        font: ROUND,
        size: 40,
        maxWidth: w * 0.8,
        fill: '#ffffff',
        stroke: '#000',
        line: 0.15,
      });
    },
    [`150px ${METAL}`, `700 40px ${ROUND}`],
  );
  const boardMat = std(0x140a1f);
  const front = new THREE.MeshStandardMaterial({
    map: signTex,
    roughness: 0.4,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
    emissiveMap: signTex,
  });
  g.add(box(4.6, 1.3, 0.12, [boardMat, boardMat, boardMat, boardMat, front, boardMat], [0, 4.3, 1.0]));
  for (const x of [-1.8, 1.8]) g.add(box(0.12, 0.8, 0.12, std(0x3a3a44, { metalness: 0.6 }), [x, 3.7, 0.9]));

  enableShadows(g);
  return g;
}

/** Round bistro table with a red-and-white checkered cloth. Tabletop surface is at y = TABLE_TOP. */
export const TABLE_TOP = 1.25;
export function createTable() {
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#ffffff' : '#e63946';
      ctx.fillRect(x, y, 1, 1);
    }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1, 48), [
    std(0xe63946),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }),
    std(0xe63946),
  ]);
  top.position.y = TABLE_TOP - 0.05;
  g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, TABLE_TOP - 0.1, 16), std(0x5a4636));
  leg.position.y = (TABLE_TOP - 0.1) / 2;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.06, 32), std(0x5a4636));
  foot.position.y = 0.03;
  g.add(leg, foot);
  enableShadows(g);
  return g;
}
