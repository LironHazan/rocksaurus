import { FORMATS } from '../../engine/formats';
import type { Format } from '../../engine/types';

/**
 * The watch page renders the Shorts shape at 720×1280 instead of 1080×1920: crisp on a phone screen, and
 * about 44% fewer pixels for a mobile GPU to draw each frame. A module constant, because the studio session
 * is rebuilt whenever the format object changes.
 */
export const WATCH_FORMAT: Format = { ...FORMATS.shorts, label: 'Watch 9:16', width: 720, height: 1280 };
