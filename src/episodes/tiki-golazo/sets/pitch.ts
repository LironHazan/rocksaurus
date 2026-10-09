import * as THREE from 'three';
import { rng } from '../../../engine/math';
import { ball, enableShadows } from '../../../characters/materials';
import { box, cylinder, mat, ROUND } from '../../../world/interior';
import { textTexture } from '../../../world/text-texture';
import { createGoal } from '../../../props/soccer';
import { createSchool, createTree } from '../../../world/school';

// Where things are, for the choreography. The camera looks from +z; Tiki attacks toward +x.
const FIELD = { halfX: 15, halfZ: 9 };
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

  const school = createSchool();
  school.position.set(-3, 0, -24);
  scene.add(school);

  const r = rng(12);
  const variants = [createTree(r), createTree(r), createTree(r)]; // built once, cloned (shared geometry)
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
