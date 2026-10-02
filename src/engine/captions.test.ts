import { drawCaptions, wrapText } from './captions';
import { FORMATS } from './formats';

const measure = (s: string) => s.length * 10; // 10px per character

describe('wrapText', () => {
  it('keeps short text on one line', () => {
    expect(wrapText(measure, 'bye boss', 200)).toEqual(['bye boss']);
  });
  it('wraps long text at word boundaries', () => {
    expect(wrapText(measure, 'hugging my couch already', 120)).toEqual(['hugging my', 'couch', 'already']);
  });
  it('honors explicit line breaks', () => {
    expect(wrapText(measure, 'me leaving work at\n5:00 PM', 1000)).toEqual(['me leaving work at', '5:00 PM']);
  });
});

describe('drawCaptions', () => {
  const format = FORMATS.shorts;
  /** A 2D context stub that records where text is drawn. */
  function fakeCtx() {
    const calls: { align: string; x: number }[] = [];
    let x = 0;
    const ctx = {
      font: '',
      globalAlpha: 1,
      textAlign: 'center',
      textBaseline: 'middle',
      lineJoin: 'round',
      lineWidth: 1,
      strokeStyle: '',
      fillStyle: '',
      measureText: (s: string) => ({ width: s.length * 10 }),
      save() {},
      restore() {},
      translate(tx: number) {
        x = tx;
      },
      scale() {},
      strokeText() {},
      fillText() {
        calls.push({ align: ctx.textAlign, x });
      },
    };
    return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
  }

  it('centers captions by default', () => {
    const { ctx, calls } = fakeCtx();
    drawCaptions(ctx, [{ from: 0, to: 2, text: 'hi' }], 1, format);
    expect(calls).toEqual([{ align: 'center', x: format.width / 2 }]);
  });

  it('left-aligns subtitle-style captions near the left edge', () => {
    const { ctx, calls } = fakeCtx();
    drawCaptions(ctx, [{ from: 0, to: 2, text: 'hi', align: 'left' }], 1, format);
    expect(calls[0]?.align).toBe('left');
    expect(calls[0]?.x).toBeLessThan(format.width * 0.1);
  });

  it('skips captions outside their time window', () => {
    const { ctx, calls } = fakeCtx();
    drawCaptions(ctx, [{ from: 0, to: 2, text: 'hi' }], 3, format);
    expect(calls).toEqual([]);
  });
});
