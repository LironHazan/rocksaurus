vi.mock('./recorder', () => ({ downloadBlob: vi.fn() })); // the recorder pulls in the audio graph
import { cropRect, snapshotName, PIN_SIZE } from './snapshot';

const PIN = PIN_SIZE.width / PIN_SIZE.height;

describe('cropRect', () => {
  it('trims a tall 9:16 frame to 2:3 from the top and bottom', () => {
    const r = cropRect(1080, 1920, PIN);
    expect(r.sw).toBe(1080);
    expect(r.sh).toBeCloseTo(1620, 5);
    expect(r.sx).toBe(0);
    expect(r.sy).toBeCloseTo(150, 5);
  });

  it('trims a wide 16:9 frame to 2:3 from the sides', () => {
    const r = cropRect(1920, 1080, PIN);
    expect(r.sh).toBe(1080);
    expect(r.sw).toBeCloseTo(720, 5);
    expect(r.sx).toBeCloseTo(600, 5);
    expect(r.sy).toBe(0);
  });

  it('keeps a frame that already has the right shape', () => {
    expect(cropRect(1000, 1500, PIN)).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 1500 });
  });
});

describe('snapshotName', () => {
  it('names the file after the episode, time and shape', () => {
    expect(snapshotName('meet-steggy', 4.25, 'pinterest')).toBe('meet-steggy-4.3s-pin.png');
    expect(snapshotName('meet-steggy', 4, 'full')).toBe('meet-steggy-4.0s-frame.png');
  });
});
