import type { Episode } from '../engine/types';

// Register episodes here. The first one is the default.
import bandLive from './band-live';
import meetParis from './meet-paris';
import meetSteggy from './meet-steggy';
import meetTiki from './meet-tiki';
import meetLulu from './meet-lulu';
import roryPizza from './rory-pizza';
import roryRocks from './rory-rocks';
import roryFriday from './rory-friday';
import roryHello from './rory-hello';

export const episodes: readonly Episode[] = [
  bandLive,
  meetParis,
  meetSteggy,
  meetTiki,
  meetLulu,
  roryPizza,
  roryRocks,
  roryFriday,
  roryHello,
];

export const findEpisode = (id: string | null): Episode => episodes.find(e => e.id === id) ?? episodes[0]!;
