import { createRory, idle } from '../characters/rory.js';
import { enableShadows } from '../characters/materials.js';
import { createGuitar } from '../props/guitar.js';
import { addMohawk } from '../props/mohawk.js';
import { addTattoo } from '../props/tattoo.js';

/** Straps Rory's pink guitar on (attached to the torso, so it moves with him). */
export function addGuitar(rig) {
  const guitar = createGuitar({ color: 0xff5fa2 }); // pink
  guitar.position.set(-0.15, 1.05, 0.98);
  guitar.rotation.set(0.1, 0, 0.95);
  enableShadows(guitar);
  rig.torso.add(guitar);
  rig.guitar = guitar;
  return guitar;
}

/** Holding-the-guitar arm: the left tiny arm rests on the strings. */
export const strumArm = rig => rig.arms.find(a => a.userData.side === -1);
export const freeArm = rig => rig.arms.find(a => a.userData.side === 1);

/** Rory in his rock-star pose: guitar on, one tiny arm up, eyes shut, mouth open mid-"RAWR". */
export function createRockerRory() {
  const rory = createRory();
  addTattoo(rory);                     // before posing: it's projected onto the rig at rest
  idle(rory, 0.3, { eyesOpen: 0.14 }); // happy squeezed-shut eyes
  addGuitar(rory);
  addMohawk(rory);
  rory.setMouth(1);
  rory.head.rotation.set(-0.18, 0, 0.22); // head thrown back, tilted
  rory.torso.rotation.z = -0.06;
  freeArm(rory).rotation.set(0.3, 0, 2.2);  // 🤘 arm up
  strumArm(rory).rotation.set(-0.9, 0, -0.2);
  rory.tail.rotation.y = 0.3;
  return rory;
}
