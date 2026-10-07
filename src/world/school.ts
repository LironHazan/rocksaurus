import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { enableShadows } from '../characters/materials';
import { taperedTube } from '../props/tube';
import { box, cylinder, mat } from './interior';
import { textTexture } from './text-texture';

// Schools (the School of Rock and friends) and the trees around them, shared by the episodes set near them.

/**
 * A school (the School of Rock by default): a bright, boxy school with round porthole windows, a glazed double-door entrance under a
 * half-round fanlight, a gabled roof and its sign. Stands on the ground at the origin, front facing +z (the front
 * wall is at z = 2).
 */
export interface SchoolOptions {
  name?: string;
  /** CSS font for the sign (a family loaded in index.html). */
  font?: string;
  /** CSS font weight for the sign, e.g. '700'. */
  weight?: string;
  ink?: string;
  board?: string;
  wall?: number;
  roof?: number;
  door?: number;
}

export function createSchool({
  name = 'School of Rock',
  font = "'Metal Mania', serif",
  weight = '',
  ink = '#111014',
  board = '#ffffff',
  wall = 0xffe3a3,
  roof = 0xd9604a,
  door: doorColour = 0x2f6fb5,
}: SchoolOptions = {}): THREE.Group {
  const g = new THREE.Group();
  const walls = box(14, 5.2, 4, mat(wall, 0.9));
  g.add(walls);
  // a gabled roof: wall-coloured gable ends under two tiled slopes with an overhang
  const rise = 2.0;
  const gable = new THREE.Shape();
  gable.moveTo(-2, 0);
  gable.lineTo(2, 0);
  gable.lineTo(0, rise);
  gable.closePath();
  const ends = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 14, bevelEnabled: false }), mat(wall, 0.9));
  ends.rotation.y = Math.PI / 2;
  ends.position.set(-7, 5.2, 0);
  g.add(ends);
  const slope = Math.hypot(2, rise) + 0.5;
  for (const s of [-1, 1]) {
    const slab = box(15, 0.2, slope, mat(roof, 0.8));
    const pitchAngle = Math.atan2(rise, 2);
    slab.rotation.x = s * pitchAngle;
    // centred halfway down the slope from the ridge, sitting on the gable
    slab.position.set(
      0,
      5.2 + rise - (slope / 2) * Math.sin(pitchAngle) + 0.02,
      s * (slope / 2) * Math.cos(pitchAngle) - s * 0.08,
    );
    g.add(slab);
  }
  const ridge = cylinder(0.16, 0.16, 15.2, mat(new THREE.Color(roof).multiplyScalar(0.8).getHex(), 0.8), 12);
  ridge.rotation.z = Math.PI / 2;
  ridge.position.set(7.6, 5.2 + rise + 0.1, 0);
  g.add(ridge);
  const glassMat = windowGlass();
  const pane = roundWindow(glassMat);
  for (const x of [-5.1, -2.6, 2.6, 5.1]) {
    const w = pane.clone();
    w.position.set(x, 2.9, 2.0);
    g.add(w);
  }
  const door = entrance(glassMat, doorColour);
  door.position.z = 2.0;
  g.add(door);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 0.9),
    new THREE.MeshBasicMaterial({
      map: textTexture(
        1024,
        176,
        (ctx, w, h) => {
          ctx.fillStyle = board;
          ctx.beginPath();
          ctx.roundRect(4, 4, w - 8, h - 8, 40);
          ctx.fill();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let size = h * 0.62;
          ctx.font = `${weight} ${size}px ${font}`;
          const width = ctx.measureText(name).width;
          if (width > w * 0.92) size *= (w * 0.92) / width;
          ctx.font = `${weight} ${size}px ${font}`;
          ctx.fillStyle = ink;
          ctx.fillText(name, w / 2, h * 0.54);
        },
        [`40px ${font.split(',')[0]}`, '700 40px Fredoka', "700 40px 'Cinzel'"],
      ),
      toneMapped: false,
    }),
  );
  sign.position.set(0, 4.35, 2.06); // over the entrance, clear of the roof's overhang
  g.add(sign);
  enableShadows(g);
  return g;
}

/** Window glass: the sky reflected in it, darker low down where the room shows through, and a streak of sun. */
function windowGlass(): THREE.MeshPhysicalMaterial {
  const sky = textTexture(256, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w * 0.3, h);
    gr.addColorStop(0, '#d6efff');
    gr.addColorStop(0.45, '#8cc8ee');
    gr.addColorStop(1, '#3f6f9a'); // the dark room behind shows through low down
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; // a streak of reflected sun
    ctx.beginPath();
    ctx.moveTo(w * 0.18, h);
    ctx.lineTo(w * 0.38, h);
    ctx.lineTo(w * 0.86, 0);
    ctx.lineTo(w * 0.7, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h);
    ctx.lineTo(w * 0.5, h);
    ctx.lineTo(w * 0.96, 0);
    ctx.lineTo(w * 0.9, 0);
    ctx.fill();
  });
  return new THREE.MeshPhysicalMaterial({ map: sky, roughness: 0.05, metalness: 0.1, clearcoat: 1 });
}

/**
 * The school entrance: double doors with glass panels, raised lower panels and long handles, in a white frame,
 * a half-round fanlight above (glazed like the round windows), and a step. Faces +z on the wall surface.
 */
function entrance(glassMat: THREE.Material, colour: number): THREE.Group {
  const g = new THREE.Group();
  const white = mat(0xffffff, 0.45);
  const W = 1.9, // the opening
    H = 2.55,
    T = 0.14; // trim
  const step = box(W + 1.0, 0.16, 0.9, mat(0xc9c3b6, 0.9));
  step.position.z = 0.45;
  g.add(step);
  for (const s of [-1, 1]) {
    const post = box(T, H + T, 0.22, white);
    post.position.set(s * (W / 2 + T / 2), 0, 0.11);
    g.add(post);
  }
  const lintel = box(W + T * 2, T, 0.22, white);
  lintel.position.set(0, H, 0.11);
  g.add(lintel);

  const paint = mat(colour, 0.5);
  const panel = mat(new THREE.Color(colour).multiplyScalar(0.85).getHex(), 0.55);
  const steel = mat(0xd8dbe2, 0.25, { metalness: 0.8 });
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.set((s * W) / 4, 0, 0.04);
    const slab = box(W / 2 - 0.03, H - 0.02, 0.08, paint);
    leaf.add(slab);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(W / 2 - 0.34, 1.05), glassMat);
    pane.position.set(0, 1.78, 0.045);
    leaf.add(pane);
    const kick = box(W / 2 - 0.34, 0.75, 0.03, panel);
    kick.position.set(0, 0.32, 0.04);
    leaf.add(kick);
    const handle = cylinder(0.025, 0.025, 0.6, steel, 10);
    handle.position.set(-s * (W / 4 - 0.14), 1.0, 0.12);
    leaf.add(handle);
    g.add(leaf);
  }

  // the fanlight: a half-round window over the doors, with radiating glazing bars
  const R = W / 2 + T;
  const fan = new THREE.Mesh(new THREE.CircleGeometry(W / 2, 32, 0, Math.PI), glassMat);
  fan.position.set(0, H + T, 0.06);
  g.add(fan);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(R - T / 2, T / 2 + 0.02, 10, 32, Math.PI), white);
  arch.position.set(0, H + T, 0.12);
  g.add(arch);
  for (const a of [Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, W / 2, 0.05), white);
    bar.position.set((Math.cos(a) * W) / 4, H + T + (Math.sin(a) * W) / 4, 0.09);
    bar.rotation.z = a - Math.PI / 2;
    g.add(bar);
  }
  enableShadows(g);
  return g;
}

/**
 * A round porthole window: a deep white frame standing out from the wall, a pane set back inside it that reflects the sky
 * (with a highlight streak), a cross of glazing bars and a sill. Faces +z, centred on the wall surface.
 */
function roundWindow(glassMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const R = 0.75;
  const white = mat(0xffffff, 0.45);
  const DEPTH = 0.26; // how far the frame stands out from the wall
  const frame = new THREE.Mesh(new THREE.TorusGeometry(R, 0.1, 14, 40), white);
  frame.position.z = DEPTH;
  g.add(frame);
  // the reveal: the inside of the frame's tube, so the glass sits back from the rim
  const reveal = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, 0.3, 40, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.8, side: THREE.BackSide }),
  );
  reveal.rotation.x = Math.PI / 2;
  reveal.position.z = DEPTH / 2;
  reveal.scale.y = DEPTH / 0.3;
  g.add(reveal);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(R, 40), glassMat);
  glass.position.z = 0.03;
  g.add(glass);
  for (const r of [0, Math.PI / 2]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(R * 2, 0.07, 0.07), white);
    bar.rotation.z = r;
    bar.position.z = 0.07;
    g.add(bar);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.36), white);
  sill.position.set(0, -R - 0.12, DEPTH / 2 + 0.05);
  g.add(sill);
  enableShadows(g);
  return g;
}

/** A smooth, lumpy blob of leaves: a sphere pushed in and out by a fixed pattern (the same for shared vertices). */
function leafClump(r: number, seed: number): THREE.BufferGeometry {
  const ico = new THREE.IcosahedronGeometry(r, 4);
  ico.deleteAttribute('uv');
  ico.deleteAttribute('normal');
  const geo = mergeVertices(ico); // shared corners, so the normals come out smooth instead of faceted
  ico.dispose();
  const p = geo.attributes.position!;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const bump =
      Math.sin(v.x * 5.1 + seed) * Math.sin(v.y * 4.3 + seed * 1.7) * Math.sin(v.z * 5.7 + seed * 0.6) +
      0.5 * Math.sin(v.x * 11 + v.z * 9 + seed * 2.3) * Math.sin(v.y * 10 + seed);
    v.multiplyScalar(r * (1 + 0.14 * bump));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

const BARK = new THREE.MeshStandardMaterial({ color: 0x6e4a32, roughness: 1 });
const LEAVES = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });

/**
 * A tree: a tapered, slightly bent trunk flaring at the roots, branches reaching into the canopy, and a canopy
 * of lumpy clumps merged into one, darker underneath and in the shade, lighter on top where the sun hits.
 */
export function createTree(r: () => number): THREE.Group {
  const g = new THREE.Group();
  const lean = (r() - 0.5) * 0.3;
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lean * 0.3, 1.1, 0.05),
    new THREE.Vector3(lean, 2.3, -0.05),
    new THREE.Vector3(lean * 0.8, 3.2, 0),
  ]);
  g.add(
    new THREE.Mesh(
      taperedTube(trunkCurve, s => 0.3 - 0.17 * s + 0.12 * Math.max(0, 0.12 - s) * 8, { segments: 24, radial: 14 }),
      BARK,
    ),
  );
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + r();
    const start = new THREE.Vector3(lean * 0.7, 1.9 + i * 0.25, 0);
    const branch = new THREE.CatmullRomCurve3([
      start,
      start.clone().add(new THREE.Vector3(Math.cos(a) * 0.45, 0.6, Math.sin(a) * 0.45)),
      start.clone().add(new THREE.Vector3(Math.cos(a) * 1.0, 1.25, Math.sin(a) * 1.0)),
    ]);
    g.add(
      new THREE.Mesh(
        taperedTube(branch, s => 0.11 * (1 - s) + 0.03, { segments: 10, radial: 8 }),
        BARK,
      ),
    );
  }

  const clumps: THREE.BufferGeometry[] = [];
  const centres: [number, number, number, number][] = [[lean, 3.9, 0, 1.35]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.5;
    centres.push([lean + Math.cos(a) * 1.05, 3.3 + r() * 0.9, Math.sin(a) * 1.05, 0.8 + r() * 0.35]);
  }
  centres.push([lean + (r() - 0.5) * 0.5, 4.85, (r() - 0.5) * 0.5, 0.85]);
  const dark = new THREE.Color(0x2c6230),
    light = new THREE.Color(0x8bcf6c),
    c = new THREE.Color();
  centres.forEach(([x, y, z, rad], i) => {
    const geo = leafClump(rad, i * 3.7 + r() * 10);
    geo.translate(x, y, z);
    const p = geo.attributes.position!;
    const colours = new Float32Array(p.count * 3);
    const tint = (r() - 0.5) * 0.06;
    for (let k = 0; k < p.count; k++) {
      // lighter toward the top and the sunny side (+x, +z), darker underneath
      const up = THREE.MathUtils.clamp((p.getY(k) - 2.6) / 3.0, 0, 1);
      const sun = THREE.MathUtils.clamp(0.5 + (p.getX(k) - lean + p.getZ(k)) * 0.15, 0, 1);
      c.copy(dark).lerp(light, up * 0.75 + sun * 0.25);
      c.offsetHSL(tint, 0, 0);
      colours.set([c.r, c.g, c.b], k * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    clumps.push(geo);
  });
  g.add(new THREE.Mesh(mergeGeometries(clumps)!, LEAVES));
  for (const geo of clumps) geo.dispose();
  enableShadows(g);
  return g;
}
