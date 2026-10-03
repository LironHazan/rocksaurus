import { PHONE_QUERY } from './useIsPhone';

// The query is the whole rule, so check it matches what we mean by "a phone" (browsers evaluate it, jsdom can't).
describe('PHONE_QUERY', () => {
  it('needs a touch screen, narrow in portrait or short in landscape', () => {
    const parts = PHONE_QUERY.split(',').map(p => p.trim());
    expect(parts).toEqual(['(pointer: coarse) and (max-width: 700px)', '(pointer: coarse) and (max-height: 500px)']);
  });

  it('never matches a mouse on its own, so narrow desktop windows keep the studio', () => {
    for (const part of PHONE_QUERY.split(',')) expect(part).toContain('pointer: coarse');
  });
});
