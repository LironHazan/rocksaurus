import type { Episode } from '../engine/types';
import { OUTRO_LEN, withOutro } from './outro';
import { playKeyboardPart } from '../audio/keyboard-part';

vi.mock('../audio/keyboard-part', () => ({ playKeyboardPart: vi.fn() }));

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

  it('plays the episode’s music, then the sting as the card appears', () => {
    const bus = {} as GainNode;
    withOutro(story).audio!(bus, 10);
    expect(story.audio).toHaveBeenCalledWith(bus, 10);
    expect(playKeyboardPart).toHaveBeenCalledWith(
      bus,
      10 + story.duration,
      expect.objectContaining({ sound: 'piano' }),
    );
  });
});
