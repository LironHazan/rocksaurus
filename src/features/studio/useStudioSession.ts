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
 * (WebGL context, animation loop, audio) when the episode/format changes or the component unmounts.
 */
export function useStudioSession(episode: Episode, format: Format, debugCamera: DebugCamera | null) {
  const [session, setSession] = useState<StudioSession | null>(null);
  const camKey = debugCamera?.join(',') ?? '';

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const stage = createStage(node, format);
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
      const player = createPlayer(stage, episode);
      setSession({ stage, player });
      return () => {
        player.dispose();
        stage.dispose();
        setSession(null);
      };
    },
    [episode, format, camKey],
  );

  return { containerRef, session };
}
