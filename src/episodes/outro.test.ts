import type { Episode } from '../engine/types';
import { OUTRO_LEN, STING, withOutro } from './outro';
import { timedNotes } from '../audio/keyboard-part';

const story: Episode = {
  id: 'story',
  title: 'A story',
  duration: 30,
  captions: [{ from: 1, to: 2, text: 'Hi' }],
  setup: () => ({ update: () => {} }),
  audio: vi.fn(),
};

describe('withOutro', () => {
  it('adds the end card to the end and keeps everything else', () => {
    const ep = withOutro(story);
    expect(ep.duration).toBe(story.duration + OUTRO_LEN);
    expect(ep.id).toBe(story.id);
    expect(ep.captions).toBe(story.captions);
  });

  it('plays the episode’s music', () => {
    const bus = new GainNode(new AudioContext());
    withOutro(story).audio!(bus, 10);
    expect(story.audio).toHaveBeenCalledWith(bus, 10);
  });
  it('stings with a rolled chord: the notes start together and roll up within half a second', () => {
    const starts = timedNotes(STING).map(n => n.start);
    expect(starts[0]).toBe(0);
    expect(Math.max(...starts)).toBeLessThan(0.5);
  });
});
