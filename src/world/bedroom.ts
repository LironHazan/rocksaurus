import * as THREE from 'three';
import { box, createRoom, createScreen, mat, picture, MONO, ROUND } from './interior';
import { textTexture } from './text-texture';

export const BED_TOP = 1.05;

/** A small canvas-texture panel that is repainted when its text changes (alarm clock, pager screen). */
function display(
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number, text: string) => void,
) {
  let text = '';
  const draw = (ctx: CanvasRenderingContext2D, cw: number, ch: number) => paint(ctx, cw, ch, text);
  const tex = textTexture(256, Math.round((256 * h) / w), draw);
  const canvas = tex.image as HTMLCanvasElement;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
  );
  return {
    mesh,
    set(next: string) {
      if (next === text) return;
      text = next;
      draw(canvas.getContext('2d')!, canvas.width, canvas.height);
      tex.needsUpdate = true;
    },
  };
}

/** Lulu's bedroom at 3 AM: moonlight, a big bed, the nightstand with an alarm clock and THE PAGER. */
export function createBedroom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1026);
  createRoom(scene, { wall: 0x2a3366, floor: 0x3a2f45 });

  const hemi = new THREE.HemisphereLight(0x6f86d6, 0x1a1530, 0.9);
  const moon = new THREE.DirectionalLight(0x9db4ff, 1.4);
  moon.position.set(-4, 7, 5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.radius = 6;
  Object.assign(moon.shadow.camera, { left: -8, right: 8, top: 8, bottom: -2, near: 1, far: 30 });
  scene.add(hemi, moon);

  const view = picture(
    3,
    2.4,
    (ctx, w, h) => {
      ctx.fillStyle = '#0d1440';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) ctx.fillRect((i * 73) % w, (i * 41) % (h * 0.8), 3, 3);
      ctx.fillStyle = '#fff6d6';
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.3, h * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c8d0ff';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, w, h);
    },
    { frame: 0x9aa4d6, emissive: true },
  );
  view.position.set(2.6, 5, -3.95);
  scene.add(view);

  // bed (headboard on the left, Lulu's neck lies along the pillow)
  const bed = new THREE.Group();
  const frame = box(6, 0.55, 3.6, mat(0x5b4a7a, 0.7));
  const mattress = box(5.8, 0.5, 3.4, mat(0xe8e4f4, 0.9));
  mattress.position.y = 0.55;
  const headboard = box(0.3, 2.6, 3.6, mat(0x5b4a7a, 0.7));
  headboard.position.x = -3.05;
  const pillow = box(1.3, 0.35, 2.4, mat(0xffffff, 0.9));
  pillow.position.set(-2.2, BED_TOP, 0);
  bed.add(frame, mattress, headboard, pillow);
  bed.position.set(0, 0, -0.6);
  scene.add(bed);

  const blanket = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat(0x5b7bd6, 0.95));
  blanket.castShadow = blanket.receiveShadow = true;
  scene.add(blanket);

  // nightstand by the headboard: alarm clock + pager
  const stand = box(1.3, 1.3, 1.2, mat(0x5b4a7a, 0.7));
  stand.position.set(-4.1, 0, 0.2);
  scene.add(stand);
  const clockBody = box(0.7, 0.4, 0.3, mat(0x16121f, 0.5));
  clockBody.position.set(-4.3, 1.3, 0.25);
  scene.add(clockBody);
  const clock = display(0.6, 0.28, (ctx, w, h, text) => {
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff3b3b';
    ctx.font = `700 ${h * 0.7}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
  });
  clock.mesh.position.set(-4.3, 1.5, 0.41);
  scene.add(clock.mesh);

  const pager = new THREE.Group();
  pager.add(box(0.55, 0.16, 0.36, mat(0x26262e, 0.45)));
  const pagerScreen = display(0.42, 0.24, (ctx, w, h, text) => {
    const alert = text !== '';
    ctx.fillStyle = alert ? '#ffdede' : '#3a4a3a';
    ctx.fillRect(0, 0, w, h);
    if (!alert) return;
    ctx.fillStyle = '#c1121f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const [a = '', b = ''] = text.split('\n');
    ctx.font = `700 ${h * 0.34}px ${MONO}`;
    ctx.fillText(a, w / 2, h * 0.32);
    ctx.font = `700 ${h * 0.26}px ${MONO}`;
    ctx.fillText(b, w / 2, h * 0.72);
  });
  pagerScreen.mesh.rotation.x = -Math.PI / 2;
  pagerScreen.mesh.position.y = 0.17;
  pager.add(pagerScreen.mesh);
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x330000, toneMapped: false }),
  );
  led.position.set(0.22, 0.17, -0.13);
  pager.add(led);
  pager.position.set(-3.75, 1.3, 0.45);
  pager.rotation.y = 0.4;
  scene.add(pager);
  const alarm = new THREE.PointLight(0xff2a2a, 0, 7, 1.5);
  alarm.position.set(-3.6, 2.2, 1);
  scene.add(alarm);

  // laptop on the bed. The lid hinges at the back edge: lid.rotation.x = -1.9 opens it, screen toward the user.
  const laptop = new THREE.Group();
  laptop.add(box(1.5, 0.06, 1, mat(0xb8bcc8, 0.3, { metalness: 0.5 })));
  const lid = new THREE.Group();
  lid.position.set(0, 0.06, -0.5);
  const lidShell = box(1.5, 0.05, 1, mat(0xb8bcc8, 0.3, { metalness: 0.5 }));
  lidShell.position.z = 0.5;
  const screen = createScreen(1.38, 0.9, { header: 'agent', px: 900 });
  screen.mesh.rotation.x = Math.PI / 2; // faces down onto the keys while closed
  screen.mesh.position.set(0, -0.005, 0.5);
  lid.add(lidShell, screen.mesh);
  laptop.add(lid);
  scene.add(laptop);
  const laptopGlow = new THREE.PointLight(0xaec3ff, 0, 5, 1.6);
  scene.add(laptopGlow);

  // Zzz
  const zMat = (i: number) =>
    new THREE.SpriteMaterial({
      map: textTexture(128, 128, (ctx, w, h) => {
        ctx.fillStyle = '#e8ecff';
        ctx.font = `700 ${h * 0.8}px ${ROUND}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Z', w / 2, h / 2);
      }),
      transparent: true,
      depthWrite: false,
      opacity: 0,
      rotation: (i - 1) * 0.2,
    });
  const zzz = [0, 1, 2].map(i => {
    const s = new THREE.Sprite(zMat(i));
    scene.add(s);
    return s;
  });

  return { scene, blanket, clock, pager, pagerScreen, led, alarm, laptop, lid, screen, laptopGlow, zzz, hemi, moon };
}
