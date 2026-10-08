import type { Episode } from '../engine/types';

// Register episodes here, grouped into folders for the studio sidebar. The first episode is the default.
import bandLive from './band-live';
import mondayCoffee from './monday-coffee';
import meetRory from './meet-rory';
import meetParis from './meet-paris';
import parisRotHotic from './paris-rot-hotic';
import meetSteggy from './meet-steggy';
import meetTiki from './meet-tiki';
import tikiGolazo from './tiki-golazo';
import meetLulu from './meet-lulu';
import luluOnCall from './lulu-on-call';
import officeBesties from './office-besties';
import steggyMatcha from './steggy-matcha';
import roryPizza from './rory-pizza';
import roryRocks from './rory-rocks';
import roryFriday from './rory-friday';

export interface EpisodeFolder {
  id: string;
  title: string;
  episodes: readonly Episode[];
}

export const folders: readonly EpisodeFolder[] = [
  { id: 'the-band', title: 'The Band', episodes: [bandLive, mondayCoffee] },
  { id: 'meet-the-band', title: 'Meet the Band', episodes: [meetRory, meetParis, meetSteggy, meetTiki, meetLulu] },
  { id: 'tiki', title: 'Tiki Taka', episodes: [tikiGolazo] },
  { id: 'paris', title: 'Paris', episodes: [parisRotHotic] },
  { id: 'lulu', title: 'Lulu', episodes: [luluOnCall, officeBesties] },
  { id: 'steggy', title: 'Steggy', episodes: [steggyMatcha] },
  { id: 'rory', title: 'Rory', episodes: [roryPizza, roryFriday, roryRocks] },
];

export const episodes: readonly Episode[] = folders.flatMap(f => f.episodes);

export const findEpisode = (id: string | null): Episode => episodes.find(e => e.id === id) ?? episodes[0]!;
