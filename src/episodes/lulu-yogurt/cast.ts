import { createStegosaurus, STEGGY_COLORS } from '../../characters/stegosaurus';
import { addBandTee } from '../../props/band-tee';
import { addShortHair } from '../../props/short-hair';
import { ROUND } from '../../world/interior';

/** Mirta's colours: fair and rosy, dusty-rose plates, blue eyes; the bow tie matches her black uniform. */
const MIRTA_COLORS = {
  ...STEGGY_COLORS,
  body: 0xf6d6c4,
  belly: 0xfff4ec,
  plates: 0xd99aa5,
  plateTips: 0xf0c2c9,
  cheeks: 0xff8fa3,
  eyes: 0x4a90d9,
  bowTie: 0x15151a,
  mustache: null,
};

/**
 * Mirta: the office's cleaner. A round Stegosaurus (not Silvi's build), short blond hair, and the black Facilities
 * uniform with the word printed on the chest in Papo Pako orange.
 */
export function createMirta() {
  const rig = createStegosaurus(MIRTA_COLORS);
  addBandTee(rig, { text: 'FACILITIES', color: 0x15151a, ink: '#ff7a1a', font: ROUND });
  addShortHair(rig, { color: 0xe8c872, length: 0.36, seed: 21 });
  return rig;
}
