import * as THREE from 'three';
import { disposeObject } from '../engine/dispose';
import type { Episode } from '../engine/types';
import { createRory, idle, resetPose } from '../characters/rory';
import { reachArm, releaseArm } from '../characters/reach';
import { addMohawk } from '../props/mohawk';
import { addTattoo } from '../props/tattoo';
import { createRockStage } from '../world/rock-stage';
import { textTexture } from '../world/text-texture';
import { ROUND } from '../world/interior';
import { playKeyboardPart } from '../audio/keyboard-part';

// The channel's end card: Rory on the Rocksaurus stage, bouncing, holding up a cardboard sign that asks you to
// subscribe. Every new Short ends with it: `export default withOutro(episode)`.

/** Seconds the end card adds to an episode. */
export const OUTRO_LEN = 2.5;

function subscribeSign(): THREE.Mesh {
  const card = () => new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.95 });
  const face = new THREE.MeshStandardMaterial({
    roughness: 0.9,
    map: textTexture(
      512,
      336,
      (ctx, w, h) => {
        ctx.fillStyle = '#fff6e0';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e62117';
        ctx.beginPath();
        ctx.roundRect(w * 0.12, h * 0.1, w * 0.76, h * 0.32, h * 0.06);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${h * 0.15}px ${ROUND}`;
        ctx.fillText('SUBSCRIBE', w / 2, h * 0.27);
        ctx.fillStyle = '#1b1b22';
        ctx.font = `700 ${h * 0.1}px ${ROUND}`;
        ctx.fillText('for more', w / 2, h * 0.57);
        ctx.fillText('Rocksaurus shorts!', w / 2, h * 0.71);
        ctx.font = `${h * 0.13}px ${ROUND}`;
        ctx.fillText('🦖🤘', w / 2, h * 0.87);
      },
      ['700 40px Fredoka'],
    ),
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 0.06), [card(), card(), card(), card(), face, card()]);
  sign.castShadow = true;
  return sign;
}

/** The end card's own little scene. `update(k)` takes seconds since the card started. */
function createOutro(camera: THREE.PerspectiveCamera) {
  const scene = new THREE.Scene();
  const lights = createRockStage(scene);
  const rory = createRory();
  addMohawk(rory);
  addTattoo(rory);
  scene.add(rory.root);
  const sign = subscribeSign();
  scene.add(sign);
  const at = new THREE.Vector3();
  return {
    scene,
    update(k: number) {
      resetPose(rory);
      for (const arm of rory.arms) releaseArm(arm);
      idle(rory, k, { eyesOpen: 1 });
      const bounce = Math.abs(Math.sin(k * 5));
      rory.root.position.set(0, bounce * 0.15, 0.6);
      rory.setMouth(0.45);
      lights.pulse(bounce * 0.6);
      // the sign, held up in front of his chest, rocking with the bounce
      rory.root.updateMatrixWorld(true);
      rory.torso.localToWorld(sign.position.set(0, 1.05, 1.45));
      sign.rotation.set(-0.05, 0, Math.sin(k * 5) * 0.06);
      sign.updateMatrixWorld(true);
      for (const arm of rory.arms) {
        const side = arm.userData.side as number;
        reachArm(arm, arm.parent!.worldToLocal(sign.localToWorld(at.set(side * 0.7, -0.45, -0.05))));
      }
      camera.position.set(0, 2.6, 7.8);
      camera.lookAt(0, 2.0, 0.8);
    },
    dispose() {
      disposeObject(scene);
    },
  };
}

/** A bright little "ta-da" for the end card: a rolled major chord. */
function sting(bus: AudioNode, at: number) {
  playKeyboardPart(bus, at, {
    bpm: 120,
    sound: 'piano',
    gain: 0.8,
    notes: [
      [0, 'C3', 4, 0.5, 'L'],
      [0, 'E4', 4, 0.4],
      [0.12, 'G4', 4, 0.4],
      [0.24, 'C5', 4, 0.42],
      [0.36, 'E5', 4, 0.38],
    ],
  });
}

/** The episode, then the subscribe end card: OUTRO_LEN seconds longer, with a sting as the card appears. */
export function withOutro(episode: Episode): Episode {
  return {
    ...episode,
    duration: episode.duration + OUTRO_LEN,
    setup(stage) {
      const inner = episode.setup(stage);
      const outro = createOutro(stage.camera);
      let story: THREE.Scene | null = null; // the episode's scene when the card cut in, to restore on a seek back
      return {
        update(t) {
          if (t < episode.duration) {
            if (story) {
              stage.scene = story;
              story = null;
            }
            inner.update(t);
            return;
          }
          if (!story) {
            story = stage.scene;
            stage.scene = outro.scene;
          }
          outro.update(t - episode.duration);
        },
        dispose() {
          inner.dispose?.();
          outro.dispose();
        },
      };
    },
    audio(bus, t0) {
      episode.audio?.(bus, t0);
      sting(bus, t0 + episode.duration);
    },
  };
}
