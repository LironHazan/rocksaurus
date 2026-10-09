import * as THREE from 'three';
import { enableShadows } from '../characters/materials';
import { cylinder, mat } from '../world/interior';

/** A coffee cup on a saucer; `drink` colours the top. */
export function createCup(cup: number, drink: number): THREE.Group {
  const g = new THREE.Group();
  const saucer = cylinder(0.32, 0.26, 0.05, mat(cup, 0.3), 28);
  g.add(saucer);
  const body = cylinder(0.2, 0.15, 0.32, mat(cup, 0.3), 28);
  body.position.y = 0.05;
  g.add(body);
  const top = cylinder(0.185, 0.185, 0.01, mat(drink, 0.4), 28);
  top.position.y = 0.33;
  g.add(top);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16), mat(cup, 0.3));
  handle.position.set(0.22, 0.22, 0);
  g.add(handle);
  enableShadows(g);
  return g;
}
