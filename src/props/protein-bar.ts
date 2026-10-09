import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ROUND } from '../world/interior';
import { textTexture } from '../world/text-texture';

/** A protein bar's length (along x), sized for dinosaur paws. */
export const BAR_LENGTH = 0.7;

export interface ProteinBar {
  group: THREE.Group;
  /** 0 = sealed; 1 = wrapper torn open, the bar peeking out. */
  setOpen(k: number): void;
  /** 0 = whole; 1 = all gone (just the wrapper left). */
  setEaten(k: number): void;
}

const wrapperTextures = new Map<string, THREE.Texture>();
function wrapperTexture(colour: string, flavour: string): THREE.Texture {
  const key = `${colour}|${flavour}`;
  let tex = wrapperTextures.get(key);
  if (!tex) {
    tex = textTexture(
      512,
      160,
      (ctx, w, h) => {
        ctx.fillStyle = colour;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0, h * 0.72, w, h * 0.1);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${h * 0.34}px ${ROUND}`;
        ctx.fillText('PROTEIN 40g', w / 2, h * 0.36);
        ctx.font = `600 ${h * 0.17}px ${ROUND}`;
        ctx.fillText(flavour, w / 2, h * 0.64);
      },
      ['700 40px Fredoka'],
    );
    wrapperTextures.set(key, tex);
  }
  return tex;
}

/**
 * A wrapped protein bar, label on top; origin in its middle, long side along x. It can tear open at the +x end
 * (the chocolate bar slides out) and be eaten down from there.
 */
export function createProteinBar({ colour = '#e2582b', flavour = 'Choc Fudge Brownie' } = {}): ProteinBar {
  const group = new THREE.Group();
  const H = 0.1,
    D = 0.22;
  const label = new THREE.MeshStandardMaterial({
    map: wrapperTexture(colour, flavour),
    roughness: 0.4,
    metalness: 0.2,
  });
  const plain = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.4, metalness: 0.2 });
  // the wrapper: box faces are +x, -x, +y (label), -y, +z, -z
  const wrapper = new THREE.Mesh(new RoundedBoxGeometry(BAR_LENGTH, H, D, 2, 0.03), [
    plain,
    plain,
    label,
    plain,
    plain,
    plain,
  ]);
  wrapper.castShadow = true;
  group.add(wrapper);
  const crimps = [-1, 1].map(s => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.35, D * 1.05), plain);
    c.position.x = s * (BAR_LENGTH / 2 + 0.02);
    group.add(c);
    return c;
  });
  // the bar inside: chocolate, with a nubbly top
  const choc = new THREE.Mesh(
    new RoundedBoxGeometry(BAR_LENGTH * 0.95, H * 0.85, D * 0.88, 2, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x5a3220, roughness: 0.7 }),
  );
  choc.castShadow = true;
  group.add(choc);
  choc.visible = false;

  let open = 0,
    eaten = 0;
  function layout() {
    // the bar slides out of the torn end; the wrapper peels back toward -x; eating shortens what sticks out
    const out = open * BAR_LENGTH * 0.45;
    const left = (1 - eaten) * BAR_LENGTH * 0.95;
    choc.visible = open > 0 && eaten < 1;
    choc.scale.x = Math.max(0.01, left / (BAR_LENGTH * 0.95));
    choc.position.x = out + (left - BAR_LENGTH * 0.95) / 2;
    const peel = 1 - open * 0.45;
    wrapper.scale.x = peel;
    wrapper.position.x = -BAR_LENGTH * (1 - peel) * 0.5;
    crimps[1]!.visible = open < 0.05;
  }
  return {
    group,
    setOpen(k) {
      open = k;
      layout();
    },
    setEaten(k) {
      eaten = k;
      layout();
    },
  };
}
