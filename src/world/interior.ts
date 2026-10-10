import * as THREE from 'three';
import { textTexture } from './text-texture';
import type { ShownLine, LineKind } from './screen-script';

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

/** The shadow-casting map: square, in texels; soft edges. */
const KEY_SHADOW = { size: 2048, radius: 5 } as const;

/**
 * A room's key light: a directional light from high, front and right, casting soft shadows over the room. `reach`
 * is how far left and right of the middle the shadows go (the room is 16 wide), `top` and `bottom` how far up and
 * down. `from` moves the light (late sun through a window on the left, say).
 */
export function addKeyLight(
  scene: THREE.Scene,
  color: THREE.ColorRepresentation,
  intensity: number,
  {
    reach = 8,
    top = 9,
    bottom = -2,
    from = [4, 9, 8],
  }: { reach?: number; top?: number; bottom?: number; from?: readonly [number, number, number] } = {},
): THREE.DirectionalLight {
  const key = new THREE.DirectionalLight(color, intensity);
  key.position.set(...from);
  key.castShadow = true;
  key.shadow.mapSize.set(KEY_SHADOW.size, KEY_SHADOW.size);
  key.shadow.radius = KEY_SHADOW.radius;
  Object.assign(key.shadow.camera, { left: -reach, right: reach, top, bottom, near: 1, far: 30 });
  scene.add(key);
  return key;
}

/** The white frame and middle bar of a window, painted over the view in a `picture()`'s canvas. */
export function paintWindowFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
}

/**
 * A flat, unlit canvas panel (faces +z) whose content changes: `draw` paints it `px` texels wide, and `repaint()`
 * paints it again (call it only when what it shows changed).
 */
export function livePanel(
  w: number,
  h: number,
  px: number,
  draw: (ctx: CanvasRenderingContext2D, cw: number, ch: number) => void,
) {
  const tex = textTexture(px, Math.round((px * h) / w), draw);
  const canvas = tex.image;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
  );
  return {
    mesh,
    repaint() {
      draw(canvas.getContext('2d')!, canvas.width, canvas.height);
      tex.needsUpdate = true;
    },
  };
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

export type ScreenTheme = 'terminal' | 'document';

interface Theme {
  bg: string;
  bar: string;
  barText: string;
  font: string;
  cursor: string;
  colors: Record<LineKind, string>;
}

const SERIF = 'Georgia, "Times New Roman", serif';
const THEMES: Record<ScreenTheme, Theme> = {
  terminal: {
    bg: '#0f1222',
    bar: '#1c2140',
    barText: '#7c86a8',
    font: MONO,
    cursor: '#f4f1ff',
    colors: {
      title: '#7c86a8',
      prompt: '#f4f1ff',
      agent: '#c9a8ff',
      ok: '#7fe0b0',
      err: '#ff6b8b',
      dim: '#7c86a8',
      heading: '#f4f1ff',
      body: '#f4f1ff',
    },
  },
  document: {
    bg: '#fbfaf6',
    bar: '#e9e6dd',
    barText: '#8a8577',
    font: SERIF,
    cursor: '#2b2b33',
    colors: {
      title: '#8a8577',
      prompt: '#2b2b33',
      agent: '#5b4a9a',
      ok: '#2f8a5a',
      err: '#c1121f',
      dim: '#8a8577',
      heading: '#16161c',
      body: '#2b2b33',
    },
  },
};

export interface Screen {
  mesh: THREE.Mesh;
  /** Repaints the screen (only when what's shown changed). */
  show(lines: readonly ShownLine[], cursor: boolean): void;
}

/** A glowing screen (faces +z): a dark terminal, or a word-processor page with `theme: 'document'`. */
export function createScreen(
  w: number,
  h: number,
  { px = 1024, header = '', theme = 'terminal' }: { px?: number; header?: string; theme?: ScreenTheme } = {},
): Screen {
  let lines: readonly ShownLine[] = [];
  let cursor = false;
  const panel = livePanel(w, h, px, (ctx, cw, ch) => drawScreen(ctx, cw, ch, THEMES[theme], header, lines, cursor));
  let key = '';
  return {
    mesh: panel.mesh,
    show(next, cur) {
      const k = next.map(l => l.text).join('\n') + (cur ? '|' : '');
      if (k === key) return;
      key = k;
      lines = next;
      cursor = cur;
      panel.repaint();
    },
  };
}

function drawScreen(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  theme: Theme,
  header: string,
  lines: readonly ShownLine[],
  cursor: boolean,
) {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = theme.bar;
  ctx.fillRect(0, 0, cw, ch * 0.09);
  for (const [i, c] of ['#ff6b6b', '#ffd36b', '#7fe0b0'].entries()) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(cw * 0.04 + i * cw * 0.035, ch * 0.045, ch * 0.017, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = theme.barText;
  ctx.font = `${ch * 0.04}px ${theme.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(header, cw / 2, ch * 0.047);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const size = ch * 0.058;
  let y = ch * 0.2;
  let lastWidth = 0,
    lastY = y,
    lastSize = size;
  lines.forEach(l => {
    const s = l.kind === 'heading' ? size * 1.12 : size;
    ctx.font = `${l.kind === 'heading' ? 700 : 600} ${s}px ${theme.font}`;
    ctx.fillStyle = theme.colors[l.kind];
    ctx.fillText(l.text, cw * 0.045, y);
    lastWidth = ctx.measureText(l.text).width;
    lastY = y;
    lastSize = s;
    y += s * 1.45;
  });
  if (cursor) {
    const x = cw * 0.045 + (lines.length ? lastWidth : 0) + 4;
    ctx.fillStyle = theme.cursor;
    ctx.fillRect(x, lastY - lastSize * 0.8, lastSize * (theme.font === MONO ? 0.5 : 0.08), lastSize * 0.95);
  }
}

/** Round wall clock; call set(hours, minutes). Faces +z. */
/** A round wall clock; `set(hours, minutes)` moves its hands. */
export interface WallClock {
  group: THREE.Group;
  set(h: number, m: number): void;
}

/** A clock face: 12 hours, 60 minutes; every third hour (12, 3, 6, 9) gets a long tick. */
const HOURS = 12;
const MINUTES = 60;
const QUARTER = 3;

export function createWallClock(r = 0.6): WallClock {
  const group = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 48), mat(0xffffff, 0.4));
  face.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 10, 48), mat(0x2a2a35, 0.4));
  group.add(face, rim);
  const dark = mat(0x2a2a35, 0.5);
  for (let i = 0; i < HOURS; i++) {
    const tickMark = new THREE.Mesh(new THREE.BoxGeometry(0.04, i % QUARTER ? 0.06 : 0.12, 0.02), dark);
    const a = (i / HOURS) * Math.PI * 2;
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
      minuteHand.rotation.z = -(m / MINUTES) * Math.PI * 2;
      hourHand.rotation.z = -(((h % HOURS) + m / MINUTES) / HOURS) * Math.PI * 2;
    },
  };
}
