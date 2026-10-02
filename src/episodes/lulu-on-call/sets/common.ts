import * as THREE from 'three';
import { textTexture } from '../../../world/text-texture';
import type { ShownLine, LineKind } from '../terminal';

export const MONO = '"SF Mono", Menlo, Consolas, monospace';
export const ROUND = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';

export function mat(
  color: THREE.ColorRepresentation,
  roughness = 0.75,
  extra: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}

/** A box with its base at y = 0 (so `position.y` is where it stands). */
export function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function cylinder(rTop: number, rBottom: number, h: number, material: THREE.Material, seg = 24): THREE.Mesh {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Floor + back wall + two side walls. The room opens toward +z (where the camera is). */
export function createRoom(
  scene: THREE.Scene,
  {
    wall,
    floor,
    width = 16,
    depth = 12,
    height = 9,
    back = -4,
  }: {
    wall: THREE.ColorRepresentation;
    floor: THREE.ColorRepresentation;
    width?: number;
    depth?: number;
    height?: number;
    back?: number;
  },
): void {
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat(floor, 0.8));
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.z = back + depth / 2;
  floorMesh.receiveShadow = true;
  const wallMat = mat(wall, 0.95);
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
  backWall.position.set(0, height / 2, back);
  backWall.receiveShadow = true;
  scene.add(floorMesh, backWall);
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
    side.rotation.y = -s * (Math.PI / 2);
    side.position.set((s * width) / 2, height / 2, back + depth / 2);
    side.receiveShadow = true;
    scene.add(side);
  }
  // skirting board
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, 0.06), mat(0xffffff, 0.6));
  skirt.position.set(0, 0.125, back + 0.03);
  scene.add(skirt);
}

/** A flat picture (poster, window view, sign) facing +z. */
export function picture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  { px = 512, frame = 0x2a2a35, emissive = false }: { px?: number; frame?: number | null; emissive?: boolean } = {},
): THREE.Group {
  const g = new THREE.Group();
  const tex = textTexture(px, Math.round((px * h) / w), draw, [`700 40px Fredoka`]);
  const m = emissive
    ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  plane.position.z = 0.03;
  g.add(plane);
  if (frame !== null) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.05), mat(frame, 0.5));
    g.add(f);
  }
  return g;
}

const KIND_COLOR: Record<LineKind, string> = {
  title: '#7c86a8',
  prompt: '#f4f1ff',
  agent: '#c9a8ff',
  ok: '#7fe0b0',
  err: '#ff6b8b',
  dim: '#7c86a8',
};

export interface Screen {
  mesh: THREE.Mesh;
  /** Repaints the terminal (only when what's shown changed). */
  show(lines: readonly ShownLine[], cursor: boolean): void;
}

/** A glowing terminal screen (faces +z). */
export function createScreen(w: number, h: number, { px = 1024, header = '' } = {}): Screen {
  let lines: readonly ShownLine[] = [];
  let cursor = false;
  const draw = (ctx: CanvasRenderingContext2D, cw: number, ch: number) =>
    drawTerminal(ctx, cw, ch, header, lines, cursor);
  const tex = textTexture(px, Math.round((px * h) / w), draw);
  const canvas = tex.image as HTMLCanvasElement;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
  );
  let key = '';
  return {
    mesh,
    show(next, cur) {
      const k = next.map(l => l.text).join('\n') + (cur ? '|' : '');
      if (k === key) return;
      key = k;
      lines = next;
      cursor = cur;
      draw(canvas.getContext('2d')!, canvas.width, canvas.height);
      tex.needsUpdate = true;
    },
  };
}

function drawTerminal(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  header: string,
  lines: readonly ShownLine[],
  cursor: boolean,
) {
  ctx.fillStyle = '#0f1222';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#1c2140';
  ctx.fillRect(0, 0, cw, ch * 0.09);
  for (const [i, c] of ['#ff6b6b', '#ffd36b', '#7fe0b0'].entries()) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(cw * 0.04 + i * cw * 0.035, ch * 0.045, ch * 0.017, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7c86a8';
  ctx.font = `${ch * 0.04}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(header, cw / 2, ch * 0.047);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const size = ch * 0.058;
  ctx.font = `600 ${size}px ${MONO}`;
  lines.forEach((l, i) => {
    ctx.fillStyle = KIND_COLOR[l.kind];
    ctx.fillText(l.text, cw * 0.045, ch * 0.2 + i * size * 1.45);
  });
  if (cursor) {
    const last = lines.at(-1);
    const x = cw * 0.045 + (last ? ctx.measureText(last.text).width : 0) + 4;
    const y = ch * 0.2 + Math.max(0, lines.length - 1) * size * 1.45;
    ctx.fillStyle = '#f4f1ff';
    ctx.fillRect(x, y - size * 0.8, size * 0.5, size * 0.95);
  }
}

/** Round wall clock; call set(hours, minutes). Faces +z. */
export function createWallClock(r = 0.6): { group: THREE.Group; set(h: number, m: number): void } {
  const group = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 48), mat(0xffffff, 0.4));
  face.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 10, 48), mat(0x2a2a35, 0.4));
  group.add(face, rim);
  const dark = mat(0x2a2a35, 0.5);
  for (let i = 0; i < 12; i++) {
    const tickMark = new THREE.Mesh(new THREE.BoxGeometry(0.04, i % 3 ? 0.06 : 0.12, 0.02), dark);
    const a = (i / 12) * Math.PI * 2;
    tickMark.position.set(Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.82, 0.05);
    tickMark.rotation.z = -a;
    group.add(tickMark);
  }
  const hand = (len: number, w: number) => {
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02), dark);
    m.position.set(0, len / 2, 0.07);
    pivot.add(m);
    group.add(pivot);
    return pivot;
  };
  const hourHand = hand(r * 0.5, 0.07),
    minuteHand = hand(r * 0.75, 0.045);
  return {
    group,
    set(h, m) {
      minuteHand.rotation.z = -(m / 60) * Math.PI * 2;
      hourHand.rotation.z = -(((h % 12) + m / 60) / 12) * Math.PI * 2;
    },
  };
}
