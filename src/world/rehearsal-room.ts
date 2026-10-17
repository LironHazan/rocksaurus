import * as THREE from 'three';
import { addKeyLight, box, createRoom, cylinder, mat, picture, ROUND } from './interior';
import { ball } from '../characters/materials';

// The band's rehearsal room: a small, warm, slightly worn room. Grey acoustic foam on the walls, a red rug, Rory's amp
// behind him, a floor lamp, a couple of posters, and the kit in the corner. Lit low and warm, like 7 PM.

/** Where Rory stands (facing us, turned a little toward the kit), and where the kit is (turned toward him). */
export const RORY_SPOT = { at: new THREE.Vector3(-1.7, 0, 0.8), yaw: 0.3 } as const;
export const KIT_SPOT = { at: new THREE.Vector3(2.4, 0, -1.2), yaw: -0.45 } as const;
/** Where Tiki Taka plays: between them, a step back, turned to Rory. */
export const TIKI_SPOT = { at: new THREE.Vector3(0.5, 0, -1.4), yaw: -0.2 } as const;

/** The room's foam: a grid of tiles on the back wall, `cols` × `rows`, each this big. */
const FOAM = { cols: 7, rows: 4, size: 1.3, gap: 0.12 } as const;

/** A wall of acoustic foam tiles: wedge-cut squares, alternating direction (a checkerboard of ridges). */
function foamWall(cols: number, rows: number): THREE.Group {
  const g = new THREE.Group();
  const foam = mat(0x3b3c44, 1);
  const ridges = 4;
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const tile = new THREE.Group();
      for (let i = 0; i < ridges; i++) {
        const ridge = box(FOAM.size / ridges - 0.02, FOAM.size, 0.16, foam);
        ridge.position.x = -FOAM.size / 2 + (i + 0.5) * (FOAM.size / ridges);
        tile.add(ridge);
      }
      tile.rotation.z = (c + r) % 2 ? Math.PI / 2 : 0;
      tile.position.set((c - (cols - 1) / 2) * (FOAM.size + FOAM.gap), r * (FOAM.size + FOAM.gap) + 0.4, 0);
      if (tile.rotation.z) tile.position.y += FOAM.size / 2; // rotated about its base: re-centre it
      g.add(tile);
    }
  return g;
}

/** Rory's amp: a combo, tolex and a grille cloth, the control panel along the top. Faces +z. */
function amp(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(1.9, 1.7, 1.0, mat(0x1b1b20, 0.7)));
  const grille = picture(
    1.66,
    1.12,
    (ctx, w, h) => {
      ctx.fillStyle = '#c9b48a'; // wheat grille cloth
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(90, 70, 40, 0.35)';
      for (let x = 0; x < w; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h * 0.2, h);
        ctx.stroke();
      }
    },
    { frame: null },
  );
  grille.position.set(0, 0.68, 0.5);
  const panel = box(1.7, 0.26, 0.04, mat(0x2a2a30, 0.4, { metalness: 0.4 }));
  panel.position.set(0, 1.38, 0.5);
  g.add(grille, panel);
  for (let i = 0; i < 6; i++) g.add(ball(0.05, mat(0xe8e8e8, 0.3), [-0.6 + i * 0.24, 1.51, 0.54], [1, 1, 0.6], 12));
  g.add(ball(0.04, new THREE.MeshBasicMaterial({ color: 0xff3b3b }), [0.75, 1.51, 0.53], [1, 1, 1], 10)); // on
  return g;
}

/** A floor lamp with a warm shade, and its light. */
function floorLamp(): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(0.32, 0.36, 0.08, mat(0x2a2a30, 0.4)));
  const pole = cylinder(0.04, 0.04, 4.2, mat(0x2a2a30, 0.4), 8);
  const shade = cylinder(
    0.55,
    0.35,
    0.7,
    new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb860, emissiveIntensity: 0.6 }),
  );
  shade.position.y = 4.0;
  const glow = new THREE.PointLight(0xffb870, 14, 9, 1.6);
  glow.position.y = 4.1;
  g.add(pole, shade, glow);
  return g;
}

/** A poster: a dark sheet, a title, and a guitar or drum doodle. */
function poster(title: string, sub: string, colour: string): THREE.Group {
  return picture(1.6, 2.2, (ctx, w, h) => {
    ctx.fillStyle = '#17121c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = colour;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${w * 0.16}px ${ROUND}`;
    ctx.fillText(title, w / 2, h * 0.3);
    ctx.font = `600 ${w * 0.08}px ${ROUND}`;
    ctx.fillStyle = '#f2efe6';
    ctx.fillText(sub, w / 2, h * 0.45);
    ctx.font = `${w * 0.36}px ${ROUND}`;
    ctx.fillText(title.includes('BLUES') ? '🎸' : '🥁', w / 2, h * 0.72);
  });
}

export function createRehearsalRoom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2328);
  createRoom(scene, { wall: 0x6a5452, floor: 0x6b4a32, width: 18, depth: 14, back: -4 });
  scene.add(new THREE.HemisphereLight(0xffe8d0, 0x3a2a22, 1.25));
  addKeyLight(scene, 0xffd8a8, 2.1, { from: [3, 9, 9], reach: 8, top: 8 });
  // a soft spot on Rory, from the front left
  const spot = new THREE.SpotLight(0xffc890, 40, 16, 0.45, 0.6, 1.2);
  spot.position.set(-4, 8, 6);
  spot.target.position.copy(RORY_SPOT.at).setY(2);
  scene.add(spot, spot.target);

  const foam = foamWall(FOAM.cols, FOAM.rows);
  foam.position.set(0, 0, -3.88);
  scene.add(foam);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), mat(0x8a2a2e, 0.95));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.3, 0.01, -0.2);
  rug.receiveShadow = true;
  scene.add(rug);

  const combo = amp();
  combo.position.set(RORY_SPOT.at.x - 1.2, 0, RORY_SPOT.at.z - 2.4);
  combo.rotation.y = 0.3;
  const lamp = floorLamp();
  lamp.position.set(-6.2, 0, -2.6);
  const blues = poster('BLUES NIGHT', 'every thursday', '#ffd36b');
  blues.position.set(-6.2, 5.6, -3.7);
  const groove = poster('IN THE POCKET', 'since 1952', '#ff6fa8');
  groove.position.set(6.2, 5.4, -3.7);
  scene.add(combo, lamp, blues, groove);
  // a stool by the kit with a water bottle, the cable from the amp across the rug
  const stool = cylinder(0.5, 0.45, 1.3, mat(0x3a2a20, 0.7));
  stool.position.set(5.2, 0, 0.6);
  const bottle = cylinder(0.12, 0.12, 0.55, mat(0x4aa3df, 0.3));
  bottle.position.set(5.2, 1.3, 0.6);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(combo.position.x + 0.6, 0.04, combo.position.z + 0.6),
        new THREE.Vector3(-2.4, 0.04, 0.4),
        new THREE.Vector3(-1.9, 0.04, 1.2),
        new THREE.Vector3(RORY_SPOT.at.x, 1.1, RORY_SPOT.at.z + 0.6),
      ]),
      40,
      0.03,
      6,
    ),
    mat(0x15151a, 0.5),
  );
  scene.add(stool, bottle, cable);
  return { scene };
}
