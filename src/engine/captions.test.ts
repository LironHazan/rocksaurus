import { wrapText } from './captions';

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
