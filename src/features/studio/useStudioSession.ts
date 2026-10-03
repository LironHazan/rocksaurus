import { useCallback, useState } from 'react';
import { createStage } from '../../engine/stage';
import { createPlayer, type Player } from '../../engine/player';
import type { Episode, Format, Stage } from '../../engine/types';
import { parseDebugCamera, type DebugCamera } from './debugCamera';

export interface StudioSession {
  stage: Stage;
  player: Player;
}

/**
 * Creates the stage + player inside the element the returned ref is attached to, and tears both down
 * (GPU device, animation loop, audio) when the episode/format changes or the component unmounts.
 *
 * Building a stage is async (the renderer initializes its backend), so the ref callback starts the work and
 * the cleanup may run before it finishes — hence the `cancelled` flag: a stage that arrives after teardown is
 * disposed immediately instead of leaking a device and a canvas.
 */
export function useStudioSession(episode: Episode, format: Format, debugCamera: DebugCamera | null) {
  const [session, setSession] = useState<StudioSession | null>(null);
  const camKey = debugCamera?.join(',') ?? '';

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      let live: StudioSession | null = null;
      let cancelled = false;

      void createStage(node, format).then(stage => {
        if (cancelled) {
          stage.dispose();
          return;
        }
        const cam = parseDebugCamera(camKey);
        if (cam) {
          const [x, y, z, lx, ly, lz] = cam;
          const render = stage.render;
          stage.render = overlay => {
            stage.camera.position.set(x, y, z);
            stage.camera.lookAt(lx, ly, lz);
            render(overlay);
          };
        }
        live = { stage, player: createPlayer(stage, episode) };
        setSession(live);
      });

      return () => {
        cancelled = true;
        live?.player.dispose();
        live?.stage.dispose();
        live = null;
        setSession(null);
      };
    },
    [episode, format, camKey],
  );

  return { containerRef, session };
}
