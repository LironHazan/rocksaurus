import type { Caption } from '../../engine/types';
import { sub, punch } from '../../engine/subtitles';

export const CAPTIONS: Caption[] = [
  sub(0.3, 3.6, 'Meet Rory: guitar 🎸'),
  punch(0.9, 3.6, 'Tiny arms. Massive riffs'),
  sub(3.8, 7.0, 'The mohawk stays up by itself'),
  punch(4.4, 7.0, 'Powered by pure distortion'),
  sub(7.2, 10.6, 'Practices 8 hours a day'),
  punch(7.8, 10.6, 'Mostly the same riff'),
  sub(11.0, 13.9, 'Rory, ladies and gentlemen 🤘'),
  punch(11.6, 13.9, 'Turn it up to 11'),
];
