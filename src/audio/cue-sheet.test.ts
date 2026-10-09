import { browserStandIn } from '../test/browser-stand-in';
import { cueSheet, every, type Player } from './cue-sheet';

type Kind = 'pop' | 'ding';

/** Players that record what they were asked to play, and when. */
function recorder() {
  const played: [Kind, number][] = [];
  const player =
    (kind: Kind): Player =>
    (_bus, when) =>
      played.push([kind, when]);
  return { played, players: { pop: player('pop'), ding: player('ding') } };
}

describe('cueSheet', () => {
  it('sorts the cues by time', () => {
    const { players } = recorder();
    const sheet = cueSheet<Kind>({
      duration: 3,
      players,
      cues: [
        { at: 2, kind: 'ding' },
        { at: 0.5, kind: 'pop' },
        { at: 1, kind: 'pop' },
      ],
    });
    expect(sheet.cues.map(c => c.at)).toEqual([0.5, 1, 2]);
  });

  it('rejects a cue outside the video', () => {
    const { players } = recorder();
    expect(() => cueSheet<Kind>({ duration: 3, players, cues: [{ at: 3.1, kind: 'pop' }] })).toThrow(RangeError);
    expect(() => cueSheet<Kind>({ duration: 3, players, cues: [{ at: -0.1, kind: 'pop' }] })).toThrow(RangeError);
  });

  it('rejects a bed outside the video, or one that ends before it starts', () => {
    const { players } = recorder();
    const sheet = (from: number, to: number) => () =>
      cueSheet<Kind>({ duration: 3, players, cues: [], beds: [{ from, to, kind: 'room' }] });
    expect(sheet(0, 3.5)).toThrow(RangeError);
    expect(sheet(2, 1)).toThrow(RangeError);
    expect(sheet(0, 3)).not.toThrow();
  });

  it('plays each cue with its own player, offset by the start time', () => {
    const { played, players } = recorder();
    // Cues inside the scheduler's lookahead play at once, so the test needs no timers.
    const sheet = cueSheet<Kind>({
      duration: 1,
      players,
      cues: [
        { at: 0.4, kind: 'ding' },
        { at: 0.1, kind: 'pop' },
      ],
    });
    sheet.play(browserStandIn, 0.2);
    expect(played.map(([kind]) => kind)).toEqual(['pop', 'ding']);
    expect(played[0]![1]).toBeCloseTo(0.3);
    expect(played[1]![1]).toBeCloseTo(0.6);
  });
});

describe('every', () => {
  it('steps from the start up to, but not including, the end', () => {
    expect(every(1, 2, 0.25)).toEqual([1, 1.25, 1.5, 1.75]);
    expect(every(2, 2, 0.5)).toEqual([]);
  });
});
