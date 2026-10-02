import { drumHits } from './drum-patterns';

describe('drumHits', () => {
  it('turns step strings into timed hits (16th notes at the given BPM)', () => {
    const hits = drumHits({ bpm: 120, tracks: { kick: 'x...', snare: '..X.' } });
    // 120 BPM → a 16th note is 0.125 s
    expect(hits).toEqual([
      { name: 'kick', time: 0, accent: false, ch: 'x' },
      { name: 'snare', time: 0.25, accent: true, ch: 'X' },
    ]);
  });

  it('ignores spaces between bars and keeps open hi-hats', () => {
    const hits = drumHits({ bpm: 60, tracks: { hat: 'x... ..o.' } });
    expect(hits.map(h => [h.time, h.ch])).toEqual([
      [0, 'x'],
      [1.5, 'o'],
    ]);
  });

  it('sorts hits from all tracks by time', () => {
    const hits = drumHits({ bpm: 120, tracks: { snare: '.x', kick: 'x.' } });
    expect(hits.map(h => h.name)).toEqual(['kick', 'snare']);
  });
});
