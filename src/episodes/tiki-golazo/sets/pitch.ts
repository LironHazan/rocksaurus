import * as THREE from 'three';
import { rng } from '../../../engine/math';
import { ball, enableShadows } from '../../../characters/materials';
import { box, cylinder, mat, ROUND } from '../../../world/interior';
import { textTexture } from '../../../world/text-texture';
import { createGoal } from '../../../props/soccer';
import { taperedTube } from '../../../props/tube';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Where things are, for the choreography. The camera looks from +z; Tiki attacks toward +x.
export const FIELD = { halfX: 15, halfZ: 9 };
/** The goal line Tiki scores on; the goal's mouth faces −x. */
export const GOAL = { x: 12, width: 7, height: 3.6 };
/** The far touchline, where the kids stand and cheer. */
export const SIDELINE_Z = -10.5;

const SCORE_FONT = "'Bungee'";

/** Mowed stripes and white lines, painted once. */
function grassTexture(): THREE.Texture {
  const pad = 2; // grass beyond the lines, in metres
  const W = 2048,
    H = Math.round((W * (FIELD.halfZ + pad)) / (FIELD.halfX + pad));
  const sx = W / (FIELD.halfX * 2 + pad * 2),
    sz = H / (FIELD.halfZ * 2 + pad * 2);
  const X = (x: number) => (x + FIELD.halfX + pad) * sx;
  const Z = (z: number) => (z + FIELD.halfZ + pad) * sz;
  return textTexture(W, H, (ctx, w, h) => {
    ctx.fillStyle = '#5cbf5a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#6ccc68';
    for (let x = -FIELD.halfX - pad, i = 0; x < FIELD.halfX + pad; x += 2.5, i++)
      if (i % 2) ctx.fillRect(X(x), 0, 2.5 * sx, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 0.14 * sx;
    ctx.strokeRect(X(-FIELD.halfX), Z(-FIELD.halfZ), FIELD.halfX * 2 * sx, FIELD.halfZ * 2 * sz);
    ctx.beginPath();
    ctx.moveTo(X(0), Z(-FIELD.halfZ));
    ctx.lineTo(X(0), Z(FIELD.halfZ));
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(X(0), Z(0), 3 * sx, 3 * sz, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (const s of [-1, 1]) {
      const gx = s * GOAL.x;
      // penalty box and six-yard box
      ctx.strokeRect(Math.min(X(gx), X(gx - s * 5)), Z(-6), 5 * sx, 12 * sz);
      ctx.strokeRect(Math.min(X(gx), X(gx - s * 2)), Z(-4.2), 2 * sx, 8.4 * sz);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(X(0), Z(0), 0.2 * sx, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** The school across the road, whose court the dads play on: a bright, boxy building with round windows. */
function daycare(): THREE.Group {
  const g = new THREE.Group();
  const walls = box(14, 5.2, 4, mat(0xffe3a3, 0.9));
  g.add(walls);
  // a gabled roof: wall-coloured gable ends under two tiled slopes with an overhang
  const rise = 2.0;
  const gable = new THREE.Shape();
  gable.moveTo(-2, 0);
  gable.lineTo(2, 0);
  gable.lineTo(0, rise);
  gable.closePath();
  const ends = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: 14, bevelEnabled: false }), mat(0xffe3a3, 0.9));
  ends.rotation.y = Math.PI / 2;
  ends.position.set(-7, 5.2, 0);
  g.add(ends);
  const slope = Math.hypot(2, rise) + 0.5;
  for (const s of [-1, 1]) {
    const slab = box(15, 0.2, slope, mat(0xd9604a, 0.8));
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
  const ridge = cylinder(0.16, 0.16, 15.2, mat(0xb84a38, 0.8), 12);
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
  const door = entrance(glassMat);
  door.position.z = 2.0;
  g.add(door);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 0.9),
    new THREE.MeshBasicMaterial({
      map: textTexture(
        1024,
        176,
        (ctx, w, h) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(4, 4, w - 8, h - 8, 40);
          ctx.fill();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `${h * 0.62}px 'Metal Mania', serif`;
          ctx.fillStyle = '#111014';
          ctx.fillText('School of Rock', w / 2, h * 0.54);
        },
        ["40px 'Metal Mania'"],
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
function entrance(glassMat: THREE.Material): THREE.Group {
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

  const paint = mat(0x2f6fb5, 0.5);
  const panel = mat(0x285f9c, 0.55);
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
function treeVariant(r: () => number): THREE.Group {
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

/** A flip scoreboard on legs. `setScore(home, away)` swaps the painted numbers. */
function scoreboard() {
  const g = new THREE.Group();
  for (const x of [-1.6, 1.6]) {
    const leg = cylinder(0.08, 0.08, 2.2, mat(0x555a66, 0.4), 10);
    leg.position.x = x;
    g.add(leg);
  }
  const board = box(4.2, 1.9, 0.18, mat(0x26303f, 0.6));
  board.position.y = 1.15; // boxes stand on their base
  g.add(board);
  const faces = new Map<string, THREE.Texture>();
  const face = (home: number, away: number) => {
    const key = `${home}-${away}`;
    if (!faces.has(key))
      faces.set(
        key,
        textTexture(
          512,
          232,
          (ctx, w, h) => {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffe08a';
            ctx.font = `${h * 0.17}px ${SCORE_FONT}, sans-serif`;
            ctx.fillText('HOME', w * 0.25, h * 0.17);
            ctx.fillText('AWAY', w * 0.75, h * 0.17);
            ctx.fillStyle = '#ffffff';
            for (const [i, n] of [home, away].entries()) {
              ctx.fillStyle = '#11161f';
              ctx.fillRect(w * (0.08 + i * 0.5), h * 0.32, w * 0.34, h * 0.6);
              ctx.fillStyle = '#ffffff';
              ctx.font = `${h * 0.5}px ${SCORE_FONT}, sans-serif`;
              ctx.fillText(String(n), w * (0.25 + i * 0.5), h * 0.64);
            }
          },
          [`40px ${SCORE_FONT}`],
        ),
      );
    return faces.get(key)!;
  };
  const material = new THREE.MeshBasicMaterial({ map: face(0, 0), toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.8), material);
  screen.position.set(0, 2.1, 0.1);
  g.add(screen);
  enableShadows(g);
  return {
    group: g,
    setScore(home: number, away: number) {
      material.map = face(home, away);
    },
  };
}

/** A hand-painted cardboard sign on a stick, for the kids to wave. */
export function cheerSign(text: string): THREE.Group {
  const g = new THREE.Group();
  const stick = cylinder(0.035, 0.035, 1.4, mat(0xc89a6a, 0.9), 8);
  g.add(stick);
  const card = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 0.03), [
    ...Array(4).fill(mat(0xd8b88c, 0.95)),
    new THREE.MeshStandardMaterial({
      map: textTexture(
        384,
        216,
        (ctx, w, h) => {
          ctx.fillStyle = '#fff6e0';
          ctx.fillRect(0, 0, w, h);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `700 ${h * 0.3}px ${ROUND}`;
          text.split('\n').forEach((line, i, all) => {
            ctx.fillStyle = i ? '#ff6b8b' : '#3a78b8';
            ctx.fillText(line, w / 2, h * (0.5 + (i - (all.length - 1) / 2) * 0.38));
          });
        },
        ['700 40px Fredoka'],
      ),
      roughness: 0.95,
    }),
    mat(0xd8b88c, 0.95),
  ]);
  card.position.y = 1.7;
  g.add(card);
  enableShadows(g);
  return g;
}

/** Saturday morning at the park pitch next to the daycare. */
export function createPitch() {
  const scene = new THREE.Scene();
  const sky = textTexture(4, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#7cc6ff');
    gr.addColorStop(0.65, '#cdeaff');
    gr.addColorStop(1, '#fff3dd');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  });
  scene.background = sky;
  scene.fog = new THREE.Fog(0xd9efff, 34, 80);

  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x9fd38f, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.3);
  sun.position.set(6, 14, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 16, bottom: -14, near: 1, far: 50 });
  scene.add(sun);

  // the grass beyond the pitch, then the pitch itself
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), mat(0x58b556, 1));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = -0.01;
  lawn.receiveShadow = true;
  scene.add(lawn);
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD.halfX * 2 + 4, FIELD.halfZ * 2 + 4),
    new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 0.95 }),
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  scene.add(pitch);

  const goal = createGoal({ width: GOAL.width, height: GOAL.height });
  goal.group.position.set(GOAL.x, 0, 0);
  scene.add(goal.group);
  const farGoal = createGoal({ width: GOAL.width, height: GOAL.height });
  farGoal.group.position.set(-GOAL.x, 0, 0);
  farGoal.group.rotation.y = Math.PI;
  scene.add(farGoal.group);

  const school = daycare();
  school.position.set(-3, 0, -24);
  scene.add(school);

  const r = rng(12);
  const variants = [treeVariant(r), treeVariant(r), treeVariant(r)]; // built once, cloned (shared geometry)
  for (let i = 0; i < 16; i++) {
    const t = variants[i % variants.length]!.clone();
    t.rotation.y = r() * Math.PI * 2;
    const x = -34 + i * 4.6 + (r() - 0.5) * 2;
    if (Math.abs(x + 3) < 8) continue; // keep the daycare in view
    t.position.set(x, 0, -21 - r() * 6);
    t.scale.setScalar(1.1 + r() * 0.6);
    scene.add(t);
  }
  // low white fence along the far touchline
  const rail = mat(0xffffff, 0.6);
  for (let x = -18; x <= 18; x += 1.5) {
    const post = box(0.12, 0.9, 0.12, rail);
    post.position.set(x, 0, SIDELINE_Z - 1.6);
    scene.add(post);
  }
  for (const y of [0.4, 0.75]) {
    const bar = box(36, 0.08, 0.06, rail);
    bar.position.set(0, y, SIDELINE_Z - 1.6);
    scene.add(bar);
  }

  const board = scoreboard();
  board.group.position.set(9.5, 0, SIDELINE_Z - 0.6);
  scene.add(board.group);

  // a pile of kit bags and a cool box where the dads dumped them
  const bagMat = [mat(0x3a78b8, 0.8), mat(0xff8c42, 0.8), mat(0x8a5ad6, 0.8)];
  bagMat.forEach((m, i) => {
    const bag = ball(0.55, m, [-9 + i * 1.1, 0.35, SIDELINE_Z - 0.4], [1.4, 0.65, 0.75], 20);
    scene.add(bag);
  });
  const coolBox = box(1.0, 0.75, 0.65, mat(0xff6b8b, 0.6));
  coolBox.position.set(-5.6, 0, SIDELINE_Z - 0.4);
  scene.add(coolBox);

  return { scene, goal, board };
}
