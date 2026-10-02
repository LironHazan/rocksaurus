// 4/4 @ 120 BPM, 16 steps (16th notes) per bar, 1 bar = 2 s. 8 bars = 16 s.
export const BPM = 120;
export const BEAT = 60 / BPM;
const REST = '................';
const bars = (pattern, n) => Array(n).fill(pattern).join(' ');

//                bar 0: count-in     bar 1: fill          bars 2–6: groove                     bar 7: end
export const drums = {
  bpm: BPM,
  tracks: {
    click:    ['x...x...x...x...', REST,               bars(REST, 5),                         REST].join(' '),
    snare:    [REST,               'xxxxxxxx........', bars('....X.......X...', 5),             REST].join(' '),
    tom:      [REST,               '........xxxx....', bars(REST, 5),                         REST].join(' '),
    floorTom: [REST,               '............xxxx', bars(REST, 5),                         REST].join(' '),
    kick:     [REST,               REST,               bars('x.......x.x.....', 5),             'X...............'].join(' '),
    hat:      [REST,               REST,               bars('x.x.x.x.x.x.x.x.', 4), 'x.x.x.x.x.x.x.o.', REST].join(' '),
    crash:    [REST,               REST,               'X...............', bars(REST, 4),     'X...............'].join(' '),
  },
};

export const BAND_IN = 4;   // seconds: groove starts
export const ENDING = 14;   // seconds: final crash
