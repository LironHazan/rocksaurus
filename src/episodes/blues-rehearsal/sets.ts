import * as THREE from 'three';
import { TIKI_SPOT } from '../../world/rehearsal-room';

/** Where Lulu comes in from (the front right, out of shot at first), on her way to the kit. */
export const LULU_FROM = new THREE.Vector3(7.0, 0, 3.8);
/** Tiki Taka's way in: from the back left, along the back wall behind the amp, then forward to his spot. */
export const TIKI_PATH = [new THREE.Vector3(-8.5, 0, -2.8), new THREE.Vector3(-1.0, 0, -2.9), TIKI_SPOT.at] as const;
