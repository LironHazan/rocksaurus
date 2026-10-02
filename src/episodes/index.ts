import type { Episode } from '../engine/types';

// Register episodes here. The first one is the default.
import meetTiki from './meet-tiki';
import meetLulu from './meet-lulu';
import roryPizza from './rory-pizza';
import roryRocks from './rory-rocks';
import roryFriday from './rory-friday';
import roryHello from './rory-hello';

export const episodes: readonly Episode[] = [meetTiki, meetLulu, roryPizza, roryRocks, roryFriday, roryHello];

export const findEpisode = (id: string | null): Episode => episodes.find(e => e.id === id) ?? episodes[0]!;
