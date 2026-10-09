import { playBass, type BassPart } from './bass';
import { playDrums } from './drums';
import type { DrumPart } from './drum-patterns';
import { playRiff, type Riff } from './guitar';

/** A trio's parts: bass, drums (the smooth kit) and guitar, all on one song clock. */
export interface BandParts {
  bass: BassPart;
  drums: DrumPart;
  guitar: Riff;
}

/** The trio's levels: the whole band on the episode's bus, then the drums and the guitar inside it (the bass is at
 * the band's level, so it leads). */
export interface BandLevels {
  band: number;
  drums: number;
  guitar: number;
}

/** Plays a bass-led trio from `when` (AudioContext time): the song's 0 is `when`. */
export function playBand(bus: AudioNode, when: number, parts: BandParts, levels: BandLevels): void {
  const band = new GainNode(bus.context, { gain: levels.band });
  band.connect(bus);
  const guitar = new GainNode(bus.context, { gain: levels.guitar });
  guitar.connect(band);
  const drums = new GainNode(bus.context, { gain: levels.drums });
  drums.connect(band);
  playBass(band, when, parts.bass);
  playDrums(drums, when, parts.drums, { smooth: true });
  playRiff(guitar, when, parts.guitar);
}
