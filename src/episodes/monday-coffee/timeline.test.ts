import { CAPTIONS } from './captions';
import { CHAT, CUE, DURATION, MEMBERS, TYPING, chatAt } from './timeline';
import { SOUND } from './sound';

describe('Monday Coffee', () => {
  it('is a Short: under a minute', () => {
    expect(DURATION).toBeLessThanOrEqual(60);
  });

  it('the story happens in order', () => {
    const order = [
      CUE.parisSchool[0],
      CUE.steggySchool[0],
      CUE.ask[0],
      CUE.parisPhone[0],
      CUE.steggyPhone[0],
      CUE.tikiPhone[0],
      CUE.rory[0],
      CUE.therapy[0],
      CUE.peek,
      CUE.feel,
      CUE.fomo,
      CUE.cafe[0],
      CUE.clink,
      CUE.selfie,
      CUE.end,
      CUE.flop,
    ];
    order.forEach((t, i) => i > 0 && expect(t).toBeGreaterThan(order[i - 1]!));
    expect(CUE.flop).toBeLessThan(DURATION);
  });

  it('the chat is in order, from the five members, with time to read each message', () => {
    CHAT.forEach((m, i) => {
      expect(MEMBERS).toContain(m.from);
      expect(m.at).toBeLessThan(DURATION);
      if (i > 0) expect(m.at - CHAT[i - 1]!.at).toBeGreaterThanOrEqual(1.6);
    });
  });

  it('each message is sent while its sender’s phone (or someone’s) is on screen', () => {
    const onPhone = (t: number) =>
      [CUE.ask, CUE.parisPhone, CUE.steggyPhone, CUE.tikiPhone, CUE.rory, CUE.therapy, CUE.cafe].some(
        ([a, b]) => t >= a && t < b,
      );
    for (const m of CHAT) expect(onPhone(m.at)).toBe(true);
  });

  it('Lulu types her messages while she is reading, mid-session', () => {
    for (const m of CHAT.filter(c => c.from === 'Lulu')) {
      expect(m.at - TYPING).toBeGreaterThanOrEqual(CUE.peek);
      expect(m.at).toBeLessThan(CUE.feel);
    }
  });

  it('Rory never answers (he is asleep)', () => {
    expect(CHAT.some(m => m.from === 'Rory')).toBe(false);
  });

  it('chatAt shows who is typing (and how much) just before their message, then the message', () => {
    const first = CHAT[0]!;
    const halfway = chatAt(first.at - TYPING / 2);
    expect(halfway.pending?.from).toBe(first.from);
    expect(halfway.pending?.progress).toBeGreaterThan(0.3);
    expect(halfway.pending?.progress).toBeLessThan(0.7);
    expect(halfway.lines).toHaveLength(0);
    expect(chatAt(first.at).lines).toHaveLength(1);
    expect(chatAt(first.at).flash).toBe(1);
    expect(chatAt(DURATION).lines).toHaveLength(CHAT.length);
  });

  it('messages buzz on the phones nobody is holding (Rory asleep, Lulu in session)', () => {
    const at = (t: number) => SOUND.cues.find(e => e.at === t && (e.kind === 'pop' || e.kind === 'vibrate'))!.kind;
    expect(at(CHAT[0]!.at)).toBe('pop');
    expect(at(CHAT.find(m => m.at >= CUE.rory[0])!.at)).toBe('vibrate');
  });

  it('captions are capitalised and stay inside the video', () => {
    for (const c of CAPTIONS) {
      const first = c.text.replace(/^[^\p{L}]+/u, '')[0]!;
      expect(first).toBe(first.toUpperCase());
      expect(c.to).toBeLessThanOrEqual(DURATION);
      expect(c.from).toBeLessThan(c.to);
    }
  });

  it('every moment has a background bed under it', () => {
    for (let t = 0; t < DURATION; t += 0.5) expect(SOUND.beds.some(b => t >= b.from && t < b.to)).toBe(true);
  });

  it('the clock only ticks indoors, never at the café', () => {
    for (const e of SOUND.cues.filter(e => e.kind === 'tick')) {
      expect(e.at).toBeGreaterThanOrEqual(CUE.rory[0]);
      expect(e.at >= CUE.cafe[0] && e.at < CUE.end).toBe(false);
    }
  });
});
