import type * as THREE from 'three';
import { picture, ROUND } from '../../world/interior';

// The sign Lulu tapes to her monitor. Yashinozarus's corner and Hack, the team chat, are shared: world/.

const font = (size: number, weight = 700) => `${weight} ${size}px ${ROUND}`;

/** The sign Lulu tapes to her monitor after the second time: a yellow sticky note, in marker. */
export function createSign(): THREE.Group {
  return picture(
    1.25,
    0.82,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1b1b22';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font(h * 0.2, 800);
      ctx.fillText('AI AGENT =', w / 2, h * 0.32);
      ctx.fillText('LOOP + TOOLS', w / 2, h * 0.62);
      ctx.font = font(h * 0.14, 600);
      ctx.fillText('(please)', w / 2, h * 0.86);
    },
    { px: 384, frame: null },
  );
}
