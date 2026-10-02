import type { Episode } from '../engine/types';

// Register episodes here, grouped into folders for the studio sidebar. The first episode is the default.
import bandLive from './band-live';
import meetParis from './meet-paris';
import meetSteggy from './meet-steggy';
import meetTiki from './meet-tiki';
import meetLulu from './meet-lulu';
import roryPizza from './rory-pizza';
import roryRocks from './rory-rocks';
import roryFriday from './rory-friday';

export interface EpisodeFolder {
  id: string;
  title: string;
  episodes: readonly Episode[];
}

export const folders: readonly EpisodeFolder[] = [
  { id: 'the-band', title: 'The Band', episodes: [bandLive] },
  { id: 'meet-the-band', title: 'Meet the Band', episodes: [roryRocks, meetParis, meetSteggy, meetTiki, meetLulu] },
  { id: 'rory', title: 'Rory', episodes: [roryPizza, roryFriday] },
];

export const episodes: readonly Episode[] = folders.flatMap(f => f.episodes);

export const findEpisode = (id: string | null): Episode => episodes.find(e => e.id === id) ?? episodes[0]!;
