import * as THREE from 'three';

/**
 * Dark concert stage: purple gradient, colored spotlights, haze beams and a round stage.
 * Returns { pulse(k) } — call with 0..1 each frame to flash the lights (e.g. on the beat).
 */
/** The concert stage's lights; `pulse(k)` flashes them (0..1), e.g. on the beat. */
export interface RockStage {
  pulse(k: number): void;
}

export function createRockStage(scene: THREE.Scene): RockStage {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const g = c.getContext('2d')!,
    gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#0d0518');
  gr.addColorStop(0.55, '#2a0e4a');
  gr.addColorStop(1, '#4a1660');
  g.fillStyle = gr;
  g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;

  scene.add(new THREE.HemisphereLight(0xd9d4ff, 0x2a0e3a, 0.5));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.3); // warm front key keeps Rory cute
  key.position.set(2, 5, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 7, bottom: -3 });
  scene.add(key);

  const beamMat = (color: number) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  const lights: {
    spot: THREE.SpotLight;
    beam: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>;
    base: number;
  }[] = [];
  for (const [x, color] of [
    [-5, 0xff3fa4],
    [5, 0x3fd4ff],
    [0, 0xffd36b],
  ] as const) {
    const spot = new THREE.SpotLight(color, x === 0 ? 10 : 35, 30, 0.42, 0.6, 1.4);
    spot.position.set(x, 9, -1);
    spot.target.position.set(x * 0.3, 0, -3); // light the stage behind Rory, not Rory (keeps his mint color)
    scene.add(spot, spot.target);
    // visible haze cone from the light to the floor
    const len = 10;
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.4, len, 32, 1, true), beamMat(color));
    beam.position.set(x * 0.55, 9 - len / 2 + 0.3, -4); // behind the performers, so haze never washes them out
    beam.rotation.z = Math.atan2(x, len) * 0.9;
    scene.add(beam);
    lights.push({ spot, beam, base: spot.intensity });
  }
  const rim = new THREE.DirectionalLight(0xc56bff, 2.5); // purple back-rim for the silhouette
  rim.position.set(0, 4, -8);
  scene.add(rim);

  const stage = new THREE.Mesh(
    new THREE.CylinderGeometry(7, 7.3, 0.5, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a1838, roughness: 0.35, metalness: 0.2 }),
  );
  stage.position.y = -0.25;
  stage.receiveShadow = true;
  scene.add(stage);

  for (let i = 0; i < 24; i++) {
    // floor bulbs along the stage edge
    const a = (i / 24) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff3fa4 : 0xffd36b }),
    );
    bulb.position.set(Math.cos(a) * 7.1, 0.02, Math.sin(a) * 7.1);
    scene.add(bulb);
  }

  return {
    pulse(k: number) {
      for (const l of lights) {
        l.spot.intensity = l.base * (1 + k * 1.2);
        l.beam.material.opacity = 0.09 + k * 0.08;
      }
    },
  };
}
